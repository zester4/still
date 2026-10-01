"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/nav";
import { StillMark } from "@/components/still-mark";

export function VerifyEmailPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"idle" | "pending" | "success" | "error">(token ? "idle" : "error");

  async function verify(event: FormEvent) {
    event.preventDefault();
    setState("pending");
    const response = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setState(response.ok ? "success" : "error");
  }

  return (
    <div className="still-vignette min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-6 py-16">
        <BackLink fallback="/login" className="mb-6" />
        <Link to="/" className="inline-flex"><StillMark className="size-11" /></Link>
        <h1 className="font-display mt-8 text-4xl font-medium tracking-tight">Confirm your email.</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {state === "success" ? "Your email is confirmed. Your space is ready." : state === "error" ? "This link is missing, expired, or already used." : "One small step to keep your space yours."}
        </p>
        {state === "success" ? (
          <Button className="mt-8" onClick={() => router.replace("/talk")}>Go to Still</Button>
        ) : (
          <form onSubmit={verify} className="mt-8">
            <Button type="submit" size="lg" disabled={state === "pending" || !token}>{state === "pending" ? "Confirming…" : "Confirm email"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
