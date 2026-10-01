"use client";

import { format } from "date-fns";
import { BackLink } from "@/components/back-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MOOD_LABEL, type CheckInFrequency } from "@/lib/companion/types";
import { useStillStore } from "@/lib/store/still-store";
import { cn } from "@/lib/utils";

const FREQ: { id: CheckInFrequency; label: string; hint: string }[] = [
  { id: "daily", label: "Daily", hint: "A quiet hello most days you open this." },
  { id: "few", label: "Every few days", hint: "Unhurried. The default." },
  { id: "weekly", label: "Weekly", hint: "Once in a while is enough." },
];

export function CheckInsPage() {
  const checkIns = useStillStore((s) => s.checkIns);
  const setCheckIns = useStillStore((s) => s.setCheckIns);
  const preferences = useStillStore((s) => s.preferences);
  const setPreferences = useStillStore((s) => s.setPreferences);

  function saveSchedule(patch: { enabled?: boolean; frequency?: CheckInFrequency }) {
    const enabled = patch.enabled ?? checkIns.enabled;
    const frequency = patch.frequency ?? checkIns.frequency;
    void fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...preferences, checkInsEnabled: enabled, checkInFrequency: frequency }),
    });
  }

  function savePreferences(patch: Partial<typeof preferences>) {
    setPreferences(patch);
    void fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...patch, checkInsEnabled: checkIns.enabled, checkInFrequency: checkIns.frequency }),
    });
  }

  return (
    <div className="app-page mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:py-8">
      <BackLink fallback="/you" className="mb-3" />
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Check-ins</p>
      <h1 className="font-display mt-1 text-2xl font-medium tracking-tight sm:text-3xl">A knock, not a demand.</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        Opt-in only. If you skip one, nothing piles up. Still will not guilt you for being quiet.
      </p>

      <div className="mt-8 flex items-center justify-between rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)]">
        <div>
          <p className="text-sm font-medium">Enable check-ins</p>
          <p className="text-xs text-muted">Shown in Talk, with optional reminders</p>
        </div>
        <Switch
          checked={checkIns.enabled}
          onCheckedChange={(enabled) => {
            setCheckIns({ enabled });
            saveSchedule({ enabled });
          }}
        />
      </div>

      {checkIns.enabled ? (
        <div className="mt-4 grid gap-2">
          {FREQ.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setCheckIns({ frequency: f.id });
                saveSchedule({ frequency: f.id });
              }}
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

      <section className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Reminders</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Still checks the time you choose and leaves one quiet notification. You can change or pause this any time.
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-3">
          <div>
            <p className="text-sm font-medium">Allow reminders</p>
            <p className="mt-1 text-xs text-muted">No reminders are sent unless this is on.</p>
          </div>
          <Switch
            checked={preferences.notificationsEnabled}
            onCheckedChange={(enabled) => savePreferences({ notificationsEnabled: enabled })}
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="check-in-time">Preferred time</Label>
            <Input
              id="check-in-time"
              type="time"
              value={preferences.checkInTime}
              onChange={(event) => savePreferences({ checkInTime: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="check-in-zone">Time zone</Label>
            <Input id="check-in-zone" value={preferences.timezone} readOnly />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
                savePreferences({ timezone });
              }}
            >
              Use this device’s zone
            </Button>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="quiet-start">Quiet hours start</Label>
            <Input
              id="quiet-start"
              type="time"
              value={preferences.quietHoursStart}
              onChange={(event) => savePreferences({ quietHoursStart: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quiet-end">Quiet hours end</Label>
            <Input
              id="quiet-end"
              type="time"
              value={preferences.quietHoursEnd}
              onChange={(event) => savePreferences({ quietHoursEnd: event.target.value })}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-3">
          <div>
            <p className="text-sm font-medium">Email reminders</p>
            <p className="mt-1 text-xs text-muted">Optional. You can turn this off any time.</p>
          </div>
          <Switch
            checked={preferences.emailNotificationsEnabled}
            disabled={!preferences.notificationsEnabled}
            onCheckedChange={(enabled) => savePreferences({ emailNotificationsEnabled: enabled })}
          />
        </div>
      </section>

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
