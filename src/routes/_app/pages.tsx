import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import type { Conversation } from "@/lib/companion/types";
import { useStillStore } from "@/lib/store/still-store";

export const Route = createFileRoute("/_app/pages")({ component: PagesPage });

function preview(c: Conversation) {
  const first = c.messages.find((m) => m.role === "user")?.content.trim();
  if (!first) return "An empty page. Nothing written yet.";
  return first.replace(/\s+/g, " ").slice(0, 140);
}

function PagesPage() {
  const conversations = useStillStore((s) => s.conversations);
  const activeId = useStillStore((s) => s.activeConversationId);
  const openConversation = useStillStore((s) => s.openConversation);
  const startNewPage = useStillStore((s) => s.startNewPage);
  const navigate = useNavigate();

  function open(id: string) {
    openConversation(id);
    void navigate({ to: "/talk" });
  }

  function fresh() {
    startNewPage();
    void navigate({ to: "/talk" });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:py-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Pages</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">Talks you've had.</h1>
        <Button size="sm" variant="quiet" onClick={fresh}>
          New page
        </Button>
      </div>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        Each page is a sitting. You can leave one and open another. Nothing is scored.
      </p>

      {conversations.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No pages yet. Whenever you're ready.</p>
      ) : (
        <ul className="mt-8 flex flex-col gap-2">
          {conversations.map((c) => {
            const active = c.id === activeId;
            const users = c.messages.filter((m) => m.role === "user").length;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => open(c.id)}
                  className="w-full rounded-xl bg-surface px-4 py-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-fg">
                      {active ? "Open now" : formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                    </p>
                    <p className="text-[11px] text-subtle">
                      {users} {users === 1 ? "thing you said" : "things you said"}
                    </p>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{preview(c)}</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
