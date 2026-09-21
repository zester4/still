"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MOOD_LABEL, type Mood } from "@/lib/companion/types";
import { cn } from "@/lib/utils";

const MOODS: Mood[] = ["heavy", "mixed", "lighter", "unsure"];

export function CheckInPrompt({
  onAnswer,
  onLater,
}: {
  onAnswer: (mood: Mood, note: string) => void;
  onLater: () => void;
}) {
  const [mood, setMood] = useState<Mood | null>(null);
  const [note, setNote] = useState("");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-4">
      <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          Thinking of you
        </p>
        <h2 className="font-display mt-2 text-xl font-medium tracking-tight text-fg">
          How's today sitting with you?
        </h2>
        <p className="mt-1 text-sm text-muted">No right answer. Skip anytime.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(m)}
              className={cn(
                "h-11 rounded-md text-sm transition-colors duration-150",
                mood === m ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg shadow-[var(--shadow-border)]",
              )}
            >
              {MOOD_LABEL[m]}
            </button>
          ))}
        </div>
        <Textarea
          className="mt-3 min-h-20"
          placeholder="Anything you want to leave here — optional."
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 400))}
        />
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onLater}>
            Not now
          </Button>
          <Button type="button" disabled={!mood} onClick={() => mood && onAnswer(mood, note)}>
            Leave this
          </Button>
        </div>
      </div>
    </div>
  );
}
