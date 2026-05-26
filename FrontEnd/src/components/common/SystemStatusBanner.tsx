import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { getSystemStatusSync, SystemStatusState } from '@/features/admin/services/systemStatusService'

export function SystemStatusBanner() {
  const { language } = useTranslation()
  const [status, setStatus] = useState<SystemStatusState>(getSystemStatusSync())
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handleUpdate = () => {
      const newStatus = getSystemStatusSync()
      setStatus(newStatus)
      if (newStatus.status !== 'incident') {
        setDismissed(false)
      }
    }
    window.addEventListener('aiStudyHubSystemStatusUpdated', handleUpdate)
    return () => window.removeEventListener('aiStudyHubSystemStatusUpdated', handleUpdate)
  }, [])

  if (status.status !== 'incident' || dismissed) {
    return null
  }

  return (
    <div className="w-full bg-rose-500 text-white px-4 py-3 flex items-center justify-between shadow-md z-50 relative">
      <div className="flex items-center gap-3 max-w-[1200px] mx-auto w-full">
        <AlertTriangle className="size-5 shrink-0 text-white" />
        <p className="text-sm font-semibold flex-1">
          {language === 'vi' 
            ? 'Hệ thống đang gặp sự cố. Một số tính năng có thể hoạt động không ổn định.' 
            : 'The system is experiencing issues. Some features may be unstable.'}
        </p>
        <button 
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-rose-600 rounded-full transition-colors shrink-0"
          title="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
