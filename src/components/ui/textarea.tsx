import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-24 w-full rounded-lg bg-surface-2 px-3.5 py-3 text-sm text-fg shadow-[var(--shadow-border)]",
          "placeholder:text-subtle",
          "transition-[box-shadow] duration-150",
          "hover:shadow-[var(--shadow-border-hover)]",
          "focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_rgb(216_210_196_/_0.45)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-none",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
