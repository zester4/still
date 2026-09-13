import { detectCrisis, crisisCompanionText } from "./safety";
import { classifyLocal, localCompanionReply } from "./local";
import type { ChatTurn, Intent, MemoryItem } from "./types";

export type StreamEvent =
  | { type: "intent"; intent: Intent }
  | { type: "delta"; text: string }
  | { type: "crisis"; text: string }
  | { type: "replace"; crisis?: boolean; text: string; intent?: Intent }
  | { type: "error"; error: string }
  | { type: "done" };

export async function sendToCompanion(
  input: {
    message: string;
    name: string;
    concerns: string[];
    memories: MemoryItem[];
    history: ChatTurn[];
  },
  onEvent: (ev: StreamEvent) => void,
) {
  if (detectCrisis(input.message)) {
    onEvent({ type: "intent", intent: "escalating-risk" });
    onEvent({ type: "crisis", text: crisisCompanionText() });
    onEvent({ type: "done" });
    return;
  }

  const res = await fetch("/api/companion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok || !res.body) {
    const intent = classifyLocal(input.message);
    onEvent({ type: "intent", intent });
    onEvent({
      type: "delta",
      text: localCompanionReply({
        message: input.message,
        name: input.name,
        intent,
        memories: input.memories,
        history: input.history,
      }),
    });
    onEvent({ type: "done" });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.startsWith("data:"));
      if (!line) continue;
      try {
        const ev = JSON.parse(line.slice(5).trim()) as StreamEvent;
        onEvent(ev);
      } catch {
        /* ignore */
      }
    }
  }
}

export async function requestMemoryExtract(input: {
  history: ChatTurn[];
  existing: MemoryItem[];
}): Promise<Array<{ kind: MemoryItem["kind"]; title: string; detail: string }>> {
  const res = await fetch("/api/memory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    items?: Array<{ kind: MemoryItem["kind"]; title: string; detail: string }>;
  };
  return json.items ?? [];
}
