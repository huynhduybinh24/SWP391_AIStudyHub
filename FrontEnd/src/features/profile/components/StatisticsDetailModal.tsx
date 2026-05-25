import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CalendarDays, Sparkles, Share2, Cloud, FileText, AlertTriangle } from 'lucide-react'
import { StatisticItem } from './StatisticsCard'
import { useTranslation } from '@/context/LanguageContext'
import { useAuthStore } from '@/stores/authStore'
import { env } from '@/config/env'

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
  const { t, language } = useTranslation()
  const user = useAuthStore((s) => s.user)

  const isPro = user?.plan === 'pro'
  const isInstitutional = user?.plan === 'institutional'
  
  const totalGb = isPro ? env.PRO_STORAGE_LIMIT : isInstitutional ? 1000 : env.FREE_STORAGE_LIMIT
  const usedGb = isPro ? 18.0 : isInstitutional ? 12.4 : 2.4
  const percentage = Math.round((usedGb / totalGb) * 100)

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
          <div className="space-y-4 w-full">
            {/* Active Plan Premium Badge Row */}
            <div className="flex items-center gap-3 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-2xl border border-blue-100/50 dark:border-blue-900/30">
              <div className="p-2 rounded-xl bg-blue-600 dark:bg-blue-500 text-white shadow-md shadow-blue-500/20 shrink-0">
                <Cloud className="size-4 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Gói bộ nhớ hiện tại' : 'Active storage plan'}</p>
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-white capitalize flex items-center gap-1.5">
                  {user?.plan === 'pro' 
                    ? (language === 'vi' ? 'Gói Chuyên Nghiệp Pro' : 'Pro Account') 
                    : user?.plan === 'institutional' 
                      ? (language === 'vi' ? 'Gói Tổ Chức' : 'Institutional Account')
                      : (language === 'vi' ? 'Gói Miễn Phí' : 'Free Account')
                  }
                  <span className="inline-flex size-1.5 rounded-full bg-emerald-500 animate-ping" />
                </h4>
              </div>
            </div>

            {/* Main Usage stats and dynamic progress bar */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.profile.usedStorageLabel}</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {usedGb} GB <span className="text-xs font-bold text-slate-400 dark:text-slate-500">/ {totalGb} GB</span>
                  </h3>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide uppercase ${
                  percentage > 90 
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-450' 
                    : percentage > 75 
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-450' 
                      : 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-450'
                }`}>
                  {percentage}% {language === 'vi' ? 'Đã dùng' : 'Used'}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-3 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-800/30">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentage > 90 
                      ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                      : percentage > 75 
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500' 
                        : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600'
                  }`} 
                />
              </div>
            </div>

            {/* Storage Breakdown Details */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
              <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language === 'vi' ? 'Phân bổ dung lượng' : 'Storage breakdown'}</p>
              
              <div className="grid grid-cols-1 gap-2">
                {/* Category 1: Documents & Notes */}
                <div className="p-2.5 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-100/50 dark:border-slate-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-250 truncate">{language === 'vi' ? 'Tài liệu & Bài tập' : 'Documents & Notes'}</h5>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">PDF, DOCX, PPTX</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-305">{(usedGb * 0.6).toFixed(1)} GB</span>
                </div>

                {/* Category 2: AI Summaries */}
                <div className="p-2.5 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-100/50 dark:border-slate-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-purple-50 text-purple-500 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Sparkles className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-250 truncate">{language === 'vi' ? 'Bản tóm tắt AI' : 'AI Summaries'}</h5>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Summaries & Quizzes</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-305">{(usedGb * 0.3).toFixed(1)} GB</span>
                </div>

                {/* Category 3: Shared Workspace */}
                <div className="p-2.5 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-100/50 dark:border-slate-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-teal-50 text-teal-500 dark:bg-teal-950/40 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Share2 className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-250 truncate">{language === 'vi' ? 'Dữ liệu nhóm' : 'Shared Workspace'}</h5>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Collaborators Share</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-305">{(usedGb * 0.1).toFixed(1)} GB</span>
                </div>
              </div>
            </div>

            {/* Alert warnings for high utilization (> 75%) */}
            {percentage > 75 && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100/80 dark:border-amber-900/30">
                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold leading-relaxed">
                  {language === 'vi' 
                    ? 'Bộ nhớ của bạn sắp đầy! Dọn dẹp tệp tin rác hoặc nâng cấp tài khoản của bạn để tiếp tục.' 
                    : 'Storage almost full! Clean up files or upgrade your account to continue uploading.'
                  }
                </p>
              </div>
            )}
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
