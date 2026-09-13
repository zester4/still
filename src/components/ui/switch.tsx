import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-11 shrink-0 cursor-pointer items-center rounded-full shadow-[var(--shadow-border)] transition-colors duration-150",
      "data-[state=checked]:bg-accent data-[state=unchecked]:bg-surface-2",
      "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block size-5 rounded-full transition-transform duration-150",
        "data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-1",
        "data-[state=checked]:bg-accent-fg data-[state=unchecked]:bg-muted",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
