import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CalendarDays, Sparkles, Share2, Cloud } from 'lucide-react'
import { StatisticItem } from './StatisticsCard'
import { useTranslation } from '@/context/LanguageContext'

interface StatisticsDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: StatisticItem | null
  onNavigate: (route: string, id: string, label: string) => void
}

export function StatisticsDetailModal({
  isOpen,
  onClose,
  item,
  onNavigate,
}: StatisticsDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  // Focus trap & ESC key handler
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

  if (!item) return null

  const renderContent = () => {
    switch (item.id) {
      case 'studyPlans':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-500 dark:text-slate-400">{t.profile.totalPlansLabel}</span>
              <span className="font-bold text-slate-900 dark:text-white">12</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-500 dark:text-slate-400">{t.profile.activePlansLabel}</span>
              <span className="font-bold text-green-600 dark:text-green-400">8</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2.5">
              <span className="font-semibold text-slate-500 dark:text-slate-400">{t.profile.completedPlansLabel}</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">4</span>
            </div>
          </div>
        )
      case 'aiSummaries':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-500 dark:text-slate-400">{t.profile.totalSummariesLabel}</span>
              <span className="font-bold text-slate-900 dark:text-white">86</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-500 dark:text-slate-400">{t.profile.generatedThisMonthLabel}</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">14</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2.5">
              <span className="font-semibold text-slate-500 dark:text-slate-400">{t.profile.averagePerWeekLabel}</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">3.5</span>
            </div>
          </div>
        )
      case 'sharedFiles':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-500 dark:text-slate-400">{t.profile.totalSharedFilesLabel}</span>
              <span className="font-bold text-slate-900 dark:text-white">24</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-500 dark:text-slate-400">{t.profile.sharedWithMeLabel}</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">15</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2.5">
              <span className="font-semibold text-slate-500 dark:text-slate-400">{t.profile.sharedByMeLabel}</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">9</span>
            </div>
          </div>
        )
      case 'storageUsed':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-500 dark:text-slate-400">{t.profile.usedStorageLabel}</span>
              <span className="font-bold text-slate-900 dark:text-white">18 GB</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-500 dark:text-slate-400">{t.profile.totalLimitLabel}</span>
              <span className="font-bold text-slate-900 dark:text-white">50 GB</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400">{t.profile.usageRatioLabel}</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">36%</span>
            </div>
            <div className="w-full pt-1">
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden" role="progressbar" aria-valuenow={36} aria-valuemin={0} aria-valuemax={100}>
                <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: '36%' }} />
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const getActionBtnLabel = () => {
    switch (item.id) {
      case 'studyPlans':
        return t.profile.goToStudyPlans
      case 'aiSummaries':
        return t.profile.goToAISummaries
      case 'sharedFiles':
        return t.profile.goToSharedFiles
      case 'storageUsed':
        return t.profile.goToCloudStorage
      default:
        return t.profile.goToFeatureText
    }
  }

  const getModalIcon = () => {
    const iconClass = "size-6 text-blue-600 dark:text-blue-400"
    switch (item.id) {
      case 'studyPlans':
        return <CalendarDays className={iconClass} />
      case 'aiSummaries':
        return <Sparkles className={iconClass} />
      case 'sharedFiles':
        return <Share2 className={iconClass} />
      case 'storageUsed':
        return <Cloud className={iconClass} />
      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Card */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-modal-title"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 shrink-0">
                {getModalIcon()}
              </div>
              <div>
                <h3 id="detail-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                  {t.profile.detailsSuffix(item.label)}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {t.profile.detailsSub}
                </p>
              </div>
            </div>

            {/* Body Info */}
            <div className="bg-[#f8faff]/50 dark:bg-slate-800/20 rounded-2xl p-4 border border-slate-100/50 dark:border-slate-800/40">
              {renderContent()}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/60">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                {t.common.close}
              </button>
              <button
                type="button"
                onClick={() => onNavigate(item.route, item.id, item.label)}
                className="bg-[#3155F6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-[#3155F6]/10 active:scale-[0.98]"
              >
                {getActionBtnLabel()}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
