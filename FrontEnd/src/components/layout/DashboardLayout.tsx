import { Outlet, useNavigate } from 'react-router-dom'
import { Bot } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'

export function DashboardLayout() {
  const navigate = useNavigate()

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
        <Button
          size="icon"
          className="fixed bottom-24 right-8 z-20 size-14 rounded-full bg-primary-dark shadow-lg hover:bg-primary"
          aria-label="Open AI Chatbot"
          onClick={() => navigate('/chat')}
        >
          <Bot className="size-6 text-white" />
        </Button>
      </div>
    </div>
  )
}
