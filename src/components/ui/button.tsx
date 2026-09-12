import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[opacity,transform,background-color,color,border-color] duration-(--motion-quick) ease-[var(--ease-smooth-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0 active:not-disabled:scale-[0.96]",
  {
    variants: {
      variant: {
        default: "bg-fg text-accent-fg hover:opacity-90",
        ghost:
          "bg-transparent text-fg hover:bg-surface-2 border border-transparent hover:border-border",
        outline: "border border-border bg-surface/70 text-fg hover:bg-surface-2",
        subtle: "bg-surface-2 text-fg hover:bg-surface",
      },
      size: {
        default: "h-11 px-4 rounded-[var(--radius-md)]",
        sm: "h-9 px-3 rounded-[var(--radius-sm)]",
        icon: "size-11 rounded-[var(--radius-md)]",
        chip: "h-11 px-3.5 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

export { Button, buttonVariants };
