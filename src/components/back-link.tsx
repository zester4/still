"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function BackLink({
  fallback = "/talk",
  className,
  onClick,
}: {
  fallback?: string;
  className?: string;
  onClick?: () => void;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (onClick) {
          onClick();
          return;
        }
        if (typeof window !== "undefined") {
          const idx = window.history.state?.idx;
          if (typeof idx === "number" && idx > 0) {
            router.back();
            return;
          }
        }
        router.push(fallback);
      }}
      aria-label="Back"
      className={cn(
        "inline-flex h-8 items-center gap-0.5 rounded-md pr-2 -ml-1.5 text-[12px] text-muted transition-colors duration-150 hover:text-fg",
        className,
      )}
    >
      <ChevronLeft className="size-3.5" strokeWidth={1.75} />
      Back
    </button>
  );
}
