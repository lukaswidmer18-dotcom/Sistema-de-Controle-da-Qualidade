import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_14px_32px_-20px_rgba(22,65,58,0.85)] hover:bg-[#24584F] hover:shadow-[0_20px_42px_-24px_rgba(22,65,58,0.9)]",
        destructive: "bg-destructive text-destructive-foreground shadow-[0_14px_30px_-20px_rgba(239,68,68,0.8)] hover:bg-destructive/90",
        outline: "border border-brand-green/30 bg-white text-primary shadow-sm hover:border-brand-gold/60 hover:bg-brand-cream hover:text-primary hover:shadow-[0_8px_20px_-12px_rgba(22,65,58,0.35)]",
        secondary: "bg-secondary text-secondary-foreground shadow-[0_14px_34px_-22px_rgba(188,147,63,0.78)] hover:bg-[#C39E52]",
        ghost: "text-primary hover:bg-brand-green/8 hover:text-primary",
        link: "text-primary underline-offset-4 hover:text-brand-gold hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
