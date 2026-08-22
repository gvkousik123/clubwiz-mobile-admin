'use client'

import { useEffect, useRef } from 'react'
import { CheckCircle2, AlertTriangle, Sparkles, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  DEFAULT_TOAST_DURATION,
} from '@/components/ui/toast'

/** Icon + chip tint per variant, so a toast reads at a glance. */
const VARIANT_ICONS = {
  default: { Icon: Sparkles, chip: 'bg-[#14FFEC]/12 text-[#14FFEC]' },
  success: { Icon: CheckCircle2, chip: 'bg-emerald-400/12 text-emerald-300' },
  destructive: { Icon: XCircle, chip: 'bg-red-500/12 text-red-300' },
  warning: { Icon: AlertTriangle, chip: 'bg-amber-400/12 text-amber-300' },
} as const

export function Toaster() {
  const { toasts, dismiss } = useToast()
  const shownAt = useRef(0)

  useEffect(() => {
    if (toasts.length > 0) shownAt.current = Date.now()
  }, [toasts.length])

  useEffect(() => {
    // Tap anywhere to dismiss — but not for the first moment, or the follow-up
    // tap after the action that raised the toast wipes it before it's read.
    const handleClick = () => {
      if (toasts.length > 0 && Date.now() - shownAt.current > 700) {
        dismiss()
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [toasts.length, dismiss])

  return (
    <ToastProvider duration={DEFAULT_TOAST_DURATION} swipeDirection="up">
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const { Icon, chip } = VARIANT_ICONS[variant ?? 'default'] ?? VARIANT_ICONS.default

        return (
          <Toast key={id} variant={variant} {...props}>
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${chip}`}>
              <Icon className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
