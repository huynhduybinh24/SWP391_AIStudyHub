import { Bot } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ChatPopup } from '@/features/ai-chatbot/components/ChatPopup'
import { useUiStore } from '@/stores/uiStore'
import { useToast } from '@/components/ui/Toast'

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
        className="fixed bottom-[20px] right-[20px] z-20 size-14 rounded-full bg-[#2563eb] shadow-lg hover:bg-[#2563eb]/90 transition-all duration-300 hover:scale-105"
        aria-label="Open AI Chatbot"
        onClick={handleToggle}
      >
        <Bot className="size-6 text-white" />
        <span className="absolute top-1.5 right-1.5 block h-3 w-3 rounded-full bg-[#22C55E] border-2 border-white" />
      </Button>
      {isChatPopupOpen && <ChatPopup onClose={() => setChatPopupOpen(false)} />}
    </>
  )
}
