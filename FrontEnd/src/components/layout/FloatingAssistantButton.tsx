import { Button } from '@/components/ui/Button'
import { ChatPopup } from '@/features/ai-chatbot/components/ChatPopup'
import { useUiStore } from '@/stores/uiStore'
import { AnimatePresence } from 'framer-motion'

export const AIChatbotIcon = ({ className, ...props }: any) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <linearGradient id="bot-head-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>
      <linearGradient id="bot-visor-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
      <linearGradient id="bot-ear-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
      <filter id="head-shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.1" />
      </filter>
      <filter id="eye-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Background Tech Details (simplified) */}
    <circle cx="20" cy="50" r="1" fill="#93c5fd" opacity="0.5" />
    <circle cx="80" cy="50" r="1" fill="#93c5fd" opacity="0.5" />

    {/* Antenna Base & Rod */}
    <rect x="48" y="24" width="4" height="10" fill="#94a3b8" />
    <circle cx="50" cy="22" r="4.5" fill="url(#bot-ear-gradient)" />

    {/* Ears */}
    <rect x="20" y="46" width="8" height="22" rx="4" fill="url(#bot-ear-gradient)" />
    <rect x="72" y="46" width="8" height="22" rx="4" fill="url(#bot-ear-gradient)" />

    {/* Main Head */}
    <rect x="24" y="34" width="52" height="40" rx="14" fill="url(#bot-head-gradient)" filter="url(#head-shadow)" />

    {/* Visor */}
    <rect x="32" y="42" width="36" height="20" rx="8" fill="url(#bot-visor-gradient)" />

    {/* Glowing Eyes */}
    <rect x="38" y="47" width="7" height="10" rx="3.5" fill="#38bdf8" filter="url(#eye-glow)" />
    <rect x="55" y="47" width="7" height="10" rx="3.5" fill="#38bdf8" filter="url(#eye-glow)" />
  </svg>
)

export function FloatingAssistantButton() {
  const isChatPopupOpen = useUiStore((s) => s.isChatPopupOpen)
  const setChatPopupOpen = useUiStore((s) => s.setChatPopupOpen)

  const handleToggle = () => {
    setChatPopupOpen(!isChatPopupOpen)
  }

  return (
    <>
      <div className="fixed bottom-[20px] right-[20px] z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatPopupOpen && <ChatPopup onClose={() => setChatPopupOpen(false)} />}
        </AnimatePresence>
        
        <Button
          onClick={handleToggle}
          aria-label="Open AI Chatbot"
          size="icon"
          className="mt-4 size-14 rounded-full bg-[#0055d4] shadow-lg hover:bg-[#004bbd] transition-all duration-300 hover:scale-105 p-0 flex items-center justify-center overflow-hidden"
        >
          <AIChatbotIcon className="w-8 h-8" />
        </Button>
      </div>
    </>
  )
}
