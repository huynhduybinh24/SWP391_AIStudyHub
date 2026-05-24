import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Zap, X, User, LogOut } from 'lucide-react'
import { bottomNavItems, mainNavItems } from '@/config/navigation'
import { useUiStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'
import { useProfileStore } from '@/features/profile/stores/profileStore'
import { ConfirmLogoutModal } from '@/components/layout/ConfirmLogoutModal'

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
        "group relative flex items-center gap-3 px-4 py-2.5 text-sm font-bold no-underline select-none rounded-xl transition-all duration-200",
        "md:max-lg:justify-center md:max-lg:px-2 md:max-lg:py-3",
        active
          ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
      )}
    >
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-colors duration-200", 
          active 
            ? "text-blue-600 dark:text-blue-300" 
            : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"
        )}
        strokeWidth={active ? 2.25 : 1.75}
      />
      <span className="md:max-lg:hidden block truncate">{label}</span>

      {/* Collapsed Tooltip */}
      <span className="absolute left-full ml-2 px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 scale-95 origin-left group-hover:scale-100 hidden md:max-lg:block">
        {label}
      </span>
    </Link>
  )
}

export function Sidebar() {
  const { pathname } = useLocation()
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const user = useAuthStore((s) => s.user)
  const { t } = useTranslation()
  const { profile } = useProfileStore()
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

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
          "flex h-screen flex-col justify-between border-r bg-white text-slate-900 border-slate-200 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800 py-6 px-4 sticky top-0 left-0 z-50 select-none transition-colors duration-200",
          "w-64 md:max-lg:w-20",
          // Mobile drawer states
          "max-md:fixed max-md:h-full max-md:w-64 max-md:translate-x-0 transition-transform duration-200",
          sidebarOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
        )}
      >
        <div className="flex flex-col gap-6 flex-1 min-h-0">
          {/* Logo and Brand */}
          <div className="px-2 pb-5 flex items-center justify-between shrink-0 border-b border-slate-200 dark:border-slate-800">
            <Link to="/dashboard" onClick={handleLinkClick} className="flex items-center gap-3.5 no-underline">
              <img
                src="/logo.png"
                alt="AI Study Hub"
                className="w-[68px] h-[68px] shrink-0 object-contain"
              />
              <div className="flex flex-col justify-center md:max-lg:hidden">
                <h1 className="text-[21px] font-extrabold leading-tight text-slate-900 dark:text-slate-100 tracking-tight">
                  AI Study Hub
                </h1>
                <p className="text-[12px] font-semibold leading-tight text-slate-500 dark:text-slate-400 mt-0.5">
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
          <nav className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
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
          <div className="border-t border-slate-200 dark:border-slate-800 my-3 w-full" />

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
            to={user?.plan === 'pro' ? '#' : '/dashboard/upgrade'}
            onClick={user?.plan === 'pro' ? undefined : handleLinkClick}
            className={cn(
              "mt-4 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-200 shadow-sm shrink-0 no-underline",
              user?.plan === 'pro' 
                ? "bg-slate-100 text-slate-500 cursor-default dark:bg-slate-800 dark:text-slate-400" 
                : "text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 cursor-pointer",
              "md:max-lg:px-2 md:max-lg:py-3"
            )}
          >
            <Zap className={cn("size-4 shrink-0", user?.plan === 'pro' ? "text-slate-500 dark:text-slate-400" : "text-white")} strokeWidth={2.25} />
            <span className="md:max-lg:hidden block">
              {user?.plan === 'pro' ? 'Pro Plan Active' : 'Upgrade to Pro'}
            </span>
          </Link>

          {/* Divider for User Profile Section */}
          <div className="border-t border-slate-200 dark:border-slate-800 my-3 w-full" />

          {/* User Profile Card */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 md:max-lg:p-1.5 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <User className="size-5 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1 md:max-lg:hidden text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {profile.name}
              </p>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate leading-none mt-1">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => setLogoutModalOpen(true)}
            className="mt-1 flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 no-underline select-none text-left cursor-pointer w-full hover:bg-red-50 text-red-600 dark:hover:bg-red-500/10 dark:text-red-400 md:max-lg:justify-center md:max-lg:px-2 md:max-lg:py-3 shrink-0"
          >
            <LogOut className="size-[18px] shrink-0 text-red-500 dark:text-red-400" />
            <span className="md:max-lg:hidden block truncate">{t.sidebar.logout}</span>
          </button>
        </div>
      </aside>

      {/* Confirm Logout Modal */}
      <ConfirmLogoutModal isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} />
    </>
  )
}
