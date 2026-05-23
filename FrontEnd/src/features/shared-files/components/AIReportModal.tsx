import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface AIReportModalProps {
  isOpen: boolean
  onClose: () => void
  onOptimize: () => void
}

export function AIReportModal({ isOpen, onClose, onOptimize }: AIReportModalProps) {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const duplicates = [
    { name: 'Biology 101 Midterm Notes.pdf', size: '2.4 MB', match: 'Original', date: '2h ago' },
    { name: 'Bio_Midterm_Summary_v2.pdf', size: '2.4 MB', match: '99% Match', date: 'Yesterday' },
    { name: 'Biology_Review_Backup.pdf', size: '2.3 MB', match: '95% Match', date: 'Oct 15, 2023' }
  ]

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
            className="relative z-10 w-full max-w-[480px] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-left"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
          >
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            {/* Header */}
            <div className="flex gap-3.5 items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 shrink-0">
                <Sparkles className="size-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 id="report-title" className="text-base font-extrabold text-slate-900 dark:text-white">
                  AI Guard Report
                </h3>
                <p className="text-xs text-slate-455 dark:text-slate-500 font-semibold mt-0.5">
                  Redundancy findings and cloud volume optimization report
                </p>
              </div>
            </div>

            {/* Content info */}
            <div className="space-y-5">
              <div className="flex items-start gap-3 bg-amber-50/50 dark:bg-amber-955/20 border border-amber-200/50 dark:border-amber-900/30 p-3.5 rounded-2xl">
                <AlertCircle className="size-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-850 dark:text-amber-400">Biological Redundancy Alert</h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-500 font-medium leading-relaxed mt-0.5">
                    Found 3 files with identical structures inside the "Biology" shared folder, consuming an extra 4.7 MB of space.
                  </p>
                </div>
              </div>

              {/* Duplicates list */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Redundant File Groups
                </span>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {duplicates.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-205 truncate">
                          {file.name}
                        </h4>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5">
                          {file.size} &bull; Shared {file.date}
                        </p>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        file.match === 'Original'
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-955 dark:text-blue-400 border border-blue-100/30'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-955 dark:text-rose-400 border border-rose-100/30'
                      }`}>
                        {file.match}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic bg-slate-50 dark:bg-slate-850/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                💡 <strong>AI Recommendation:</strong> Keep the original midterm notes file and purge the rest to free up shared space.
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-550 hover:bg-slate-50 dark:text-slate-355 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <Button
                type="button"
                onClick={onOptimize}
                className="bg-indigo-650 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer"
              >
                <Trash2 className="size-4" />
                <span>Apply Optimization</span>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AIReportModal
