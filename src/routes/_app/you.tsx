"use client";

import { Link } from "@/lib/nav";
import { useMemo, useState, type FormEvent } from "react";
import { signOut, useSession } from "next-auth/react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CrisisCard } from "@/components/crisis-card";
import { BackLink } from "@/components/back-link";
import { INTENT_LABEL, type Intent } from "@/lib/companion/types";
import { intentPattern, useStillStore } from "@/lib/store/still-store";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export function YouPage() {
  const { data: session } = useSession();
  const name = useStillStore((s) => s.name);
  const setName = useStillStore((s) => s.setName);
  const pulses = useStillStore((s) => s.pulses);
  const createdAt = useStillStore((s) => s.createdAt);
  const exportData = useStillStore((s) => s.exportData);
  const wipeAll = useStillStore((s) => s.wipeAll);
  const conversations = useStillStore((s) => s.conversations);
  const memories = useStillStore((s) => s.memories);
  const checkIns = useStillStore((s) => s.checkIns);
  const preferences = useStillStore((s) => s.preferences);
  const setPreferences = useStillStore((s) => s.setPreferences);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [erasing, setErasing] = useState(false);
  const [eraseError, setEraseError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [securityPending, setSecurityPending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  const pattern = useMemo(
    () => summarizeIntents(intentPattern(useStillStore.getState())),
    [conversations],
  );

  function savePreference(patch: Partial<typeof preferences>) {
    setPreferences(patch);
    void fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...patch,
        checkInsEnabled: checkIns.enabled,
        checkInFrequency: checkIns.frequency,
      }),
    });
  }

  function download() {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "still-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setSecurityPending(true);
    setPasswordStatus(null);
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setSecurityPending(false);
    if (!response.ok) {
      setPasswordStatus(data.error ?? "The password could not be changed.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setPasswordStatus("Password changed.");
  }

  async function resendVerification() {
    setVerificationStatus(null);
    const response = await fetch("/api/auth/resend-verification", { method: "POST" });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setVerificationStatus(
      response.ok
        ? "A fresh confirmation link is on its way."
        : (data.error ?? "Could not send the email."),
    );
  }

  return (
    <div className="app-page mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:py-8">
      <BackLink fallback="/talk" className="mb-3" />
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Settings</p>
      <h1 className="font-display mt-1 text-2xl font-medium tracking-tight sm:text-3xl">
        Your space is yours.
      </h1>
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
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
          Preferences
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Keep the parts of Still that help, and change them whenever you need.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link
            to="/memory"
            className="rounded-lg bg-surface-2 px-3 py-3 text-sm text-fg transition-colors hover:bg-line"
          >
            <span className="font-medium">Memory</span>
            <span className="mt-1 block text-xs text-muted">Review what Still keeps.</span>
          </Link>
          <Link
            to="/check-ins"
            className="rounded-lg bg-surface-2 px-3 py-3 text-sm text-fg transition-colors hover:bg-line"
          >
            <span className="font-medium">Check-ins</span>
            <span className="mt-1 block text-xs text-muted">Choose if Still knocks.</span>
          </Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-3">
            <div>
              <p className="text-sm font-medium">Use memory in replies</p>
              <p className="mt-1 text-xs text-muted">You can still review what is kept.</p>
            </div>
            <Switch
              checked={preferences.memoryEnabled}
              onCheckedChange={(enabled) => savePreference({ memoryEnabled: enabled })}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-3">
            <div>
              <p className="text-sm font-medium">Allow notifications</p>
              <p className="mt-1 text-xs text-muted">Only when you choose a check-in.</p>
            </div>
            <Switch
              checked={preferences.notificationsEnabled}
              onCheckedChange={(enabled) => savePreference({ notificationsEnabled: enabled })}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="quiet" size="sm" asChild>
            <Link to="/notifications">View notifications</Link>
          </Button>
          <Button variant="quiet" size="sm" asChild>
            <Link to="/check-ins">Notification schedule</Link>
          </Button>
        </div>
      </section>

      <section className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Account</p>
        <p className="mt-2 text-sm text-fg">{session?.user?.email}</p>
        <div className="mt-3 rounded-lg bg-surface-2 px-3 py-3">
          <p className="text-sm font-medium">Email confirmation</p>
          <p className="mt-1 text-xs text-muted">
            {session?.user?.emailConfirmed
              ? "Confirmed. Your account email is verified."
              : "Not confirmed yet. Confirming your email helps keep your space secure."}
          </p>
          {!session?.user?.emailConfirmed ? (
            <Button
              variant="quiet"
              size="sm"
              className="mt-3"
              onClick={() => void resendVerification()}
            >
              Send confirmation email
            </Button>
          ) : null}
          {verificationStatus ? (
            <p className="mt-2 text-xs text-muted">{verificationStatus}</p>
          ) : null}
        </div>
        <div className="mt-3">
          <Button
            variant="quiet"
            size="sm"
            onClick={() => {
              void signOut({ callbackUrl: "/" });
            }}
          >
            Sign out
          </Button>
        </div>
      </section>

      <section className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Security</p>
        <h2 className="font-display mt-2 text-2xl font-medium tracking-tight">
          Keep your key yours.
        </h2>
        <form className="mt-4 grid gap-3" onSubmit={(event) => void changePassword(event)}>
          <div>
            <Label htmlFor="current-password">Current password</Label>
            <PasswordInput
              id="current-password"
              className="mt-1.5"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="settings-new-password">New password</Label>
            <PasswordInput
              id="settings-new-password"
              className="mt-1.5"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </div>
          {passwordStatus ? <p className="text-sm text-muted">{passwordStatus}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="quiet" disabled={securityPending}>
              {securityPending ? "Changing…" : "Change password"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const response = await fetch("/api/auth/sessions", { method: "DELETE" });
                if (response.ok) await signOut({ callbackUrl: "/" });
              }}
            >
              Sign out all sessions
            </Button>
          </div>
        </form>
        <p className="mt-3 text-xs leading-relaxed text-subtle">
          Signing out all sessions ends access on every device, including this one.
        </p>
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
            Still is an AI companion. It is not a therapist, not a clinician, and not a crisis
            service. It does not diagnose, prescribe, or replace psychiatric or psychological care.
          </p>
          <p>
            In some places, including Illinois, using AI as therapy is restricted or banned. Still
            is designed as a companion — a place to talk — and says so plainly.
          </p>
          <p>Memory, talks, and letters are kept with your account. Export a copy, or erase it.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="quiet" asChild>
            <Link to="/about">About Still</Link>
          </Button>
          <Button variant="quiet" asChild>
            <Link to="/terms">Terms</Link>
          </Button>
          <Button variant="quiet" asChild>
            <Link to="/privacy">Privacy</Link>
          </Button>
          <Button variant="quiet" asChild>
            <Link to="/disclaimer">Disclaimer</Link>
          </Button>
          <Button variant="quiet" asChild>
            <Link to="/safety">Safety</Link>
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
          Always available. Not only in a crisis. You do not have to wait until it feels like an
          emergency.
        </p>
        <CrisisCard />
      </section>

      <Separator className="my-8" />

      <section>
        <h2 className="font-display text-2xl font-medium tracking-tight">Your data</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Conversations, memory, check-ins, and pulse answers are kept with your account. The open
          page uses temporary browser memory; it does not keep a journal copy on this device.
          Export, or erase.
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
              Your account, talks, memory, check-ins, letters, and answers will be removed from the
              server. The open page will be cleared too. This cannot be undone unless you already
              exported.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmWipe(false)}>
              Keep it
            </Button>
            <Button
              variant="crisis"
              disabled={erasing}
              onClick={async () => {
                setErasing(true);
                setEraseError(null);
                try {
                  const response = await fetch("/api/still", { method: "DELETE" });
                  if (!response.ok) throw new Error("The account could not be erased.");
                  wipeAll();
                  setConfirmWipe(false);
                  await signOut({ callbackUrl: "/" });
                } catch (error) {
                  setEraseError(
                    error instanceof Error ? error.message : "The account could not be erased.",
                  );
                  setErasing(false);
                }
              }}
            >
              {erasing ? "Erasing…" : "Erase everything"}
            </Button>
          </div>
          {eraseError ? <p className="mt-3 text-sm text-crisis">{eraseError}</p> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Place({
  to,
  title,
  body,
}: {
  to: "/pages" | "/quiet" | "/letters" | "/patterns" | "/memory" | "/check-ins";
  title: string;
  body: string;
}) {
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
