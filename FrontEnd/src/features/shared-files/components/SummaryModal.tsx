import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SharedFile } from './SharedFilesTable'

interface SummaryModalProps {
  isOpen: boolean
  onClose: () => void
  file: SharedFile | null
}

export function SummaryModal({ isOpen, onClose, file }: SummaryModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!file) return null

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
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative z-10 w-full max-w-[540px] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-left"
            role="dialog"
            aria-modal="true"
            aria-labelledby="summary-title"
          >
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-455 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            {/* Header */}
            <div className="flex gap-3.5 items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-955 text-[#3155F6] dark:text-blue-450 shrink-0">
                <FileText className="size-5.5" />
              </div>
              <div>
                <h3 id="summary-title" className="text-base font-extrabold text-slate-900 dark:text-white truncate max-w-[340px]">
                  AI Full Summary
                </h3>
                <p className="text-xs text-slate-455 dark:text-slate-500 font-semibold mt-0.5 truncate max-w-[340px]">
                  Detailed review sheet for "{file.name}"
                </p>
              </div>
            </div>

            {/* Content list */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 text-slate-700 dark:text-slate-300 leading-relaxed scrollbar-thin">
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-1.5 text-blue-650 dark:text-blue-400">
                  <Sparkles className="size-4 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider">Key Syntheses</span>
                </div>
                <p className="text-xs text-justify font-semibold">
                  This study sheet has been synthesized by LumiEdu. It extracts core definitions, weekly lecture companion notes, and exam formulas.
                </p>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 my-4" />

              <div className="space-y-3.5 text-left">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Important Takeaways
                </h4>
                
                <ul className="space-y-3 pl-1">
                  <li className="flex items-start gap-3.5 text-xs font-semibold leading-relaxed">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                    <span><strong>Core Conceptual Models:</strong> Outlines structural paradigms, molecular genetic pathways, or software architectures.</span>
                  </li>
                  <li className="flex items-start gap-3.5 text-xs font-semibold leading-relaxed">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                    <span><strong>Experimental Methods:</strong> Explains step-by-step laboratory procedures, indexes, and voltage sweep tables.</span>
                  </li>
                  <li className="flex items-start gap-3.5 text-xs font-semibold leading-relaxed">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                    <span><strong>Assessment Targets:</strong> Flags key items to recall during test preparation.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-5 border-t border-slate-100 dark:border-slate-800/80 mt-6 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="bg-[#3155F6] hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-500/10 active:scale-[0.98]"
              >
                Close Summary
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default SummaryModal
