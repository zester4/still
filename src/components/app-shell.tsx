"use client";

import type { ReactNode } from "react";
import { Link, useRouterState } from "@/lib/nav";
import { BookOpen, Layers, Moon, MessageCircle, Notebook, PenLine, UserRound } from "lucide-react";
import { StillWordmark } from "./still-mark";
import { cn } from "@/lib/utils";

const MOBILE_NAV = [
  { to: "/talk", label: "Talk", icon: MessageCircle },
  { to: "/memory", label: "Memory", icon: BookOpen },
  { to: "/quiet", label: "Quiet", icon: Moon },
  { to: "/you", label: "You", icon: UserRound },
] as const;

const DESKTOP_NAV = [
  { to: "/talk", label: "Talk", icon: MessageCircle },
  { to: "/pages", label: "Pages", icon: Notebook },
  { to: "/memory", label: "Memory", icon: BookOpen },
  { to: "/quiet", label: "Quiet", icon: Moon },
  { to: "/letters", label: "Letters", icon: PenLine },
  { to: "/patterns", label: "Patterns", icon: Layers },
  { to: "/you", label: "You", icon: UserRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="still-vignette min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl">
        <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-line px-5 py-8 md:flex">
          <Link to="/talk" className="mb-10">
            <StillWordmark />
          </Link>
          <nav className="flex flex-1 flex-col gap-1">
            {DESKTOP_NAV.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150",
                    active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface hover:text-fg",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <p className="text-xs leading-relaxed text-subtle">
            An AI companion.
            <br />
            Not a therapist.
          </p>
          <Link to="/" className="mt-3 text-xs text-muted hover:text-fg">
            Home
          </Link>
        </aside>

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col pb-[4.5rem] md:pb-0">
          <header className="flex items-center justify-between border-b border-line px-4 py-2.5 md:hidden">
            <StillWordmark size="sm" />
            <span className="text-xs text-subtle">Not therapy</span>
          </header>
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/92 md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1">
          {MOBILE_NAV.map((item) => {
            const active =
              pathname === item.to ||
              (item.to === "/you" &&
                (pathname === "/letters" || pathname === "/pages" || pathname === "/patterns" || pathname === "/check-ins"));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] tracking-wide",
                  active ? "text-fg" : "text-subtle",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2 : 1.7} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
