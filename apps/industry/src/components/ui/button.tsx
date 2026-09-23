import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "accent";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5": variant === "default",
            "bg-accent text-accent-foreground shadow hover:bg-accent/90 hover:shadow-lg hover:-translate-y-0.5": variant === "accent",
            "border border-primary bg-transparent text-primary hover:bg-primary/10": variant === "outline",
            "hover:bg-primary/10 text-foreground hover:text-primary": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
            "h-11 px-6 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-14 rounded-xl px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
