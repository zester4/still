import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Splash } from "@/components/splash";
import { useStillStore } from "@/lib/store/still-store";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const hydrated = useStillStore((s) => s.hydrated);
  const onboarded = useStillStore((s) => s.onboarded);
  const navigate = useNavigate();

  if (!hydrated) return <Splash />;
  if (!onboarded) {
    void navigate({ to: "/start" });
    return <Splash />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
