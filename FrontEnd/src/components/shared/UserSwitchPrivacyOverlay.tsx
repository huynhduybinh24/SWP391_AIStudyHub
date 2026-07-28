import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Lock, Sparkles, Loader2 } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'

export interface SwitchTargetUser {
  name: string
  avatar?: string
  email?: string
}

export function UserSwitchPrivacyOverlay() {
  const { language } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)
  const [targetUser, setTargetUser] = useState<SwitchTargetUser | null>(null)
  const [statusStep, setStatusStep] = useState<number>(1)

  useEffect(() => {
    // Check if a switch was initiated before reload
    const isSwitching = sessionStorage.getItem('aiStudyHubSwitchingUser') === 'true'
    const savedTargetName = sessionStorage.getItem('aiStudyHubSwitchTargetName')
    const savedTargetAvatar = sessionStorage.getItem('aiStudyHubSwitchTargetAvatar')

    if (isSwitching) {
      setIsVisible(true)
      setStatusStep(2)
      if (savedTargetName) {
        setTargetUser({
          name: savedTargetName,
          avatar: savedTargetAvatar || '/logo.png',
        })
      }

      // Smoothly hide overlay after new page finishes mounting
      const timer = setTimeout(() => {
        setIsVisible(false)
        sessionStorage.removeItem('aiStudyHubSwitchingUser')
        sessionStorage.removeItem('aiStudyHubSwitchTargetName')
        sessionStorage.removeItem('aiStudyHubSwitchTargetAvatar')
      }, 700)

      return () => clearTimeout(timer)
    }

    // Event listener for switch triggered in SPA without instant reload
    const handleStartSwitch = (e: Event) => {
      const customEvent = e as CustomEvent<SwitchTargetUser>
      if (customEvent.detail) {
        setTargetUser(customEvent.detail)
      }
      setIsVisible(true)
      setStatusStep(1)

      // Step 2 transition
      setTimeout(() => setStatusStep(2), 400)
    }

    window.addEventListener('aiStudyHubStartUserSwitch', handleStartSwitch)
    return () => window.removeEventListener('aiStudyHubStartUserSwitch', handleStartSwitch)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-3xl text-white flex flex-col items-center justify-center p-6 select-none overflow-hidden"
        >
          {/* Background Ambient Glow Effects */}
          <div className="absolute -top-32 -left-32 size-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none animate-pulse" />

          {/* Central Shield Container */}
          <div className="relative flex flex-col items-center text-center max-w-md w-full">
            {/* Animated Shield Aura Icon */}
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-ping" />
              <div className="relative size-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-2xl shadow-blue-500/30 flex items-center justify-center">
                <div className="size-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <ShieldCheck className="size-10 text-blue-400 animate-bounce" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 size-7 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-950">
                <Lock className="size-3.5 text-white" />
              </div>
            </div>

            {/* Privacy Shield Title */}
            <h2 className="text-xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
              <Sparkles className="size-5 text-blue-400 animate-spin" />
              {language === 'vi'
                ? 'Đang Bảo Mật & Chuyển Đổi Tài Khoản'
                : 'Securing Session & Switching Account'}
            </h2>

            <p className="text-xs text-slate-400 max-w-xs mb-6 leading-relaxed">
              {language === 'vi'
                ? 'Dữ liệu phiên làm việc cũ đã được khóa an toàn để bảo mật tuyệt đối.'
                : 'Previous user session locked securely to ensure complete privacy.'}
            </p>

            {/* Target User Card Badge (If Switching to Specific User) */}
            {targetUser && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-3 bg-slate-900/80 border border-blue-500/30 px-4 py-3 rounded-xl mb-6 shadow-inner w-full max-w-xs justify-center"
              >
                <img
                  src={targetUser.avatar || '/logo.png'}
                  alt={targetUser.name}
                  className="size-9 rounded-full object-cover border border-blue-400/40 shadow-sm"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = '/logo.png'
                  }}
                />
                <div className="text-left overflow-hidden">
                  <div className="text-xs text-blue-400 font-semibold tracking-wide uppercase">
                    {language === 'vi' ? 'Đang chuyển sang' : 'Switching to'}
                  </div>
                  <div className="text-sm font-bold text-white truncate max-w-[170px]">
                    {targetUser.name}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Status Step Indicators */}
            <div className="w-full space-y-2 mb-6 text-xs">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="flex items-center gap-2 text-slate-300">
                  <Lock className="size-3.5 text-green-400" />
                  {language === 'vi' ? 'Đã khóa dữ liệu riêng tư cũ' : 'Old user session locked'}
                </span>
                <span className="text-green-400 font-bold">100%</span>
              </div>

              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="flex items-center gap-2 text-slate-300">
                  <Loader2 className="size-3.5 text-blue-400 animate-spin" />
                  {language === 'vi' ? 'Đang khởi tạo không gian mới...' : 'Initializing new workspace...'}
                </span>
                <span className="text-blue-400 font-bold">{statusStep === 1 ? '50%' : '90%'}</span>
              </div>
            </div>

            {/* Glowing Loading Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden relative">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full"
                initial={{ width: '15%' }}
                animate={{ width: statusStep === 1 ? '60%' : '95%' }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
