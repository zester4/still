import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { StillWordmark } from "@/components/still-mark";
import { Button } from "@/components/ui/button";
import { useStillStore } from "@/lib/store/still-store";
import { cn } from "@/lib/utils";

export function SiteChrome({
  children,
  current,
}: {
  children: ReactNode;
  current: "home" | "about";
}) {
  const onboarded = useStillStore((s) => s.onboarded);
  const enterTo = onboarded ? "/talk" : "/start";

  return (
    <div className="still-vignette min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-5">
          <Link to="/" aria-label="Still home">
            <StillWordmark size="sm" />
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-1">
            <Link
              to="/"
              className={cn(
                "hidden h-11 items-center px-3 text-sm sm:inline-flex",
                current === "home" ? "text-fg" : "text-muted hover:text-fg",
              )}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={cn(
                "inline-flex h-11 items-center px-3 text-sm",
                current === "about" ? "text-fg" : "text-muted hover:text-fg",
              )}
            >
              About
            </Link>
            <Button size="sm" asChild className="ml-1">
              <Link to={enterTo}>{onboarded ? "Continue" : "Enter"}</Link>
            </Button>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <StillWordmark size="sm" />
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-subtle">
              An AI companion. Not a therapist, not a crisis service, not a substitute for a person.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <Link to="/about" className="hover:text-fg">
              About
            </Link>
            <a href="https://www.iasp.info/suicidalthoughts/" className="hover:text-fg">
              Find a helpline
            </a>
            <a href="tel:988" className="hover:text-fg">
              988
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function StillPhoto({
  src,
  alt,
  width,
  height,
  className,
  framed = true,
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  framed?: boolean;
  priority?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={cn("w-full object-cover", framed && "still-photo", className)}
    />
  );
}
