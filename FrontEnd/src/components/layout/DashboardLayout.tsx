import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Bot } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { ChatPopup } from '@/features/ai-chatbot/components/ChatPopup'
import { useUiStore } from '@/stores/uiStore'

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const isChatPage = location.pathname === '/dashboard/chat' || location.pathname === '/dashboard/chat/'
  const isChatPopupOpen = useUiStore((s) => s.isChatPopupOpen)
  const setChatPopupOpen = useUiStore((s) => s.setChatPopupOpen)

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col bg-surface h-full">
        <Header />
        <main className="flex-1 flex flex-col overflow-auto">
          <div className="flex-1 w-full mx-auto max-w-[1000px] px-8 pb-20 pt-8">
            <Outlet />
          </div>
          <div className="mt-auto">
            <Footer />
          </div>
        </main>
        {!isChatPage && (
          <>
            <Button
              size="icon"
              className="fixed bottom-[20px] right-[20px] z-20 size-14 rounded-full bg-[#3155F6] shadow-lg hover:bg-[#2563eb]"
              aria-label="Open AI Chatbot"
              onClick={() => setChatPopupOpen(!isChatPopupOpen)}
            >
              <Bot className="size-6 text-white" />
              <span className="absolute top-1.5 right-1.5 block h-3 w-3 rounded-full bg-[#e5eeff] border-2 border-[#3155F6]" />
            </Button>
            {isChatPopupOpen && <ChatPopup onClose={() => setChatPopupOpen(false)} />}
          </>
        )}
      </div>
    </div>
  )
}
