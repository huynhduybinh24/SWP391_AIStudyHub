import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, AlertCircle, Trash2, FileText, CheckCircle2 } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'

interface AIReportModalProps {
  isOpen: boolean
  onClose: () => void
  onOptimize: () => void
}

export function AIReportModal({ isOpen, onClose, onOptimize }: AIReportModalProps) {
  const { t, language } = useTranslation()
  
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#060c18]/45 dark:bg-black/75 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="relative z-10 w-full max-w-[500px] overflow-hidden rounded-[28px] bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-7 shadow-2xl text-left backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
          >
            {/* Elegant Background Glow Blobs */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

            {/* Absolute Close button with hover animation */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all duration-200 cursor-pointer active:scale-90"
              aria-label="Close dialog"
            >
              <X className="size-4.5" />
            </button>

            {/* Header */}
            <div className="flex gap-4 items-center mb-6 pb-4.5 border-b border-slate-100/80 dark:border-slate-800/80 relative">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 text-indigo-650 dark:text-indigo-400 shrink-0 border border-indigo-500/20 shadow-inner">
                <Sparkles className="size-5.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 id="report-title" className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  {t.aiGuardReport.aiGuardReport}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-100/20">
                    AI Active
                  </span>
                </h3>
                <p className="text-xs text-slate-550 dark:text-slate-400 font-bold mt-0.5 leading-snug">
                  {t.aiGuardReport.redundancyReportSubtitle}
                </p>
              </div>
            </div>

            {/* Content Body */}
            <div className="space-y-6 relative">
              {/* Biological Redundancy Alert Banner */}
              <div className="relative overflow-hidden flex items-start gap-3.5 bg-gradient-to-br from-amber-50/70 to-orange-50/40 dark:from-amber-955/15 dark:to-orange-955/10 border border-amber-200/50 dark:border-amber-900/20 p-4 rounded-2xl shadow-xs">
                {/* Visual Left Accent Strip */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500 rounded-r" />
                
                <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-500/10">
                  <AlertCircle className="size-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-900 dark:text-amber-450 uppercase tracking-wider">{t.aiGuardReport.biologicalRedundancyAlert}</h4>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 font-bold leading-relaxed mt-1">
                    {t.aiGuardReport.biologicalRedundancyDescription}
                  </p>
                </div>
              </div>

              {/* Duplicates list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {t.aiGuardReport.redundantFileGroups}
                  </span>
                  <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500">
                    3 {language === 'vi' ? 'tệp trùng lặp' : 'files found'}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {duplicates.map((file, i) => {
                    const isOriginal = file.matchType === 'original'
                    return (
                      <div
                        key={i}
                        className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/20 dark:hover:border-indigo-500/30 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:shadow-slate-100/50 dark:hover:shadow-none transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="min-w-0 flex-1 mr-3 flex items-center gap-3">
                          {/* File Icon with dynamic colors */}
                          <div className={`flex size-9 items-center justify-center rounded-xl shrink-0 border ${
                            isOriginal
                              ? 'bg-emerald-500/10 border-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}>
                            {isOriginal ? <CheckCircle2 className="size-4.5" /> : <FileText className="size-4.5" />}
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {file.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                              {file.size} &bull; {file.dateKey === 'shared2hAgo' ? t.aiGuardReport.shared2hAgo : file.dateKey === 'sharedYesterday' ? t.aiGuardReport.sharedYesterday : t.aiGuardReport.sharedOct15}
                            </p>
                          </div>
                        </div>

                        {/* Elegant floating badge */}
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-wide shrink-0 border transition-all duration-300 ${
                          isOriginal
                            ? 'bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-550'
                            : 'bg-rose-50/80 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/40 group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-550'
                        }`}>
                          {isOriginal ? t.aiGuardReport.original : file.matchType === 'match99' ? t.aiGuardReport.match99 : t.aiGuardReport.match95}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* AI Recommendation Quote Bubble */}
              <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500/5 to-violet-500/5 dark:from-indigo-500/10 dark:to-violet-500/10 p-4 rounded-2xl border-l-[3px] border-indigo-500/80 shadow-inner">
                <div className="flex gap-2.5 items-start">
                  <div className="text-[11px] text-slate-600 dark:text-slate-350 font-bold leading-relaxed">
                    <span className="inline-flex items-center gap-1 font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wider text-[10px] mr-1.5">
                      💡 {t.aiGuardReport.aiRecommendation}
                    </span>
                    <span className="italic">{t.aiGuardReport.aiRecommendationText}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800/80 mt-6 shrink-0 relative">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 dark:hover:text-white text-xs font-extrabold transition-all duration-200 cursor-pointer active:scale-95"
              >
                {t.aiGuardReport.cancel}
              </button>
              
              <button
                type="button"
                onClick={onOptimize}
                className="bg-gradient-to-r from-indigo-600 via-indigo-550 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 active:scale-95 cursor-pointer border border-indigo-500/20 hover:border-indigo-600/30"
              >
                <Trash2 className="size-4 shrink-0" />
                <span>{t.aiGuardReport.applyOptimization}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AIReportModal
