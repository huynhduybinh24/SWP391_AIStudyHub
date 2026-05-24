import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { AppFooter } from '@/components/shared/AppFooter'
import { FloatingAssistantButton } from '@/components/layout/FloatingAssistantButton'
import { useUiStore } from '@/stores/uiStore'
import { useStudyTimeTracker } from '@/features/dashboard/hooks/useStudyTimeTracker'

export function DashboardLayout() {
  useStudyTimeTracker()
  const location = useLocation()
  const isChatPage = location.pathname === '/dashboard/chat' || location.pathname === '/dashboard/chat/'
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f7fb] text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300 relative">
      <Sidebar />
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="relative flex min-w-0 flex-1 flex-col bg-[#f5f7fb] dark:bg-slate-950 transition-colors duration-300 h-full">
        <Header />
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-between">
          <main className="px-8 pb-10 pt-6 flex-1">
            <div className="mx-auto max-w-[1200px]">
              <Outlet />
            </div>
          </main>
          <AppFooter variant="simple" />
        </div>

        {/* Interactive Floating Chatbot */}
        {!isChatPage && <FloatingAssistantButton />}
      </div>
    </div>
  )
}
