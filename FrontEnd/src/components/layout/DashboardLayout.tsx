import { Outlet, useLocation } from 'react-router-dom'
import { Bot } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { ChatPopup } from '@/features/ai-chatbot/components/ChatPopup'
import { useUiStore } from '@/stores/uiStore'

export function DashboardLayout() {

  const location = useLocation()
  const isChatPage = location.pathname === '/dashboard/chat' || location.pathname === '/dashboard/chat/'
  const isChatPopupOpen = useUiStore((s) => s.isChatPopupOpen)
  const setChatPopupOpen = useUiStore((s) => s.setChatPopupOpen)
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden bg-surface relative">
      <Sidebar />
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#0b1c30]/40 backdrop-blur-sm z-40 md:hidden cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="relative flex min-w-0 flex-1 flex-col bg-surface h-full">
        <Header />
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-between">
          <main className="px-8 pb-10 pt-6 flex-1">
            <div className="mx-auto max-w-[1000px]">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>

        {/* Interactive Floating Chatbot */}
        {!isChatPage && (
          <>
            <Button
              size="icon"
              className="fixed bottom-[20px] right-[20px] z-20 size-14 rounded-full bg-[#3155F6] shadow-lg hover:bg-[#2563eb] transition-all duration-300 hover:scale-105"
              aria-label="Open AI Chatbot"
              onClick={() => setChatPopupOpen(!isChatPopupOpen)}
            >
              <Bot className="size-6 text-white" />
              <span className="absolute top-1.5 right-1.5 block h-3 w-3 rounded-full bg-[#EF4444] border-2 border-white" />
            </Button>
            {isChatPopupOpen && <ChatPopup onClose={() => setChatPopupOpen(false)} />}
          </>
        )}
      </div>
    </div>
  )
}
