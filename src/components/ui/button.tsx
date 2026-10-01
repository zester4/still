import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,background-color,color,opacity,box-shadow] duration-150 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-fg shadow-[var(--shadow-border)] hover:opacity-92",
        ghost:
          "bg-transparent text-fg hover:bg-surface-2",
        quiet:
          "bg-surface-2 text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
        outline:
          "bg-transparent text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)] hover:bg-surface",
        crisis:
          "bg-crisis text-fg hover:opacity-92",
        link: "bg-transparent text-muted underline-offset-4 hover:text-fg hover:underline",
      },
      size: {
        sm: "h-9 rounded-[10px] px-3 text-xs sm:text-sm",
        md: "h-10 rounded-md px-3 text-sm sm:h-11 sm:px-4",
        lg: "h-11 rounded-lg px-3.5 text-sm sm:h-12 sm:px-5 sm:text-[0.9375rem]",
        icon: "size-10 rounded-md sm:size-11",
        pill: "h-10 rounded-full px-3.5 text-sm sm:h-11 sm:px-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
