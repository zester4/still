import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { StillMark } from "@/components/still-mark";
import { Splash } from "@/components/splash";
import { CONCERN_OPTIONS, type CheckInFrequency } from "@/lib/companion/types";
import { useStillStore } from "@/lib/store/still-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/start")({ component: StartPage });

function StartPage() {
  const hydrated = useStillStore((s) => s.hydrated);
  const onboarded = useStillStore((s) => s.onboarded);
  const navigate = useNavigate();

  if (hydrated && onboarded) {
    void navigate({ to: "/talk" });
    return <Splash />;
  }

  return <Onboarding />;
}

function Onboarding() {
  const complete = useStillStore((s) => s.completeOnboarding);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [checkIns, setCheckIns] = useState(false);
  const [frequency, setFrequency] = useState<CheckInFrequency>("few");

  function finish() {
    complete({
      name,
      concerns,
      checkInsEnabled: checkIns,
      frequency,
    });
    void navigate({ to: "/talk" });
  }

  return (
    <div className="still-vignette min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-6 py-16">
        {step === 0 ? (
          <div>
            <Link to="/" className="inline-flex">
              <StillMark className="rise-in size-11" />
            </Link>
            <h1 className="font-display rise-in stagger-1 mt-8 text-5xl font-medium tracking-tight text-fg sm:text-6xl">
              Still.
            </h1>
            <p className="rise-in stagger-2 mt-5 max-w-sm text-lg leading-relaxed text-muted">
              A quiet companion for the hours that feel too heavy to carry alone.
            </p>
            <div className="rise-in stagger-3 mt-10 flex flex-col gap-3">
              <Button size="lg" onClick={() => setStep(1)}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
              <p className="text-xs leading-relaxed text-subtle">
                Not a therapist. Not a crisis service. A place to talk.
              </p>
              <Link to="/about" className="text-xs text-muted underline-offset-4 hover:text-fg hover:underline">
                Read about Still first
              </Link>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="rise-in">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              First, honesty
            </p>
            <h2 className="font-display mt-3 text-3xl font-medium tracking-tight">
              Still is an AI. It is not care.
            </h2>
            <div className="mt-6 space-y-4 text-[0.975rem] leading-relaxed text-muted">
              <p>
                It can listen, remember what you ask it to keep, and help you think something through.
                It cannot diagnose, treat, or replace a person.
              </p>
              <p>
                In some places — including Illinois — using AI as therapy is not allowed. This is a
                companion, and it will stay that.
              </p>
              <p>
                If you are in danger, reach a human. Still will not leave you without a door out.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={() => setStep(2)}>I understand</Button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="rise-in">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              Optional
            </p>
            <h2 className="font-display mt-3 text-3xl font-medium tracking-tight">
              What should I call you?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              A first name is enough. You can skip this.
            </p>
            <div className="mt-6">
              <Label htmlFor="name" className="sr-only">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                placeholder="Your name"
                autoComplete="given-name"
              />
            </div>
            <div className="mt-10 flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="quiet" onClick={() => setStep(3)}>
                Skip
              </Button>
              <Button onClick={() => setStep(3)}>Continue</Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="rise-in">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              Present
            </p>
            <h2 className="font-display mt-3 text-3xl font-medium tracking-tight">
              What's here for you lately?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Pick any that fit. Nothing is required.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {CONCERN_OPTIONS.map((opt) => {
                const on = concerns.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setConcerns((c) =>
                        on ? c.filter((x) => x !== opt.id) : [...c, opt.id],
                      )
                    }
                    className={cn(
                      "h-11 rounded-full px-4 text-sm transition-colors duration-150",
                      on
                        ? "bg-accent text-accent-fg"
                        : "bg-surface-2 text-fg shadow-[var(--shadow-border)]",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-10 flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)}>Continue</Button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="rise-in">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              Check-ins
            </p>
            <h2 className="font-display mt-3 text-3xl font-medium tracking-tight">
              A quiet knock, if you want one.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Optional. Never guilt-based. If you miss one, nothing stacks up.
            </p>
            <div className="mt-6 flex items-center justify-between rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)]">
              <div>
                <p className="text-sm font-medium text-fg">Enable check-ins</p>
                <p className="text-xs text-muted">On this device, when you open Still</p>
              </div>
              <Switch checked={checkIns} onCheckedChange={setCheckIns} />
            </div>
            {checkIns ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(
                  [
                    ["daily", "Daily"],
                    ["few", "Every few days"],
                    ["weekly", "Weekly"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFrequency(id)}
                    className={cn(
                      "h-11 rounded-md text-sm",
                      frequency === id
                        ? "bg-accent text-accent-fg"
                        : "bg-surface-2 text-fg shadow-[var(--shadow-border)]",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="mt-10 flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button size="lg" onClick={finish}>
                I'm ready
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
