'use client'

import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

const ToastProvider = ToastPrimitives.Provider

/**
 * Toasts drop in from the top, inside the same max-w-md shell the app renders
 * in. Bottom is unusable — the bottom nav and fixed action bars live down there.
 * z-index sits above the app's modals and sheets.
 */
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed left-1/2 top-0 z-[300] flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4 pt-[calc(env(safe-area-inset-top,0px)_+_0.75rem)] outline-none',
      className,
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-[20px] border p-4 pr-11 font-['Manrope'] backdrop-blur-xl transition-all " +
  // Swipe up to dismiss (matches the top anchor).
  'data-[swipe=cancel]:translate-y-0 data-[swipe=end]:translate-y-[var(--radix-toast-swipe-end-y)] data-[swipe=move]:translate-y-[var(--radix-toast-swipe-move-y)] data-[swipe=move]:transition-none ' +
  'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-4 data-[state=open]:zoom-in-95 ' +
  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=closed]:zoom-out-95 data-[swipe=end]:animate-out',
  {
    variants: {
      variant: {
        // Brand cyan — the app's affirmative colour, used for confirmations and info.
        default:
          'border-[#14FFEC]/20 bg-[#0D1F1F]/95 text-white shadow-[0_14px_44px_rgba(0,0,0,0.65),0_0_26px_rgba(20,255,236,0.10)]',
        success:
          'border-emerald-400/25 bg-[#0C1F19]/95 text-white shadow-[0_14px_44px_rgba(0,0,0,0.65),0_0_26px_rgba(16,185,129,0.12)]',
        destructive:
          'destructive group border-red-500/30 bg-[#1C0E11]/95 text-white shadow-[0_14px_44px_rgba(0,0,0,0.65),0_0_26px_rgba(239,68,68,0.14)]',
        warning:
          'border-amber-400/30 bg-[#1D170C]/95 text-white shadow-[0_14px_44px_rgba(0,0,0,0.65),0_0_26px_rgba(251,191,36,0.12)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

/** Countdown hairline along the bottom edge, tinted per variant. */
const toastProgressVariants = cva('block h-full w-full origin-left', {
  variants: {
    variant: {
      default: 'bg-gradient-to-r from-[#14FFEC] to-[#00867D]',
      success: 'bg-gradient-to-r from-emerald-300 to-emerald-600',
      destructive: 'bg-gradient-to-r from-red-400 to-red-600',
      warning: 'bg-gradient-to-r from-amber-300 to-amber-500',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const DEFAULT_TOAST_DURATION = 3000

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
  VariantProps<typeof toastVariants>
>(({ className, variant, children, ...props }, ref) => {
  // Keep the bar in step with however long this toast actually lives; a toast
  // held open by its caller (duration 0 / non-finite) simply has no countdown.
  const duration = props.duration ?? DEFAULT_TOAST_DURATION
  const showProgress = Number.isFinite(duration) && duration > 0

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      {children}
      {showProgress && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden bg-white/5">
          <span
            className={cn(toastProgressVariants({ variant }))}
            style={{ animation: `toast-progress ${duration}ms linear forwards` }}
          />
        </span>
      )}
    </ToastPrimitives.Root>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-[#14FFEC]/30 bg-[#14FFEC]/10 px-4 text-[12px] font-bold uppercase tracking-wider text-[#14FFEC] transition-colors hover:bg-[#14FFEC]/20 focus:outline-none focus:ring-2 focus:ring-[#14FFEC]/40 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-red-400/40 group-[.destructive]:bg-red-400/10 group-[.destructive]:text-red-200 group-[.destructive]:hover:bg-red-400/20',
      className,
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      // Always visible: there is no hover on a phone.
      'absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20',
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-[14px] font-bold leading-5 tracking-tight text-white', className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-[12.5px] font-medium leading-[18px] text-white/60', className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  DEFAULT_TOAST_DURATION,
}
