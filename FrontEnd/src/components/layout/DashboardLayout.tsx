import { Outlet, useNavigate } from 'react-router-dom'
import { Bot } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'

export function DashboardLayout() {
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col bg-surface h-full">
        <Header />
        <div className="flex-1 overflow-y-auto flex flex-col justify-between">
          <main className="px-8 pb-10 pt-6 flex-1">
            <div className="mx-auto max-w-[1000px]">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
        <Button
          size="icon"
          className="fixed bottom-20 right-6 z-20 size-12 rounded-full bg-primary-dark shadow-lg hover:bg-primary transition-all duration-300 hover:scale-105"
          aria-label="Open AI Chatbot"
          onClick={() => navigate('/chat')}
        >
          <Bot className="size-5 text-white" />
        </Button>
      </div>
    </div>
  )
}
