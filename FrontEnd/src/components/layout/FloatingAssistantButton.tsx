import { Button } from '@/components/ui/Button'
import { ChatPopup } from '@/features/ai-chatbot/components/ChatPopup'
import { useUiStore } from '@/stores/uiStore'
import { useToast } from '@/components/ui/Toast'
import { AnimatePresence } from 'framer-motion'

export const AIChatbotIcon = ({ className, ...props }: any) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <linearGradient id="ai-bot-body" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" />
        <stop offset="1" stopColor="#e0e7ff" />
      </linearGradient>
      <linearGradient id="ai-bot-face" x1="6" y1="8" x2="18" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0f172a" />
        <stop offset="1" stopColor="#1e293b" />
      </linearGradient>
      <filter id="ai-bot-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="ai-bot-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
      </filter>
    </defs>
    <rect x="3" y="6" width="18" height="14" rx="5" fill="url(#ai-bot-body)" filter="url(#ai-bot-shadow)" />
    <rect x="5.5" y="8.5" width="13" height="9" rx="3" fill="url(#ai-bot-face)" />
    <circle cx="9.5" cy="13" r="1.8" fill="#38bdf8" filter="url(#ai-bot-glow)" />
    <circle cx="14.5" cy="13" r="1.8" fill="#38bdf8" filter="url(#ai-bot-glow)" />
    <path d="M7.5 10.5h1.5" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <path d="M15 10.5h1.5" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <path d="M12 6V2.5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="2" r="1.2" fill="#38bdf8" filter="url(#ai-bot-glow)" />
    <path d="M3 11c-1 0-1.5 1-1.5 2s.5 2 1.5 2" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M21 11c1 0 1.5 1 1.5 2s-.5 2-1.5 2" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
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
      toast.success('AI Assistant opened')
    }
  }

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-[20px] right-[20px] z-20 size-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] group border border-white/10"
        aria-label="Open AI Chatbot"
        onClick={handleToggle}
      >
        <div className="absolute inset-0 rounded-full animate-pulse bg-blue-400/20" />
        <AIChatbotIcon className="size-6 text-white drop-shadow-md z-10" />
        <span className="absolute top-1 right-1 block h-3.5 w-3.5 rounded-full bg-[#22C55E] border-2 border-white dark:border-slate-900 shadow-sm z-20" />
      </Button>
      <AnimatePresence>
        {isChatPopupOpen && <ChatPopup onClose={() => setChatPopupOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
