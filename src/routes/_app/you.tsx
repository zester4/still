"use client";

import { Link } from "@/lib/nav";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CrisisCard } from "@/components/crisis-card";
import { INTENT_LABEL, type Intent } from "@/lib/companion/types";
import { intentPattern, useStillStore } from "@/lib/store/still-store";
import { Separator } from "@/components/ui/separator";

export function YouPage() {
  const name = useStillStore((s) => s.name);
  const setName = useStillStore((s) => s.setName);
  const pulses = useStillStore((s) => s.pulses);
  const createdAt = useStillStore((s) => s.createdAt);
  const exportData = useStillStore((s) => s.exportData);
  const wipeAll = useStillStore((s) => s.wipeAll);
  const conversations = useStillStore((s) => s.conversations);
  const memories = useStillStore((s) => s.memories);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [draftName, setDraftName] = useState(name);

  const pattern = useMemo(() => summarizeIntents(intentPattern(useStillStore.getState())), [conversations]);

  function download() {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "still-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:py-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">You</p>
      <h1 className="font-display mt-1 text-2xl font-medium tracking-tight sm:text-3xl">This space is yours.</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Here since {format(new Date(createdAt), "MMMM d, yyyy")}. {conversations.length}{" "}
        {conversations.length === 1 ? "page" : "pages"} of talk. {memories.length} remembered.
      </p>

      <section className="mt-8 grid gap-2 sm:grid-cols-2">
        <Place to="/pages" title="Pages" body="Past talks, kept as they were." />
        <Place to="/quiet" title="Quiet" body="Sit, notice the room, or a hard night." />
        <Place to="/letters" title="Letters" body="Write something you don't have to send." />
        <Place to="/patterns" title="Patterns" body="How the weeks have felt. Not a score." />
        <Place to="/memory" title="Memory" body="What you asked Still to keep." />
        <Place to="/check-ins" title="Check-ins" body="A knock, if you want one." />
      </section>

      <section className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <Label htmlFor="you-name">What to call you</Label>
        <div className="mt-2 flex gap-2">
          <Input
            id="you-name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value.slice(0, 40))}
          />
          <Button
            variant="quiet"
            size="sm"
            onClick={() => setName(draftName)}
            disabled={draftName.trim() === name}
          >
            Save
          </Button>
        </div>
      </section>

      {pattern ? (
        <section className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
            A pattern Still noticed
          </p>
          <p className="mt-2 text-sm leading-relaxed text-fg">{pattern}</p>
        </section>
      ) : null}

      <section className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          Did you feel understood
        </p>
        {pulses.length === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            After a longer talk, Still will ask once. Your answer stays here — not as a scoreboard.
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

      <Separator className="my-8" />

      <section>
        <h2 className="font-display text-2xl font-medium tracking-tight">What this is</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
          <p>
            Still is an AI companion. It is not a therapist, not a clinician, and not a crisis service.
            It does not diagnose, prescribe, or replace psychiatric or psychological care.
          </p>
          <p>
            In some places, including Illinois, using AI as therapy is restricted or banned. Still is
            designed as a companion — a place to talk — and says so plainly.
          </p>
          <p>
            Memory lives on this device for now. A later backend can sync it; until then, you can export
            or erase everything below.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="quiet" asChild>
            <Link to="/about">About Still</Link>
          </Button>
          <Button variant="quiet" asChild>
            <Link to="/memory">Review memory</Link>
          </Button>
          <Button variant="quiet" asChild>
            <Link to="/check-ins">Check-in settings</Link>
          </Button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-medium tracking-tight">If you need a person</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Always available. Not only in a crisis. You do not have to wait until it feels like an emergency.
        </p>
        <CrisisCard />
      </section>

      <Separator className="my-8" />

      <section>
        <h2 className="font-display text-2xl font-medium tracking-tight">Your data</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Conversations, memory, check-ins, and pulse answers stay on this device. Export a copy, or erase it.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="quiet" onClick={download}>
            Export JSON
          </Button>
          <Button variant="outline" onClick={() => setConfirmWipe(true)}>
            Erase everything
          </Button>
        </div>
      </section>

      <p className="mt-12 text-xs leading-relaxed text-subtle">
        Still · companion, not care · if this product is ever used with real people, the crisis path
        needs clinical review before launch.
      </p>

      <Dialog open={confirmWipe} onOpenChange={setConfirmWipe}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erase everything?</DialogTitle>
            <DialogDescription>
              Talks, memory, check-ins, and answers will be removed from this device. This cannot be undone
              unless you already exported.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmWipe(false)}>
              Keep it
            </Button>
            <Button
              variant="crisis"
              onClick={() => {
                wipeAll();
                setConfirmWipe(false);
                window.location.href = "/";
              }}
            >
              Erase
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Place({ to, title, body }: { to: "/pages" | "/quiet" | "/letters" | "/patterns" | "/memory" | "/check-ins"; title: string; body: string }) {
  return (
    <Link
      to={to}
      className="rounded-xl bg-surface px-3.5 py-3 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)] sm:px-4 sm:py-4"
    >
      <p className="text-sm font-medium text-fg">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted sm:mt-1 sm:text-sm">{body}</p>
    </Link>
  );
}

function summarizeIntents(list: Intent[]): string | null {
  if (list.length < 3) return null;
  const counts = new Map<Intent, number>();
  for (const i of list) counts.set(i, (counts.get(i) ?? 0) + 1);
  const ranked = [...counts.entries()]
    .filter(([k]) => k !== "escalating-risk")
    .sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return null;
  const [top, second] = ranked;
  if (!top) return null;
  if (second && second[1] > 1) {
    return `Lately your talks have leaned toward ${INTENT_LABEL[top[0]].toLowerCase()}, and sometimes ${INTENT_LABEL[second[0]].toLowerCase()}.`;
  }
  return `Lately your talks have leaned toward ${INTENT_LABEL[top[0]].toLowerCase()}.`;
}
