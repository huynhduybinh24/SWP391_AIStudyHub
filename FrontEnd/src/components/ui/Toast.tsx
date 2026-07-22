import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToastStore, type Toast } from '@/stores/toastStore'

// Helper hook for easy usage in components
export function useToast() {
  const addToast = useToastStore((s) => s.addToast)
  
  return {
    success: (msg: string, duration?: number) => addToast(msg, 'success', duration),
    error: (msg: string, duration?: number) => addToast(msg, 'error', duration),
    info: (msg: string, duration?: number) => addToast(msg, 'info', duration),
    warning: (msg: string, duration?: number) => addToast(msg, 'warning', duration),
  }
}

// Standalone toast helper for direct imperative calls
export const toast = {
  success: (msg: string, duration?: number) => useToastStore.getState().addToast(msg, 'success', duration),
  error: (msg: string, duration?: number) => useToastStore.getState().addToast(msg, 'error', duration),
  info: (msg: string, duration?: number) => useToastStore.getState().addToast(msg, 'info', duration),
  warning: (msg: string, duration?: number) => useToastStore.getState().addToast(msg, 'warning', duration),
}

export function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast)

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id)
    }, toast.duration ?? 3000)

    return () => clearTimeout(timer)
  }, [toast, removeToast])

  const icons = {
    success: <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="size-5 text-rose-500 shrink-0" />,
    info: <Info className="size-5 text-blue-500 shrink-0" />,
    warning: <AlertTriangle className="size-5 text-amber-500 shrink-0" />,
  }

  const borderColors = {
    success: 'border-emerald-500/20 dark:border-emerald-500/30',
    error: 'border-rose-500/20 dark:border-rose-500/30',
    info: 'border-blue-500/20 dark:border-blue-500/30',
    warning: 'border-amber-500/20 dark:border-amber-500/30',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`
        flex items-center gap-3 w-[340px] max-w-full p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-xl
        ${borderColors[toast.type]}
      `}
      role="alert"
    >
      {icons[toast.type]}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => removeToast(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
        aria-label="Close notification"
      >
        <X className="size-4" />
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div className="fixed bottom-6 right-6 z-[100000] flex flex-col gap-3 pointer-events-none select-none max-w-full">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
