"use client";

import type { ReactNode } from "react";
import { Link } from "@/lib/nav";
import { BackLink } from "@/components/back-link";
import { SiteChrome } from "@/components/site-chrome";
import { cn } from "@/lib/utils";

export const LEGAL_UPDATED = "September 27, 2026";

export const LEGAL_PAGES = [
  { to: "/legal", label: "Overview", id: "legal" },
  { to: "/terms", label: "Terms", id: "terms" },
  { to: "/privacy", label: "Privacy", id: "privacy" },
  { to: "/disclaimer", label: "Disclaimer", id: "disclaimer" },
  { to: "/safety", label: "Safety", id: "safety" },
] as const;

export type LegalId = (typeof LEGAL_PAGES)[number]["id"];

export function LegalLayout({
  id,
  kicker,
  title,
  lede,
  children,
}: {
  id: LegalId;
  kicker?: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <SiteChrome current="legal">
      <article className="mx-auto max-w-5xl px-5 py-8 sm:py-14">
        <BackLink fallback="/legal" className="mb-4" />
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{kicker ?? "Legal"}</p>
        <h1 className="font-display mt-3 max-w-2xl text-3xl font-medium leading-tight tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:mt-5 sm:text-lg">{lede}</p>
        <p className="mt-3 text-xs text-subtle">Last updated {LEGAL_UPDATED}</p>

        <nav className="mt-8 flex flex-wrap gap-x-4 gap-y-1 border-y border-line py-3 text-xs">
          {LEGAL_PAGES.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className={cn(p.id === id ? "text-fg" : "text-muted hover:text-fg")}
            >
              {p.label}
            </Link>
          ))}
        </nav>

        <div className="legal-prose mt-10 max-w-2xl">{children}</div>
      </article>
    </SiteChrome>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-display text-xl font-medium tracking-tight text-fg sm:text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}
