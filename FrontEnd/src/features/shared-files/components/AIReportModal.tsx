import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, AlertCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/context/LanguageContext'

interface AIReportModalProps {
  isOpen: boolean
  onClose: () => void
  onOptimize: () => void
}

export function AIReportModal({ isOpen, onClose, onOptimize }: AIReportModalProps) {
  const { t } = useTranslation()
  
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
    { name: 'Biology 101 Midterm Notes.pdf', size: '2.4 MB', matchType: 'original', dateKey: 'shared2hAgo' },
    { name: 'Bio_Midterm_Summary_v2.pdf', size: '2.4 MB', matchType: 'match99', dateKey: 'sharedYesterday' },
    { name: 'Biology_Review_Backup.pdf', size: '2.3 MB', matchType: 'match95', dateKey: 'sharedOct15' }
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
              className="absolute right-6 top-6 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                  {t.aiGuardReport.aiGuardReport}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                  {t.aiGuardReport.redundancyReportSubtitle}
                </p>
              </div>
            </div>

            {/* Content info */}
            <div className="space-y-5">
              <div className="flex items-start gap-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-3.5 rounded-2xl">
                <AlertCircle className="size-5 text-orange-500 dark:text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-400">{t.aiGuardReport.biologicalRedundancyAlert}</h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-500 font-medium leading-relaxed mt-0.5">
                    {t.aiGuardReport.biologicalRedundancyDescription}
                  </p>
                </div>
              </div>

              {/* Duplicates list */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {t.aiGuardReport.redundantFileGroups}
                </span>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {duplicates.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-200 truncate">
                          {file.name}
                        </h4>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                          {file.size} &bull; {file.dateKey === 'shared2hAgo' ? t.aiGuardReport.shared2hAgo : file.dateKey === 'sharedYesterday' ? t.aiGuardReport.sharedYesterday : t.aiGuardReport.sharedOct15}
                        </p>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        file.matchType === 'original'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100/30'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100/30'
                      }`}>
                        {file.matchType === 'original' ? t.aiGuardReport.original : file.matchType === 'match99' ? t.aiGuardReport.match99 : t.aiGuardReport.match95}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic bg-slate-50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                💡 <strong>{t.aiGuardReport.aiRecommendation}</strong> {t.aiGuardReport.aiRecommendationText}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                {t.aiGuardReport.cancel}
              </button>
              <Button
                type="button"
                onClick={onOptimize}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer"
              >
                <Trash2 className="size-4" />
                <span>{t.aiGuardReport.applyOptimization}</span>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AIReportModal
