import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-wide transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-accent-cyan/70",
  {
    variants: {
      variant: {
        default:
          'cta-gradient shadow-[0px_14px_32px_rgba(6,182,212,0.35)] hover:-translate-y-0.5',
        primary:
          'cta-gradient shadow-[0px_14px_32px_rgba(6,182,212,0.35)] hover:-translate-y-0.5',
        destructive:
          'bg-destructive text-white shadow-[0px_12px_24px_rgba(239,68,68,0.35)] hover:-translate-y-0.5',
        outline:
          'border border-white/15 bg-transparent text-white hover:border-accent-teal hover:text-accent-teal',
        secondary:
          'cta-secondary hover:-translate-y-0.5',
        ghost:
          'text-white/80 hover:text-white hover:bg-white/10',
        link: 'text-accent-cyan underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6 py-2.5 has-[>svg]:px-5 text-base',
        sm: 'h-9 px-4 py-2 has-[>svg]:px-3 text-sm',
        lg: 'h-12 px-8 py-3 has-[>svg]:px-6 text-lg',
        icon: 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
