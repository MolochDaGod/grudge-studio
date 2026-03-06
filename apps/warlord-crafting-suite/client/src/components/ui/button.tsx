import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-heading font-semibold tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(43_85%_55%)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "gilded-button",
        destructive:
          "bg-[hsl(0_65%_35%)] text-white border-2 border-[hsl(0_50%_45%)] rounded shadow-lg hover:bg-[hsl(0_70%_40%)]",
        outline:
          "dark-button",
        secondary:
          "dark-button",
        ghost: 
          "border-2 border-transparent hover:border-[hsl(43_50%_35%)] hover:bg-[hsl(225_25%_18%)] rounded",
        link: 
          "text-[hsl(43_85%_65%)] underline-offset-4 hover:underline hover:text-[hsl(43_90%_75%)]",
      },
      size: {
        default: "min-h-10 px-5 py-2.5 rounded",
        sm: "min-h-8 rounded px-3 text-xs",
        lg: "min-h-12 rounded px-8 text-base",
        icon: "h-10 w-10 rounded",
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
