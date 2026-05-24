import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { Zap, X, User, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
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

interface TooltipProps {
  children: React.ReactNode
  content: string
  disabled?: boolean
}

function PortalTooltip({ children, content, disabled }: TooltipProps) {
  const [active, setActive] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  if (disabled || !content) return <>{children}</>

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCoords({
      top: rect.top + window.scrollY + (rect.height / 2),
      left: rect.right + window.scrollX + 12 // 12px gap
    })
    setActive(true)
  }

  const handleMouseLeave = () => {
    setActive(false)
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="w-full flex items-center justify-center min-w-0"
    >
      {children}
      {active && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform: 'translateY(-50%)',
          }}
          className="z-[9999] px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg shadow-lg whitespace-nowrap animate-fade-in pointer-events-none transition-all duration-150"
        >
          {content}
        </div>,
        document.body
      )}
    </div>
  )
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
  const isSidebarCollapsed = useUiStore((s) => s.isSidebarCollapsed)

  return (
    <PortalTooltip content={label} disabled={!isSidebarCollapsed}>
      <Link
        to={to}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={cn(
          "group relative flex items-center h-11 text-[15px] font-bold no-underline select-none transition-all duration-200 w-full min-w-0 overflow-hidden shrink-0",
          isSidebarCollapsed 
            ? "justify-center px-2 rounded-2xl w-10 h-10 mx-auto" 
            : "px-3 rounded-xl gap-3",
          "md:max-lg:justify-center md:max-lg:px-2 md:max-lg:w-10 md:max-lg:h-10 md:max-lg:mx-auto md:max-lg:rounded-2xl",
          active
            ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
        )}
      >
        <Icon
          className={cn(
            "size-5 shrink-0 transition-colors duration-200", 
            active 
              ? "text-blue-600 dark:text-blue-300" 
              : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"
          )}
          strokeWidth={active ? 2.25 : 1.75}
        />
        {!isSidebarCollapsed && (
          <span className="md:max-lg:hidden block truncate animate-fade-in min-w-0 flex-1 text-left">
            {label}
          </span>
        )}
      </Link>
    </PortalTooltip>
  )
}

