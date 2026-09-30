"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/password-input";
import { Label } from "@/components/ui/label";
import { StillMark } from "@/components/still-mark";
import { BackLink } from "@/components/back-link";

export function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Those passwords do not match.");
      return;
    }
    setPending(true);
    setError(null);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Could not reset your password.");
      return;
    }
    router.replace("/login?reset=1");
  }

  return (
    <div className="still-vignette min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-6 py-16">
        <BackLink fallback="/login" className="mb-6" />
        <Link to="/" className="inline-flex"><StillMark className="rise-in size-11" /></Link>
        <h1 className="font-display mt-8 text-4xl font-medium tracking-tight">Choose a new password.</h1>
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <div><Label htmlFor="new-password">New password</Label><PasswordInput id="new-password" className="mt-1.5" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <div><Label htmlFor="confirm-password">Confirm password</Label><PasswordInput id="confirm-password" className="mt-1.5" autoComplete="new-password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>
          {error ? <p className="text-sm text-crisis">{error}</p> : null}
          <Button type="submit" size="lg" disabled={pending || !token}>{pending ? "Saving…" : "Save new password"}</Button>
        </form>
      </div>
    </div>
  );
}
