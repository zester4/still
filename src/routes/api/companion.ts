import { createFileRoute } from "@tanstack/react-router";
import { crisisCompanionText, detectCrisis, outputLooksUnsafe } from "@/lib/companion/safety";
import { classifyLocal, localCompanionReply } from "@/lib/companion/local";
import {
  aiAvailable,
  classifyIntent,
  sseEvent,
  streamCompanion,
  type ChatTurn,
} from "@/lib/companion/llm.server";
import type { Intent, MemoryItem } from "@/lib/companion/types";

type Body = {
  message: string;
  name?: string;
  concerns?: string[];
  memories?: MemoryItem[];
  history?: ChatTurn[];
};

function textStream(events: unknown[]) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const ev of events) {
        controller.enqueue(encoder.encode(sseEvent(ev)));
      }
      controller.close();
    },
  });
}

const sseHeaders = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

function localStream(input: {
  message: string;
  name: string;
  intent: Intent;
  memories: MemoryItem[];
  history: ChatTurn[];
  crisis?: boolean;
}) {
  if (input.crisis || input.intent === "escalating-risk") {
    return textStream([
      { type: "intent", intent: "escalating-risk" },
      { type: "crisis", text: crisisCompanionText() },
      { type: "done" },
    ]);
  }
  const text = localCompanionReply(input);
  return textStream([
    { type: "intent", intent: input.intent },
    { type: "delta", text },
    { type: "done" },
  ]);
}

export const Route = createFileRoute("/api/companion")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }

        const message = (body.message ?? "").trim().slice(0, 2000);
        if (!message) return Response.json({ error: "Empty message" }, { status: 400 });

        const name = body.name ?? "";
        const memories = (body.memories ?? []).slice(0, 12);
        const history: ChatTurn[] = [
          ...(body.history ?? []).slice(-16),
          { role: "user", content: message },
        ];

        if (detectCrisis(message)) {
          return new Response(localStream({ message, name, memories, history, intent: "escalating-risk", crisis: true }), {
            headers: sseHeaders,
          });
        }

        const localIntent = classifyLocal(message);

        if (!aiAvailable()) {
          return new Response(
            localStream({ message, name, memories, history, intent: localIntent }),
            { headers: sseHeaders },
          );
        }

        let intent: Intent = localIntent;
        try {
          intent = await classifyIntent(message);
        } catch {
          intent = detectCrisis(message) ? "escalating-risk" : localIntent;
        }

        if (intent === "escalating-risk" || detectCrisis(message)) {
          return new Response(
            localStream({ message, name, memories, history, intent: "escalating-risk", crisis: true }),
            { headers: sseHeaders },
          );
        }

        try {
          const upstream = await streamCompanion({
            name,
            intent,
            memories,
            concerns: body.concerns ?? [],
            history,
          });

          const encoder = new TextEncoder();
          const decoder = new TextDecoder();
          let buffer = "";
          let assembled = "";
          let sentUnsafe = false;

          const stream = new ReadableStream({
            async start(controller) {
              controller.enqueue(encoder.encode(sseEvent({ type: "intent", intent })));
              const reader = upstream.getReader();
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split("\n");
                  buffer = lines.pop() ?? "";
                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith("data:")) continue;
                    const payload = trimmed.slice(5).trim();
                    if (payload === "[DONE]") continue;
                    try {
                      const json = JSON.parse(payload) as {
                        choices?: { delta?: { content?: string } }[];
                      };
                      const delta = json.choices?.[0]?.delta?.content ?? "";
                      if (!delta) continue;
                      assembled += delta;
                      if (outputLooksUnsafe(assembled)) {
                        sentUnsafe = true;
                        break;
                      }
                      controller.enqueue(encoder.encode(sseEvent({ type: "delta", text: delta })));
                    } catch {
                      /* ignore partial json */
                    }
                  }
                  if (sentUnsafe) break;
                }
                if (sentUnsafe) {
                  controller.enqueue(
                    encoder.encode(
                      sseEvent({
                        type: "replace",
                        crisis: true,
                        text: crisisCompanionText(),
                        intent: "escalating-risk",
                      }),
                    ),
                  );
                }
                controller.enqueue(encoder.encode(sseEvent({ type: "done" })));
              } catch (err) {
                const fallback = localCompanionReply({
                  message,
                  name,
                  intent,
                  memories,
                  history,
                });
                if (!assembled) {
                  controller.enqueue(encoder.encode(sseEvent({ type: "delta", text: fallback })));
                }
                void err;
                controller.enqueue(encoder.encode(sseEvent({ type: "done" })));
              } finally {
                controller.close();
              }
            },
          });

          return new Response(stream, { headers: sseHeaders });
        } catch {
          return new Response(
            localStream({ message, name, memories, history, intent }),
            { headers: sseHeaders },
          );
        }
      },
    },
  },
});
