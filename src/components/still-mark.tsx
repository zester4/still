import { cn } from "@/lib/utils";

export function StillMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("text-accent", className)}
    >
      <circle cx="16" cy="16" r="11.5" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      <path
        d="M7.5 18.2c2.4-1.4 4.8-2.1 8.5-2.1 3.7 0 6.1.7 8.5 2.1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StillWordmark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-fg",
        size === "sm" ? "text-[0.95rem]" : "text-lg",
        className,
      )}
    >
      <StillMark className={size === "sm" ? "size-5" : "size-6"} />
      <span className="font-display font-medium tracking-tight">Still</span>
    </span>
  );
}
