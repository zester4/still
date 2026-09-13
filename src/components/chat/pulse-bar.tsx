import { Button } from "@/components/ui/button";
import type { PulseValue } from "@/lib/companion/types";

export function PulseBar({
  onChoose,
  onSkip,
}: {
  onChoose: (v: PulseValue) => void;
  onSkip: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-2">
      <div className="flex flex-col gap-3 rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">Did you feel understood in this talk?</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="quiet" onClick={() => onChoose("yes")}>
            Yes
          </Button>
          <Button size="sm" variant="quiet" onClick={() => onChoose("somewhat")}>
            Somewhat
          </Button>
          <Button size="sm" variant="quiet" onClick={() => onChoose("not-really")}>
            Not really
          </Button>
          <Button size="sm" variant="ghost" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
