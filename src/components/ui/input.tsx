import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md bg-surface-2 px-3.5 text-sm text-fg shadow-[var(--shadow-border)]",
          "placeholder:text-subtle",
          "transition-[box-shadow] duration-150",
          "hover:shadow-[var(--shadow-border-hover)]",
          "focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_rgb(216_210_196_/_0.45)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
