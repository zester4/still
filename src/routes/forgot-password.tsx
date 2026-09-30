"use client";

import { FormEvent, useState } from "react";
import { Link } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StillMark } from "@/components/still-mark";
import { BackLink } from "@/components/back-link";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Could not send a reset email.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="still-vignette min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-6 py-16">
        <BackLink fallback="/login" className="mb-6" />
        <Link to="/" className="inline-flex"><StillMark className="rise-in size-11" /></Link>
        <h1 className="font-display mt-8 text-4xl font-medium tracking-tight">Reset your password.</h1>
        {sent ? (
          <div className="mt-5 space-y-3 text-sm leading-relaxed text-muted">
            <p>If an account uses that email, a reset link is on its way. The link expires in one hour.</p>
            <p>If you do not see it, check your spam folder or request another link.</p>
            <Link to="/login" className="inline-block text-fg underline-offset-4 hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-muted">Enter the email for your Still account.</p>
            <div><Label htmlFor="forgot-email">Email</Label><Input id="forgot-email" className="mt-1.5" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            {error ? <p className="text-sm text-crisis">{error}</p> : null}
            <Button type="submit" size="lg" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
