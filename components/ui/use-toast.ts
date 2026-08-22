'use client'

/**
 * Re-export only.
 *
 * This file used to hold a second, independent copy of the toast store. The
 * Toaster subscribes to the one in hooks/use-toast, so anything dispatched
 * through this module updated a store nobody rendered — those toasts never
 * appeared. Keep a single source of truth.
 */
export { useToast, toast } from '@/hooks/use-toast'
