import { ArrowUpRight } from "lucide-react";
import { CRISIS_RESOURCES } from "@/lib/companion/safety";

export function CrisisCard() {
  return (
    <div className="mt-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
        A person, right now
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {CRISIS_RESOURCES.map((r) => (
          <li key={r.id}>
            <a
              href={r.href}
              target={r.href.startsWith("http") ? "_blank" : undefined}
              rel={r.href.startsWith("http") ? "noreferrer" : undefined}
              className="group flex items-start justify-between gap-3 rounded-lg bg-surface-2 px-3.5 py-3 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
            >
              <span>
                <span className="block text-sm font-medium text-fg">{r.name}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">{r.detail}</span>
              </span>
              <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs text-muted group-hover:text-fg">
                {r.action}
                <ArrowUpRight className="size-3.5" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
