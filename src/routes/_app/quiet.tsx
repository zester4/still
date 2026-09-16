import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CrisisCard } from "@/components/crisis-card";
import { StillPhoto } from "@/components/site-chrome";

export const Route = createFileRoute("/_app/quiet")({ component: QuietPage });

type Practice = "sit" | "senses" | "night" | null;

const SENSE_STEPS = [
  { n: 5, prompt: "Five things you can see." },
  { n: 4, prompt: "Four things you can feel — fabric, air, the chair." },
  { n: 3, prompt: "Three things you can hear, even small ones." },
  { n: 2, prompt: "Two things you can smell, or the memory of a smell." },
  { n: 1, prompt: "One slow breath. That's enough." },
];

function QuietPage() {
  const [practice, setPractice] = useState<Practice>(null);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Quiet</p>
      <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">A room, not a program.</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        Optional. Not treatment. Some people like a few minutes of sitting, or naming what's in the room,
        before they talk.
      </p>

      <StillPhoto
        src="/images/water.jpg"
        alt="Still water at dusk."
        width={1400}
        height={933}
        className="mt-8 aspect-[16/8] rounded-xl"
      />

      {practice === null ? (
        <div className="mt-8 grid gap-2">
          <Choice
            title="Sit"
            body="One, three, or five minutes. No goal except staying for the time you chose."
            onClick={() => setPractice("sit")}
          />
          <Choice
            title="Notice the room"
            body="A slow walk through what you can see, feel, hear. Skip any step."
            onClick={() => setPractice("senses")}
          />
          <Choice
            title="A hard night"
            body="If this is one of those hours. A door to a person, and a place to talk."
            onClick={() => setPractice("night")}
          />
        </div>
      ) : (
        <div className="mt-8">
          <Button variant="ghost" size="sm" onClick={() => setPractice(null)}>
            Back
          </Button>
          {practice === "sit" ? <Sit /> : null}
          {practice === "senses" ? <Senses /> : null}
          {practice === "night" ? <Night /> : null}
        </div>
      )}
    </div>
  );
}

function Choice({ title, body, onClick }: { title: string; body: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-surface px-4 py-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
    >
      <p className="text-sm font-medium text-fg">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
    </button>
  );
}

function Sit() {
  const [minutes, setMinutes] = useState<1 | 3 | 5 | null>(null);
  const [left, setLeft] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!minutes || done) return;
    setLeft(minutes * 60);
    const started = Date.now();
    const total = minutes * 60 * 1000;
    const id = window.setInterval(() => {
      const remain = Math.max(0, Math.ceil((total - (Date.now() - started)) / 1000));
      setLeft(remain);
      if (remain <= 0) {
        window.clearInterval(id);
        setDone(true);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [minutes, done]);

  if (!minutes) {
    return (
      <div className="mt-4">
        <h2 className="font-display text-2xl font-medium tracking-tight">How long?</h2>
        <p className="mt-2 text-sm text-muted">You can stop whenever. The time is only a shape.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {([1, 3, 5] as const).map((m) => (
            <Button key={m} variant="quiet" onClick={() => setMinutes(m)}>
              {m} {m === 1 ? "minute" : "minutes"}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  const label = done
    ? "That's enough."
    : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <div className="mt-6 flex flex-col items-center py-8">
      <div className="breathe-orb size-40 rounded-full bg-surface-2 shadow-[var(--shadow-border)]" />
      <p className="font-display mt-8 text-3xl font-medium tracking-tight">{label}</p>
      <p className="mt-2 text-sm text-muted">
        {done ? "You can stay, or leave, or go talk." : "In and out. No need to get it right."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {done ? (
          <Button asChild>
            <Link to="/talk">Talk</Link>
          </Button>
        ) : (
          <Button
            variant="ghost"
            onClick={() => {
              setDone(true);
              setLeft(0);
            }}
          >
            Stop early
          </Button>
        )}
      </div>
    </div>
  );
}

function Senses() {
  const [step, setStep] = useState(0);
  const current = SENSE_STEPS[step];
  const last = step >= SENSE_STEPS.length - 1;

  return (
    <div className="mt-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        {step + 1} of {SENSE_STEPS.length}
      </p>
      <h2 className="font-display mt-3 text-2xl font-medium tracking-tight">{current.prompt}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        You don't have to name them out loud. Skipping is fine.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        {last ? (
          <>
            <Button asChild>
              <Link to="/talk">Talk</Link>
            </Button>
            <Button variant="quiet" onClick={() => setStep(0)}>
              Again
            </Button>
          </>
        ) : (
          <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
        )}
      </div>
    </div>
  );
}

function Night() {
  return (
    <div className="mt-4">
      <h2 className="font-display text-2xl font-medium tracking-tight">If this is a hard night.</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        You can stay here. You can talk. If you need a person, that door is first — not a last resort.
      </p>
      <StillPhoto
        src="/images/chair.jpg"
        alt="A chair left by the window at night."
        width={1400}
        height={933}
        className="mt-6 aspect-[3/2] rounded-xl"
      />
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/talk">Talk</Link>
        </Button>
        <Button variant="quiet" asChild>
          <Link to="/letters">Write a letter</Link>
        </Button>
      </div>
      <div className="mt-6 max-w-xl">
        <CrisisCard />
      </div>
    </div>
  );
}