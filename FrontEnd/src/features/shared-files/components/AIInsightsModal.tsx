import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, AlertCircle, FileText, CheckCircle2, TrendingUp } from 'lucide-react'

interface AIInsightsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AIInsightsModal({ isOpen, onClose }: AIInsightsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    )
    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && focusableElements) {
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer"
          />

          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="relative z-10 w-full max-w-[500px] overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-insights-title"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                <Sparkles className="size-5.5" />
              </div>
              <div>
                <h3 id="ai-insights-title" className="text-base font-bold text-slate-900 dark:text-white">
                  AI Study Insights
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">
                  Semantic analysis of active collaborator files
                </p>
              </div>
            </div>

            {/* Insights Content List */}
            <div className="space-y-4">
              <div className="flex gap-3.5 p-3.5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/15 border border-blue-100/20 dark:border-blue-950/20">
                <TrendingUp className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-400 uppercase tracking-wider">
                    Highest Activity File
                  </h4>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-305 leading-relaxed">
                    <strong>Biology 101 Midterm Notes.pdf</strong> has been accessed 14 times this week. Activity spikes occurred on Wednesday evening.
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5 p-3.5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/15 border border-amber-100/20 dark:border-amber-950/20">
                <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider">
                    Pending Access Request
                  </h4>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                    Collaborator <strong>'Alex M.'</strong> requested Editor access for your <strong>Lab Report Draft.docx</strong> yesterday at 4:32 PM.
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5 p-3.5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100/20 dark:border-emerald-950/20">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-400 uppercase tracking-wider">
                    Shared File Integrity
                  </h4>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                    All 6 active shared resources are verified. Cloud backup is synchronized.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end pt-5 border-t border-slate-100 dark:border-slate-800/60 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="bg-[#3155F6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-[#3155F6]/10 active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
export default AIInsightsModal
