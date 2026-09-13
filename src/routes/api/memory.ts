import { createFileRoute } from "@tanstack/react-router";
import { aiAvailable, extractMemories, type ChatTurn } from "@/lib/companion/xai.server";
import type { MemoryItem } from "@/lib/companion/types";

type Body = {
  history?: ChatTurn[];
  existing?: MemoryItem[];
};

export const Route = createFileRoute("/api/memory")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }
        if (!aiAvailable()) {
          return Response.json({ items: [] });
        }
        try {
          const items = await extractMemories({
            history: body.history ?? [],
            existing: body.existing ?? [],
          });
          return Response.json({ items });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "extract failed";
          return Response.json({ error: msg, items: [] }, { status: 502 });
        }
      },
    },
  },
});
