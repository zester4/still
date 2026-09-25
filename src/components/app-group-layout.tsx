"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Splash } from "@/components/splash";
import { useStillStore } from "@/lib/store/still-store";

export function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const hydrated = useStillStore((s) => s.hydrated);
  const onboarded = useStillStore((s) => s.onboarded);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && hydrated && !onboarded) router.replace("/start");
  }, [status, hydrated, onboarded, router]);

  if (status === "loading" || !hydrated) return <Splash />;
  if (status !== "authenticated") return <Splash />;
  if (!onboarded) return <Splash />;

  return <AppShell>{children}</AppShell>;
}
