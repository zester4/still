import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginPage } from "@/routes/login";
import { Splash } from "@/components/splash";

export const metadata: Metadata = { title: "Sign in · Still" };

export default function Page() {
  return (
    <Suspense fallback={<Splash />}>
      <LoginPage />
    </Suspense>
  );
}
