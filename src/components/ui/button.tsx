"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center transition-colors justify-center cursor-pointer gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "bg-white/5 hover:scale-105 duration-300 transition text-white border border-white/10 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.05)]",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border border-white/20 bg-black/40 hover:bg-white/10 text-white",
        secondary: "bg-zinc-800 text-white hover:bg-zinc-700",
        ghost: "hover:bg-white/10 text-white",
        link: "text-white underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 text-xs gap-1.5 px-4 has-[>svg]:px-4",
        lg: "h-10 rounded-xl px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-xl px-8 has-[>svg]:px-6",
        xxl: "h-14 rounded-xl px-10 has-[>svg]:px-8",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function GlassFilter() {
  return (
    <svg className="hidden">
      <defs>
        <filter
          id="container-glass"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="70" xChannelSelector="R" yChannelSelector="B" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <>
        <Comp
          data-slot="button"
          ref={ref}
          className={cn(
            "relative overflow-hidden rounded-xl",
            buttonVariants({ variant, size, className })
          )}
          {...props}
        >
          <div className="absolute top-0 left-0 z-0 h-full w-full rounded-xl shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.1),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.25),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.4),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.4),inset_0_0_6px_6px_rgba(255,255,255,0.08),inset_0_0_2px_2px_rgba(255,255,255,0.04),0_0_12px_rgba(0,0,0,0.2)] transition-all" />
          <div
            className="absolute top-0 left-0 isolate -z-10 h-full w-full overflow-hidden rounded-xl"
            style={{ backdropFilter: 'url("#container-glass")' }}
          />
          <div className="pointer-events-none z-10 w-full text-center font-medium flex items-center justify-center gap-2">
            {children}
          </div>
          <GlassFilter />
        </Comp>
      </>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
