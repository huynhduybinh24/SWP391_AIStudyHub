import { Button } from '@/components/ui/Button'
import { ChatPopup } from '@/features/ai-chatbot/components/ChatPopup'
import { useUiStore } from '@/stores/uiStore'
import { useToast } from '@/components/ui/Toast'
import { AnimatePresence } from 'framer-motion'

export const AIChatbotIcon = ({ className, ...props }: any) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <linearGradient id="bot-head-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="80%" stopColor="#e5ebf5" />
        <stop offset="100%" stopColor="#c7d2e8" />
      </linearGradient>
      <linearGradient id="bot-visor-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1a1c29" />
        <stop offset="100%" stopColor="#0a0c13" />
      </linearGradient>
      <linearGradient id="bot-ear-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#4ca3ff" />
        <stop offset="100%" stopColor="#1b63f2" />
      </linearGradient>
      <filter id="head-shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#001845" floodOpacity="0.4" />
      </filter>
      <filter id="eye-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="visor-inner-shadow">
        <feOffset dx="0" dy="2"/>
        <feGaussianBlur stdDeviation="2" result="offset-blur"/>
        <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
        <feFlood floodColor="black" floodOpacity="0.8" result="color"/>
        <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
        <feComposite operator="over" in="shadow" in2="SourceGraphic"/>
      </filter>
    </defs>

    {/* Background Tech Details (faint circuits) */}
    <path d="M 20 50 L 10 50 L 10 40" fill="none" stroke="#60a5fa" strokeWidth="0.5" opacity="0.3" />
    <path d="M 80 60 L 90 60 L 90 70" fill="none" stroke="#60a5fa" strokeWidth="0.5" opacity="0.3" />
    <circle cx="10" cy="40" r="1.5" fill="#60a5fa" opacity="0.4" />
    <circle cx="90" cy="70" r="1.5" fill="#60a5fa" opacity="0.4" />
    <circle cx="30" cy="85" r="1" fill="#60a5fa" opacity="0.5" />
    <circle cx="70" cy="20" r="1" fill="#60a5fa" opacity="0.5" />

    {/* Antenna Base & Rod */}
    <rect x="48" y="22" width="4" height="12" fill="#cbd5e1" />
    <circle cx="50" cy="22" r="5" fill="url(#bot-ear-gradient)" filter="url(#eye-glow)" />

    {/* Ears */}
    <rect x="18" y="45" width="10" height="26" rx="4" fill="url(#bot-ear-gradient)" />
    <rect x="72" y="45" width="10" height="26" rx="4" fill="url(#bot-ear-gradient)" />

    {/* Main Head */}
    <rect x="23" y="32" width="54" height="42" rx="16" fill="url(#bot-head-gradient)" filter="url(#head-shadow)" />

    {/* Visor */}
    <rect x="30" y="40" width="40" height="24" rx="10" fill="url(#bot-visor-gradient)" filter="url(#visor-inner-shadow)" />

    {/* Glowing Eyes */}
    <rect x="38" y="45" width="8" height="12" rx="4" fill="#00ffff" filter="url(#eye-glow)" />
    <rect x="54" y="45" width="8" height="12" rx="4" fill="#00ffff" filter="url(#eye-glow)" />

    {/* Visor Accent Brackets */}
    <path d="M 34 44 L 34 42 L 36 42" fill="none" stroke="#00ffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 34 60 L 34 62 L 36 62" fill="none" stroke="#00ffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 66 44 L 66 42 L 64 42" fill="none" stroke="#00ffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 66 60 L 66 62 L 64 62" fill="none" stroke="#00ffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function FloatingAssistantButton() {
  const isChatPopupOpen = useUiStore((s) => s.isChatPopupOpen)
  const setChatPopupOpen = useUiStore((s) => s.setChatPopupOpen)
  const toast = useToast()

  const handleToggle = () => {
    const nextState = !isChatPopupOpen
    setChatPopupOpen(nextState)
    if (nextState) {
      toast.success('AI Assistant connected', {
        icon: '👋'
      })
    }
  }

  return (
    <>
      <div className="fixed bottom-[20px] right-[20px] z-20">
        <button
          onClick={handleToggle}
          aria-label="Open AI Chatbot"
          className="relative size-16 md:size-20 rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-700 shadow-[0_8px_30px_rgba(37,99,235,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_40px_rgba(37,99,235,0.6)] group p-0 border-none outline-none flex items-center justify-center cursor-pointer"
        >
          {/* Glass Bubble Effect */}
          <div className="absolute inset-0 rounded-full border-[1.5px] border-white/40 shadow-[inset_0_0_20px_rgba(255,255,255,0.4)] pointer-events-none" />
          
          {/* Inner ambient glow */}
          <div className="absolute inset-0 rounded-full bg-blue-400/20 shadow-[inset_0_0_15px_rgba(0,240,255,0.3)] pointer-events-none" />
          
          {/* 3D Icon */}
          <AIChatbotIcon className="w-[85%] h-[85%] relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-md" />

          {/* 3D Green Online Indicator */}
          <div className="absolute -top-1 -right-1 z-20 flex size-6 md:size-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-md shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
            <div className="size-4 md:size-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 border-[2px] border-white/90 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)]" />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {isChatPopupOpen && <ChatPopup onClose={() => setChatPopupOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