export function Sidebar() {
  const { pathname } = useLocation()
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const isSidebarCollapsed = useUiStore((s) => s.isSidebarCollapsed)
  const setSidebarCollapsed = useUiStore((s) => s.setSidebarCollapsed)
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
          "flex h-screen flex-col justify-between border-r bg-white text-slate-900 border-slate-200 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800 py-5 sticky top-0 left-0 z-50 select-none transition-all duration-300 ease-in-out overflow-x-hidden",
          isSidebarCollapsed ? "w-[72px] px-4" : "w-[240px] px-4",
          // Mobile drawer states
          "max-md:fixed max-md:h-full max-md:w-[240px] max-md:translate-x-0 max-md:px-4 max-md:py-5",
          sidebarOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
        )}
      >
        <div className="flex flex-col gap-0 flex-1 min-h-0">
          {/* Logo and Brand */}
          <div className={cn(
            "flex items-center shrink-0 border-b border-slate-200 dark:border-slate-800 transition-all duration-300 pb-4 mb-5 overflow-hidden w-full min-w-0",
            isSidebarCollapsed ? "flex-col gap-2.5 justify-center px-0" : "justify-between px-1"
          )}>
            <Link to="/dashboard" onClick={handleLinkClick} className="flex items-center gap-2.5 no-underline shrink-0 max-w-full overflow-hidden">
              <img
                src="/logo.png"
                alt="AI Study Hub"
                className="w-8 h-8 shrink-0 object-contain"
              />
              {!isSidebarCollapsed && (
                <div className="flex flex-col justify-center animate-fade-in whitespace-nowrap overflow-hidden min-w-0 text-left">
                  <h1 className="text-[15px] font-bold leading-tight text-slate-900 dark:text-slate-100 tracking-tight truncate">
                    AI Study Hub
                  </h1>
                  <p className="text-[11px] font-semibold leading-tight text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Focused Intelligence
                  </p>
                </div>
              )}
            </Link>
            
            {/* Collapse Button inside header when expanded */}
            {!isSidebarCollapsed && (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors max-md:hidden shrink-0"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="size-5" />
              </button>
            )}

            {/* Expand Button inside header when collapsed */}
            {isSidebarCollapsed && (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors max-md:hidden shrink-0 animate-fade-in"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="size-5" />
              </button>
            )}

            {/* Close button on Mobile */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shrink-0"
              aria-label="Close sidebar"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation list */}
          <nav className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden flex flex-col pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent gap-2"
          )}>
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

        <div className="flex flex-col shrink-0 mt-auto overflow-hidden w-full min-w-0">
          {/* Section Divider & Spacing to separate Main nav from Secondary nav */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 w-full" />

          {/* Bottom Nav items */}
          <nav className={cn("flex flex-col overflow-x-hidden gap-2")}>
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
          <PortalTooltip content={user?.plan === 'pro' ? 'Pro Plan Active' : 'Upgrade to Pro'} disabled={!isSidebarCollapsed}>
            <Link
              to={user?.plan === 'pro' ? '#' : '/dashboard/upgrade'}
              onClick={user?.plan === 'pro' ? undefined : handleLinkClick}
              className={cn(
                "mt-4 mb-4 flex items-center justify-center gap-2 text-sm font-bold transition-all duration-200 shadow-sm shrink-0 no-underline w-full max-w-full overflow-hidden",
                isSidebarCollapsed 
                  ? "rounded-2xl w-10 h-10 mx-auto justify-center p-0" 
                  : "rounded-2xl px-4 h-12",
                user?.plan === 'pro' 
                  ? "bg-slate-100 text-slate-500 cursor-default dark:bg-slate-800 dark:text-slate-400" 
                  : "text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 cursor-pointer",
                "md:max-lg:w-10 md:max-lg:h-10 md:max-lg:mx-auto md:max-lg:rounded-2xl md:max-lg:p-0 md:max-lg:mt-4 md:max-lg:mb-4"
              )}
            >
              <Zap className={cn("size-5 shrink-0", user?.plan === 'pro' ? "text-slate-500 dark:text-slate-400" : "text-white")} strokeWidth={2.25} />
              {!isSidebarCollapsed && (
                <span className="md:max-lg:hidden block truncate animate-fade-in min-w-0">
                  {user?.plan === 'pro' ? 'Pro Plan Active' : 'Upgrade to Pro'}
                </span>
              )}
            </Link>
          </PortalTooltip>

          {/* Footer / Profile Section Wrapper */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col w-full">
            {/* User Profile Card */}
            <PortalTooltip content={`${profile.name} (${user?.email})`} disabled={!isSidebarCollapsed}>
              <div className={cn(
                "flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0 relative transition-all duration-200 overflow-hidden",
                isSidebarCollapsed 
                  ? "w-10 h-10 mx-auto justify-center p-0 border-none bg-transparent dark:bg-transparent rounded-full" 
                  : "p-3 w-full max-w-full rounded-2xl",
                "md:max-lg:w-10 md:max-lg:h-10 md:max-lg:mx-auto md:max-lg:justify-center md:max-lg:p-0 md:max-lg:border-none md:max-lg:bg-transparent md:max-lg:dark:bg-transparent md:max-lg:rounded-full"
              )}>
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="size-5 text-slate-400" />
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <div className="min-w-0 flex-1 md:max-lg:hidden text-left animate-fade-in overflow-hidden">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                      {profile.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-none mt-1">
                      {user?.email}
                    </p>
                  </div>
                )}
              </div>
            </PortalTooltip>

            {/* Logout Button */}
            <PortalTooltip content={t.sidebar.logout} disabled={!isSidebarCollapsed}>
              <button
                type="button"
                onClick={() => setLogoutModalOpen(true)}
                className={cn(
                  "mt-3 flex items-center gap-3 rounded-xl text-[15px] font-bold transition-all duration-200 no-underline select-none text-left cursor-pointer w-full max-w-full overflow-hidden hover:bg-red-50 text-red-600 dark:hover:bg-red-500/10 dark:text-red-400 relative shrink-0 h-11",
                  isSidebarCollapsed 
                    ? "w-10 h-10 mx-auto justify-center p-0 rounded-2xl" 
                    : "px-3",
                  "md:max-lg:w-10 md:max-lg:h-10 md:max-lg:mx-auto md:max-lg:justify-center md:max-lg:p-0 md:max-lg:mt-3"
                )}
              >
                <LogOut className="size-5 shrink-0 text-red-500 dark:text-red-400" />
                {!isSidebarCollapsed && <span className="md:max-lg:hidden block truncate animate-fade-in min-w-0 flex-1 text-left">{t.sidebar.logout}</span>}
              </button>
            </PortalTooltip>
          </div>
        </div>
      </aside>

      {/* Confirm Logout Modal */}
      <ConfirmLogoutModal isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} />
    </>
  )
}
