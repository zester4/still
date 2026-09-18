import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MOOD_LABEL, type CheckInFrequency } from "@/lib/companion/types";
import { useStillStore } from "@/lib/store/still-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/check-ins")({ component: CheckInsPage });

const FREQ: { id: CheckInFrequency; label: string; hint: string }[] = [
  { id: "daily", label: "Daily", hint: "A quiet hello most days you open this." },
  { id: "few", label: "Every few days", hint: "Unhurried. The default." },
  { id: "weekly", label: "Weekly", hint: "Once in a while is enough." },
];

function CheckInsPage() {
  const checkIns = useStillStore((s) => s.checkIns);
  const setCheckIns = useStillStore((s) => s.setCheckIns);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:py-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Check-ins</p>
      <h1 className="font-display mt-1 text-2xl font-medium tracking-tight sm:text-3xl">A knock, not a demand.</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        Opt-in only. If you skip one, nothing piles up. Still will not guilt you for being quiet.
      </p>

      <div className="mt-8 flex items-center justify-between rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)]">
        <div>
          <p className="text-sm font-medium">Enable check-ins</p>
          <p className="text-xs text-muted">Shown when you open Talk, if one is due</p>
        </div>
        <Switch
          checked={checkIns.enabled}
          onCheckedChange={(enabled) => setCheckIns({ enabled })}
        />
      </div>

      {checkIns.enabled ? (
        <div className="mt-4 grid gap-2">
          {FREQ.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCheckIns({ frequency: f.id })}
              className={cn(
                "rounded-xl px-4 py-3.5 text-left transition-colors duration-150",
                checkIns.frequency === f.id
                  ? "bg-accent text-accent-fg"
                  : "bg-surface text-fg shadow-[var(--shadow-border)]",
              )}
            >
              <p className="text-sm font-medium">{f.label}</p>
              <p
                className={cn(
                  "mt-0.5 text-xs",
                  checkIns.frequency === f.id ? "text-accent-fg/70" : "text-muted",
                )}
              >
                {f.hint}
              </p>
            </button>
          ))}
        </div>
      ) : null}

      <h2 className="mt-10 text-sm font-medium text-fg">History</h2>
      {checkIns.entries.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Nothing yet. When you answer a check-in, it will live here — for you, not as a score.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {checkIns.entries.map((e) => (
            <li key={e.id} className="rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium">{MOOD_LABEL[e.mood]}</p>
                <p className="text-[11px] text-subtle">{format(new Date(e.at), "MMM d, yyyy")}</p>
              </div>
              {e.note ? <p className="mt-1 text-sm leading-relaxed text-muted">{e.note}</p> : null}
            </li>
          ))}
        </ul>
      )}

      {checkIns.entries.length > 0 ? (
        <div className="mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCheckIns({ entries: [] })}
          >
            Clear history
          </Button>
        </div>
      ) : null}
    </div>
  );
}
