"use client";

import { Link } from "@/lib/nav";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { INTENT_LABEL, MOOD_LABEL, type Intent, type Mood } from "@/lib/companion/types";
import { intentPattern, useStillStore } from "@/lib/store/still-store";
import { cn } from "@/lib/utils";

const MOOD_DOT: Record<Mood, string> = {
  heavy: "bg-muted",
  mixed: "bg-fg/55",
  lighter: "bg-ok",
  unsure: "bg-subtle",
};

export function PatternsPage() {
  const checkIns = useStillStore((s) => s.checkIns);
  const pulses = useStillStore((s) => s.pulses);
  const memories = useStillStore((s) => s.memories);
  const conversations = useStillStore((s) => s.conversations);
  const createdAt = useStillStore((s) => s.createdAt);
  const intents = intentPattern(useStillStore.getState());

  const moodEntries = checkIns.entries.slice(0, 21);
  const counts = countIntents(intents);
  const totalIntents = counts.reduce((n, [, v]) => n + v, 0);
  const talks = conversations.filter((c) => c.messages.some((m) => m.role === "user")).length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:py-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Patterns</p>
      <h1 className="font-display mt-1 text-2xl font-medium tracking-tight sm:text-3xl">How it's been, not a score.</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        From check-ins, talks, and what you asked Still to keep. Nothing here is a diagnosis.
      </p>

      <section className="mt-8 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">This space</p>
        <p className="mt-2 text-sm leading-relaxed text-fg">
          Here since {format(new Date(createdAt), "MMMM d, yyyy")}. {talks}{" "}
          {talks === 1 ? "talk" : "talks"} with something said. {memories.length} remembered.
        </p>
      </section>

      <section className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Check-ins</p>
        {moodEntries.length === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            When you answer a knock, the mood will sit here as a quiet row. Not a streak.
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {moodEntries
                .slice()
                .reverse()
                .map((e) => (
                  <span
                    key={e.id}
                    title={`${MOOD_LABEL[e.mood]} · ${format(new Date(e.at), "MMM d")}`}
                    className={cn("size-2.5 rounded-full", MOOD_DOT[e.mood])}
                  />
                ))}
            </div>
            <ul className="mt-4 space-y-2">
              {moodEntries.slice(0, 6).map((e) => (
                <li key={e.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-fg">{MOOD_LABEL[e.mood]}</span>
                  <span className="text-xs text-subtle">{format(new Date(e.at), "MMM d")}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <Button variant="ghost" size="sm" className="mt-3 px-0" asChild>
          <Link to="/check-ins">Check-in settings</Link>
        </Button>
      </section>

      <section className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">In talks</p>
        {totalIntents < 3 ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            After a few conversations, Still can name a lean — venting, reflecting, looking for a way through.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {counts.map(([intent, n]) => (
              <li key={intent}>
                <div className="flex items-baseline justify-between text-sm">
                  <span>{INTENT_LABEL[intent]}</span>
                  <span className="text-xs text-subtle">{n}</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.max(8, Math.round((n / totalIntents) * 100))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Understood?</p>
        {pulses.length === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            After a longer talk, Still asks once. Your answer lives here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {pulses.slice(0, 8).map((p) => (
              <li key={p.id} className="flex items-baseline justify-between text-sm">
                <span className="text-fg">
                  {p.value === "yes" ? "Yes" : p.value === "somewhat" ? "Somewhat" : "Not really"}
                </span>
                <span className="text-xs text-subtle">{format(new Date(p.at), "MMM d")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {memories.length > 0 ? (
        <section className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Kept</p>
          <ul className="mt-3 space-y-2">
            {memories.slice(0, 6).map((m) => (
              <li key={m.id} className="text-sm text-fg">
                {m.title}
              </li>
            ))}
          </ul>
          <Button variant="ghost" size="sm" className="mt-3 px-0" asChild>
            <Link to="/memory">All of memory</Link>
          </Button>
        </section>
      ) : null}
    </div>
  );
}

function countIntents(list: Intent[]) {
  const map = new Map<Intent, number>();
  for (const i of list) {
    if (i === "escalating-risk") continue;
    map.set(i, (map.get(i) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}
