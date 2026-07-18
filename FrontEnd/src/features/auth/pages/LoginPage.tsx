import { useState, useEffect } from 'react'
import { LoginForm } from '@/features/auth/components/LoginForm'
import heroImg from '@/assets/hero.png'
import { AppFooter } from '@/components/shared/AppFooter'
import { ArrowLeft, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from '@/context/LanguageContext'
import { getSystemStatus, SystemStatusState } from '@/features/admin/services/systemStatusService'
import { Modal } from '@/components/ui/Modal'

export function LoginPage() {
  const { language } = useTranslation()
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')

  const backToHomeText = language === 'vi' 
    ? 'Quay lại trang chủ' 
    : (language === 'ja' ? 'ホームに戻る' : (language === 'ko' ? 'ホームへ戻る' : 'Back to Home'))

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans relative">
      {/* Return to Landing Button */}
      <div className="absolute top-6 left-6 z-50">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm cursor-pointer select-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{backToHomeText}</span>
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane - Hero Section */}
        <div className="hidden lg:flex flex-col items-center justify-center w-1/2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-12 relative border-r border-slate-200/50 dark:border-slate-800/50">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <img 
              src={heroImg} 
              alt="AI Brain Concept" 
              className="w-[140%] h-[140%] object-contain opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          
          <div className="relative z-10 flex flex-col items-center text-center max-w-[420px] mt-12">
            <div className="flex items-center justify-center mb-5">
              <img src="/logo.png" alt="LumiEdu" className="w-80 h-80 object-contain" />
            </div>
            <h2 className="text-[32px] leading-tight font-bold text-slate-900 dark:text-white mb-4">
              Illuminate Your Learning
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-[16px] leading-relaxed font-medium">
              Your premium workspace for deep academic work.<br/>
              Organize, synthesize, and master your coursework<br/>
              with AI-driven clarity.
            </p>
          </div>
        </div>

        {/* Right Pane - Form Section */}
        <div className="flex items-center justify-center w-full lg:w-1/2 p-6 bg-slate-50 dark:bg-slate-950">
          <div className="w-full max-w-md">
            <LoginForm onMaintenanceMode={(message) => {
              setShowMaintenanceModal(true)
              setMaintenanceMessage(message)
            }} />
          </div>
        </div>
      </div>

      <AppFooter variant="simple" />

      {/* Maintenance Info Modal */}
      <Modal
        isOpen={showMaintenanceModal}
        onClose={() => {
          window.location.href = '/'
        }}
        title={language === 'vi' ? 'Hệ thống đang bảo trì' : 'System Under Maintenance'}
        className="max-w-md"
      >
        <div className="flex flex-col items-center text-center p-4 space-y-4">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-100 dark:border-amber-500/20">
            <Wrench className="size-8 text-amber-500" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
            {maintenanceMessage || (language === 'vi' 
              ? 'Hệ thống hiện đang tiến hành bảo trì định kỳ. Các chức năng đăng nhập tạm thời bị khóa. Vui lòng quay lại sau.' 
              : 'The system is currently undergoing scheduled maintenance. Login functions are temporarily disabled. Please check back later.')}
          </p>
          <button
            onClick={() => {
              window.location.href = '/'
            }}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow-md shadow-blue-500/10"
          >
            {language === 'vi' ? 'Quay lại Trang chủ' : 'Back to Home'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
