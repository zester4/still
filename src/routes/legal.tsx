"use client";

import { Link } from "@/lib/nav";
import { LEGAL_PAGES, LEGAL_UPDATED, LegalLayout } from "@/components/legal-layout";

export function LegalIndexPage() {
  return (
    <LegalLayout
      id="legal"
      title="The papers that sit beside this room."
      lede="Still is a companion, not care. These pages say that plainly, and they say what happens with your words."
    >
      <p>
        They are written for this product as it exists today. They are not a substitute for advice from a
        lawyer in your place. If you operate Still with real people, have counsel review them before you
        treat them as binding.
      </p>
      <ul className="mt-8 space-y-3">
        {LEGAL_PAGES.filter((p) => p.id !== "legal").map((p) => (
          <li key={p.to}>
            <Link
              to={p.to}
              className="block rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
            >
              <p className="text-sm font-medium text-fg">{p.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{blurb(p.id)}</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-xs text-subtle">Updated {LEGAL_UPDATED}</p>
    </LegalLayout>
  );
}

function blurb(id: string) {
  switch (id) {
    case "terms":
      return "The agreement for using Still. Who it is for, what it is not, and how an account works.";
    case "privacy":
      return "What is stored, who can see it, OpenRouter, and how to export or erase.";
    case "disclaimer":
      return "Not therapy, not a crisis service, not a diagnosis. Including the Illinois note.";
    case "safety":
      return "What happens if the words are dangerous, and where a person can be reached.";
    default:
      return "";
  }
}
