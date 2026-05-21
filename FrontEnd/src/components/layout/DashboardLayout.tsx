import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Bot } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const isChatPage = location.pathname === '/dashboard/chat' || location.pathname === '/dashboard/chat/'

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col bg-surface">
        <Header />
        <main className="flex-1 overflow-auto px-8 pb-20 pt-8">
          <div className="mx-auto max-w-[1000px]">
            <Outlet />
          </div>
        </main>
        <Footer />
        {!isChatPage && (
          <Button
            size="icon"
            className="fixed bottom-24 right-8 z-20 size-14 rounded-full bg-[#3155F6] shadow-lg hover:bg-[#2563eb] relative"
            aria-label="Open AI Chatbot"
            onClick={() => navigate('/dashboard/chat')}
          >
            <Bot className="size-6 text-white" />
            <span className="absolute top-1.5 right-1.5 block h-3 w-3 rounded-full bg-[#e5eeff] border-2 border-[#3155F6]" />
          </Button>
        )}
      </div>
    </div>
  )
}
