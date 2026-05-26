import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Wrench, RefreshCw } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { getSystemStatusSync, SystemStatusState } from '@/features/admin/services/systemStatusService'
import { useAuthStore } from '@/stores/authStore'

interface MaintenanceGuardProps {
  children: React.ReactNode
}

export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const { language } = useTranslation()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const [status, setStatus] = useState<SystemStatusState>(getSystemStatusSync())

  useEffect(() => {
    const handleUpdate = () => {
      setStatus(getSystemStatusSync())
    }
    window.addEventListener('aiStudyHubSystemStatusUpdated', handleUpdate)
    return () => window.removeEventListener('aiStudyHubSystemStatusUpdated', handleUpdate)
  }, [])

  // Admin and admin routes bypass maintenance
  const isAdminRoute = location.pathname.startsWith('/dashboard/admin')
  const isAdminUser = user?.role?.toLowerCase() === 'admin'

  if (status.status !== 'maintenance' || isAdminRoute || isAdminUser) {
    return <>{children}</>
  }

  const handleRetry = () => {
    setStatus(getSystemStatusSync())
    window.location.reload()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f7fb] dark:bg-slate-950 px-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-3xl shadow-xl flex flex-col items-center max-w-md w-full text-center">
        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-100 dark:border-amber-500/20">
          <Wrench className="size-10 text-amber-500" />
        </div>
        
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
          {language === 'vi' ? 'Hệ thống đang bảo trì' : 'System Under Maintenance'}
        </h1>
        
        <p className="text-slate-600 dark:text-slate-400 font-medium mb-8 leading-relaxed">
          {language === 'vi' 
            ? 'Chúng tôi đang tiến hành bảo trì định kỳ và nâng cấp hệ thống để mang lại trải nghiệm tốt hơn. Vui lòng quay lại sau.' 
            : 'We are performing scheduled maintenance and upgrading the system to bring you a better experience. Please check back later.'}
        </p>

        <button 
          onClick={handleRetry}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors w-full justify-center shadow-lg shadow-blue-500/20"
        >
          <RefreshCw className="size-4" />
          {language === 'vi' ? 'Thử lại' : 'Retry'}
        </button>
      </div>
    </div>
  )
}
