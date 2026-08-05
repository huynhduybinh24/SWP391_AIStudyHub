import { useEffect } from 'react'
import { createPortal } from 'react-dom'
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
    }, toast.duration ?? 5000)

    return () => clearTimeout(timer)
  }, [toast, removeToast])

  const icons = {
    success: <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />,
    error: <AlertCircle className="size-5 text-rose-400 shrink-0 mt-0.5" />,
    info: <Info className="size-5 text-blue-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />,
  }

  const cardBorders = {
    success: 'border-emerald-500 bg-slate-900 text-white shadow-emerald-950/50',
    error: 'border-rose-500 bg-slate-900 text-white shadow-rose-950/60',
    info: 'border-blue-500 bg-slate-900 text-white shadow-blue-950/50',
    warning: 'border-amber-500 bg-slate-900 text-white shadow-amber-950/60',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      className={`
        flex items-start gap-3.5 w-full sm:w-[400px] p-4 rounded-2xl border-2 shadow-2xl
        ${cardBorders[toast.type]}
      `}
      role="alert"
    >
      {icons[toast.type]}
      
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs font-bold leading-relaxed text-white break-words">
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => removeToast(toast.id)}
        className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer shrink-0"
        aria-label="Close notification"
      >
        <X className="size-4" />
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  if (typeof window === 'undefined') return null

  return createPortal(
    <div className="fixed top-6 right-6 z-[99999999] flex flex-col items-end gap-3 pointer-events-none select-none max-w-full">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full flex justify-end">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}
