"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Splash } from "@/components/splash";
import { useStillStore } from "@/lib/store/still-store";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useStillStore((s) => s.hydrated);
  const onboarded = useStillStore((s) => s.onboarded);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !onboarded) router.replace("/start");
  }, [hydrated, onboarded, router]);

  if (!hydrated) return <Splash />;
  if (!onboarded) return <Splash />;

  return <AppShell>{children}</AppShell>;
}
