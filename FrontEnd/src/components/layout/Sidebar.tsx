import { Link, useLocation } from 'react-router-dom'
import { Zap, X } from 'lucide-react'
import { bottomNavItems, mainNavItems } from '@/config/navigation'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

function isNavActive(pathname: string, path: string) {
  if (pathname.startsWith('/dashboard/shared-files')) {
    return path === '/dashboard/shared'
  }
  if (path === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/dashboard/'
  }
  if (path === '/') {
    return pathname === '/' || pathname === ''
  }
  return pathname === path || pathname.startsWith(`${path}/`)
}

interface SidebarLinkProps {
  to: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>
  label: string
  pathname: string
  onClick?: () => void
}

function SidebarLink({ to, icon: Icon, label, pathname, onClick }: SidebarLinkProps) {
  const active = isNavActive(pathname, to)

  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all duration-200 no-underline select-none rounded-xl",
        "md:max-lg:justify-center md:max-lg:px-2 md:max-lg:py-3",
        active
          ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      )}
    >
      <Icon
        className={cn("size-[18px] shrink-0 transition-colors", active ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200")}
        strokeWidth={active ? 2.25 : 1.75}
      />
      <span className="md:max-lg:hidden block truncate">{label}</span>
    </Link>
  )
}

export function Sidebar() {
  const { pathname } = useLocation()
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const { t } = useTranslation()

  const getSidebarLabel = (label: string) => {
    switch (label.toLowerCase()) {
      case 'dashboard':
        return t.sidebar.dashboard
      case 'my documents':
        return t.sidebar.myDocuments
      case 'shared files':
        return t.sidebar.sharedFiles
      case 'study plans':
        return t.sidebar.studyPlans
      case 'ai chatbot':
        return t.sidebar.aiChatbot
      case 'settings':
        return t.sidebar.settings
      case 'upgrade to pro':
        return t.sidebar.upgradePro
      case 'log out':
        return t.sidebar.logout
      default:
        return label
    }
  }

  const handleLinkClick = () => {
    // Close sidebar drawer on mobile after clicking a link
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  return (
    <>
      <aside
        className={cn(
          "flex h-screen flex-col justify-between border-r border-[#EAECF0] dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 sticky top-0 left-0 z-50 select-none transition-all duration-300",
          "w-64 md:max-lg:w-20",
          // Mobile drawer states
          "max-md:fixed max-md:h-full max-md:w-64 max-md:translate-x-0",
          sidebarOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
        )}
      >
        <div className="flex flex-col gap-6 flex-1 min-h-0">
          {/* Logo and Brand */}
          <div className="px-2 flex items-center justify-between shrink-0">
            <Link to="/dashboard" onClick={handleLinkClick} className="flex items-center gap-3.5 no-underline">
              <img
                src="/logo.png"
                alt="AI Study Hub"
                className="w-[68px] h-[68px] shrink-0 object-contain"
              />
              <div className="flex flex-col justify-center md:max-lg:hidden">
                <h1 className="text-[21px] font-extrabold leading-tight text-[#3155F6] dark:text-blue-500 tracking-tight">
                  AI Study Hub
                </h1>
                <p className="text-[12px] font-semibold leading-tight text-slate-400 dark:text-slate-500 mt-0.5">
                  Focused Intelligence
                </p>
              </div>
            </Link>
            
            {/* Close button on Mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation list */}
          <nav className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 scrollbar-thin">
            {mainNavItems.map((item) => (
              <SidebarLink
                key={item.path}
                to={item.path}
                icon={item.icon}
                label={getSidebarLabel(item.label)}
                pathname={pathname}
                onClick={handleLinkClick}
              />
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-1 px-1 shrink-0 mt-auto">
          {/* Divider */}
          <div className="border-t border-[#EAECF0] dark:border-slate-800 my-3 w-full" />

          {/* Bottom Nav items */}
          <nav className="flex flex-col gap-1">
            {bottomNavItems.map((item) => (
              <SidebarLink
                key={item.path}
                to={item.path}
                icon={item.icon}
                label={getSidebarLabel(item.label)}
                pathname={pathname}
                onClick={handleLinkClick}
              />
            ))}
          </nav>

          {/* Upgrade to Pro button */}
          <Link
            to="/dashboard/upgrade"
            onClick={handleLinkClick}
            className={cn(
              "mt-4 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all duration-200 cursor-pointer shadow-sm shrink-0 no-underline bg-blue-600 hover:bg-blue-500 active:bg-blue-700",
              "md:max-lg:px-2 md:max-lg:py-3"
            )}
          >
            <Zap className="size-4 text-white shrink-0" strokeWidth={2.25} />
            <span className="md:max-lg:hidden block">{t.sidebar.upgradePro}</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
