import { useState, useEffect } from 'react'
import { AlertTriangle, X, Info } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { getSystemStatusSync, SystemStatusState } from '@/features/admin/services/systemStatusService'
import { Modal } from '@/components/ui/Modal'

export function SystemStatusBanner() {
  const { language } = useTranslation()
  const [status, setStatus] = useState<SystemStatusState>(getSystemStatusSync())
  const [dismissed, setDismissed] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    const handleUpdate = () => {
      const newStatus = getSystemStatusSync()
      setStatus(newStatus)
      if (newStatus.status !== 'incident') {
        setDismissed(false)
        setDetailsOpen(false)
      }
    }
    window.addEventListener('aiStudyHubSystemStatusUpdated', handleUpdate)
    return () => window.removeEventListener('aiStudyHubSystemStatusUpdated', handleUpdate)
  }, [])

  if (status.status !== 'incident' || dismissed) {
    return null
  }

  const title = language === 'vi' ? 'Hệ thống đang gặp sự cố' : 'System Incident'
  const description = status.message || (language === 'vi' 
    ? 'Một số tính năng có thể hoạt động không ổn định. Vui lòng thử lại sau nếu gặp lỗi.'
    : 'Some features may be unstable. Please try again later if you encounter errors.')

  return (
    <>
      <div className="w-full bg-rose-50 border-b border-rose-200 text-rose-900 px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm z-40 relative dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-100">
        <div className="flex items-start md:items-center gap-3 max-w-[1200px] mx-auto w-full">
          <div className="bg-rose-100 dark:bg-rose-500/20 p-2 rounded-full shrink-0">
            <AlertTriangle className="size-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{title}</p>
            <p className="text-xs mt-0.5 text-rose-700 dark:text-rose-300 opacity-90 line-clamp-1">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-3 md:mt-0 ml-10 md:ml-0 shrink-0">
            <button
              onClick={() => setDetailsOpen(true)}
              className="text-xs font-semibold bg-rose-200 dark:bg-rose-500/30 hover:bg-rose-300 dark:hover:bg-rose-500/50 text-rose-800 dark:text-rose-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Info className="size-3.5" />
              {language === 'vi' ? 'Xem chi tiết' : 'View Details'}
            </button>
            <button 
              onClick={() => setDismissed(true)}
              className="p-1.5 hover:bg-rose-200 dark:hover:bg-rose-500/30 rounded-full transition-colors text-rose-600 dark:text-rose-400 cursor-pointer"
              title={language === 'vi' ? 'Đóng' : 'Dismiss'}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={language === 'vi' ? 'Chi tiết sự cố' : 'Incident Details'}
      >
        <div className="p-1 text-slate-800 dark:text-slate-200">
          <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-xl mb-4">
            <AlertTriangle className="size-6 text-rose-500 shrink-0" />
            <div>
              <p className="font-semibold text-rose-700 dark:text-rose-400">
                {language === 'vi' ? 'Hệ thống gặp sự cố' : 'System Incident'}
              </p>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                {language === 'vi' ? 'Cập nhật lúc' : 'Updated at'}: {new Date(status.updatedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
              </p>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-2">{language === 'vi' ? 'Thông báo từ hệ thống' : 'System Message'}:</h4>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-sm leading-relaxed border border-slate-100 dark:border-slate-700">
              {status.message || description}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setDetailsOpen(false)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
            >
              {language === 'vi' ? 'Đã hiểu' : 'Understood'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
