"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Link } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StillMark } from "@/components/still-mark";

export function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setPending(false);
      setError(data.error || "Could not make this space.");
      return;
    }
    const signed = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setPending(false);
    if (!signed || signed.error) {
      setError("The space was made. Sign in to enter it.");
      router.replace("/login");
      return;
    }
    router.replace("/start");
    router.refresh();
  }

  return (
    <div className="still-vignette min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-6 py-16">
        <Link to="/" className="inline-flex">
          <StillMark className="rise-in size-11" />
        </Link>
        <h1 className="font-display rise-in stagger-1 mt-8 text-4xl font-medium tracking-tight text-fg">
          Make a space.
        </h1>
        <p className="rise-in stagger-2 mt-4 max-w-sm text-sm leading-relaxed text-muted">
          A quiet account. Nothing is posted. You can leave whenever you want.
        </p>

        <form onSubmit={onSubmit} className="rise-in stagger-3 mt-10 flex flex-col gap-4">
          <div>
            <Label htmlFor="name">What to call you</Label>
            <Input
              id="name"
              className="mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder="Optional"
              autoComplete="given-name"
            />
          </div>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <p className="mt-1.5 text-xs text-subtle">At least eight characters.</p>
          </div>
          {error ? <p className="text-sm text-crisis">{error}</p> : null}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "A moment…" : "Create this space"}
          </Button>
        </form>

        <p className="mt-8 text-sm text-muted">
          Already here?{" "}
          <Link to="/login" className="text-fg hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
