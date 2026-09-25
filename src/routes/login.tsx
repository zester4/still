"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StillMark } from "@/components/still-mark";

export function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/start";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setPending(false);
    if (!res || res.error) {
      setError("That email or password wasn't right.");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="still-vignette min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-6 py-16">
        <Link to="/" className="inline-flex">
          <StillMark className="rise-in size-11" />
        </Link>
        <h1 className="font-display rise-in stagger-1 mt-8 text-4xl font-medium tracking-tight text-fg">
          Come in.
        </h1>
        <p className="rise-in stagger-2 mt-4 max-w-sm text-sm leading-relaxed text-muted">
          Your talks live with this account, not only this browser.
        </p>

        <form onSubmit={onSubmit} className="rise-in stagger-3 mt-10 flex flex-col gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              className="mt-1.5"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              className="mt-1.5"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-crisis">{error}</p> : null}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "A moment…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-8 text-sm text-muted">
          New here?{" "}
          <Link to="/signup" className="text-fg hover:underline">
            Make a space
          </Link>
        </p>
      </div>
    </div>
  );
}
