import { detectCrisis, outputLooksUnsafe } from "./safety";
import { classifySystemPrompt, companionSystemPrompt, extractSystemPrompt } from "./prompts";
import type { ChatTurn, Intent, MemoryItem } from "./types";
import { INTENTS } from "./types";

export type { ChatTurn };

type Provider = "openrouter" | "xai";

function openRouterKey() {
  return process.env.OPENROUTER_API_KEY?.trim() || "";
}

function xaiKey() {
  return process.env.XAI_API_KEY?.trim() || "";
}

function provider(): Provider | null {
  if (openRouterKey()) return "openrouter";
  if (xaiKey()) return "xai";
  return null;
}

export function aiAvailable() {
  return provider() !== null;
}

function apiKey(p: Provider) {
  return p === "openrouter" ? openRouterKey() : xaiKey();
}

function endpoint(p: Provider) {
  return p === "openrouter"
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.x.ai/v1/chat/completions";
}

function model(p: Provider) {
  if (p === "openrouter") {
    return process.env.OPENROUTER_MODEL?.trim() || "anthropic/claude-sonnet-4";
  }
  return process.env.XAI_MODEL?.trim() || "grok-4.5";
}

function headers(p: Provider, key: string): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
  if (p === "openrouter") {
    h["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL?.trim() || "https://still.app";
    h["X-Title"] = "Still";
  }
  return h;
}

async function llmChat(body: Record<string, unknown>) {
  const p = provider();
  if (!p) throw new Error("AI is not available in this environment");
  const key = apiKey(p);
  const res = await fetch(endpoint(p), {
    method: "POST",
    headers: headers(p, key),
    body: JSON.stringify({ model: model(p), ...body }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`LLM API error ${res.status}${errText ? `: ${errText.slice(0, 180)}` : ""}`);
  }
  return res;
}

function parseIntent(raw: string): Intent {
  try {
    const json = JSON.parse(raw.replace(/```json|```/g, "").trim()) as { intent?: string };
    if (json.intent && (INTENTS as readonly string[]).includes(json.intent)) {
      return json.intent as Intent;
    }
  } catch {
    /* fall through */
  }
  const found = INTENTS.find((i) => raw.toLowerCase().includes(i));
  return found ?? "venting";
}

export async function classifyIntent(message: string): Promise<Intent> {
  if (detectCrisis(message)) return "escalating-risk";
  const res = await llmChat({
    temperature: 0,
    max_tokens: 60,
    messages: [
      { role: "system", content: classifySystemPrompt() },
      { role: "user", content: message.slice(0, 2000) },
    ],
  });
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = body.choices?.[0]?.message?.content ?? "";
  const intent = parseIntent(text);
  if (intent !== "escalating-risk" && detectCrisis(message)) return "escalating-risk";
  return intent;
}

export async function streamCompanion(input: {
  name: string;
  intent: Intent;
  memories: MemoryItem[];
  concerns: string[];
  history: ChatTurn[];
}): Promise<ReadableStream<Uint8Array>> {
  const messages = [
    {
      role: "system",
      content: companionSystemPrompt({
        name: input.name,
        intent: input.intent,
        memories: input.memories,
        concerns: input.concerns,
      }),
    },
    ...input.history.slice(-16).map((m) => ({
      role: m.role === "companion" ? "assistant" : "user",
      content: m.content.slice(0, 2500),
    })),
  ];

  const res = await llmChat({
    stream: true,
    temperature: 0.7,
    max_tokens: 450,
    messages,
  });

  if (!res.body) throw new Error("No stream from the language model");
  return res.body;
}

export async function extractMemories(input: {
  history: ChatTurn[];
  existing: MemoryItem[];
}): Promise<Array<{ kind: MemoryItem["kind"]; title: string; detail: string }>> {
  const transcript = input.history
    .slice(-20)
    .map((m) => `${m.role === "user" ? "Them" : "Still"}: ${m.content}`)
    .join("\n");
  const existing = input.existing
    .slice(0, 12)
    .map((m) => `${m.kind}: ${m.title}`)
    .join("; ");

  const res = await llmChat({
    temperature: 0.2,
    max_tokens: 400,
    messages: [
      { role: "system", content: extractSystemPrompt() },
      {
        role: "user",
        content: `Already remembered: ${existing || "none"}\n\nConversation:\n${transcript.slice(0, 6000)}`,
      },
    ],
  });
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = body.choices?.[0]?.message?.content ?? '{"items":[]}';
  try {
    const json = JSON.parse(text.replace(/```json|```/g, "").trim()) as {
      items?: Array<{ kind?: string; title?: string; detail?: string }>;
    };
    const kinds = new Set(["theme", "person", "situation", "coping", "goal"]);
    return (json.items ?? [])
      .filter(
        (i) =>
          i &&
          typeof i.title === "string" &&
          typeof i.detail === "string" &&
          kinds.has(i.kind ?? "") &&
          !outputLooksUnsafe(`${i.title} ${i.detail}`),
      )
      .slice(0, 3)
      .map((i) => ({
        kind: i.kind as MemoryItem["kind"],
        title: i.title!.slice(0, 80),
        detail: i.detail!.slice(0, 280),
      }));
  } catch {
    return [];
  }
}

export function sseEvent(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}
