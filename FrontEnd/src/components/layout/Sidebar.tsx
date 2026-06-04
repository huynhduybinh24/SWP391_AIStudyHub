import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { Zap, X, PanelLeftClose, PanelLeftOpen, Users, CreditCard, Bell, LayoutDashboard, TrendingUp, ClipboardList, AlertTriangle, FileText, Handshake } from 'lucide-react'
import { bottomNavItems, mainNavItems } from '@/config/navigation'
import { useUiStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'
import { AIChatbotIcon } from '@/components/layout/FloatingAssistantButton'

function isNavActive(pathname: string, search: string, targetPathWithQuery: string) {
  const [targetPath, targetQuery] = targetPathWithQuery.split('?')
  if (pathname.startsWith('/dashboard/shared-files')) {
    return targetPath === '/dashboard/shared'
  }
  if (targetPath === '/dashboard/admin') {
    if (pathname !== '/dashboard/admin') return false
    const currentTab = new URLSearchParams(search).get('tab') || 'overview'
    const targetTab = new URLSearchParams(targetQuery || '').get('tab') || 'overview'
    return currentTab === targetTab
  }
  if (targetPath === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/dashboard/'
  }
  if (targetPath === '/') {
    return pathname === '/' || pathname === ''
  }
  return pathname === targetPath || pathname.startsWith(`${targetPath}/`)
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
  search?: string
  onClick?: () => void
}

function SidebarLink({ to, icon: Icon, label, pathname, search = '', onClick }: SidebarLinkProps) {
  const active = isNavActive(pathname, search, to)
  const isSidebarCollapsed = useUiStore((s) => s.isSidebarCollapsed)

  return (
    <PortalTooltip content={label} disabled={!isSidebarCollapsed}>
      <Link
        to={to}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={cn(
          "group relative flex items-center text-[15px] font-bold no-underline select-none transition-all duration-200 w-full min-w-0 overflow-hidden shrink-0",
          isSidebarCollapsed 
            ? "justify-center px-2 rounded-xl w-[38px] h-[38px] mx-auto" 
            : "px-3 h-[42px] rounded-xl gap-2.5",
          "md:max-lg:justify-center md:max-lg:px-2 md:max-lg:w-[38px] md:max-lg:h-[38px] md:max-lg:mx-auto md:max-lg:rounded-xl",
          active
            ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
        )}
      >
        {to === '/dashboard/chat' ? (
          <AIChatbotIcon
            className={cn(
              "size-5 shrink-0 transition-colors duration-200", 
              active 
                ? "text-blue-600 dark:text-blue-300" 
                : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"
            )}
          />
        ) : (
          <Icon
            className={cn(
              "size-5 shrink-0 transition-colors duration-200", 
              active 
                ? "text-blue-600 dark:text-blue-300" 
                : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"
            )}
            strokeWidth={active ? 2.25 : 1.75}
          />
        )}
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
  const { pathname, search } = useLocation()
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const isSidebarCollapsed = useUiStore((s) => s.isSidebarCollapsed)
  const setSidebarCollapsed = useUiStore((s) => s.setSidebarCollapsed)
  const user = useAuthStore((s) => s.user)
  const { t, language } = useTranslation()

  const adminNavItems = [
    { label: 'Admin Dashboard', path: '/dashboard/admin?tab=overview', icon: LayoutDashboard },
    { label: 'User Management', path: '/dashboard/admin?tab=users', icon: Users },
    { label: 'Document Management', path: '/dashboard/admin?tab=ai-moderation', icon: FileText },
    { label: 'Package Management', path: '/dashboard/admin?tab=packages', icon: CreditCard },
    { label: 'Notification Management', path: '/dashboard/admin?tab=notifications', icon: Bell },
    { label: 'Partnership Requests', path: '/dashboard/admin?tab=partnership-requests', icon: Handshake },
    { label: 'Analytics', path: '/dashboard/admin?tab=analytics', icon: TrendingUp },
    { label: 'Activity Logs', path: '/dashboard/admin?tab=activity-logs', icon: ClipboardList },
    { label: 'Reports', path: '/dashboard/admin?tab=reports', icon: AlertTriangle },
  ]

  const getSidebarLabel = (label: string) => {
    switch (label.toLowerCase()) {
      case 'partnership requests':
        return language === 'vi' ? 'Yêu cầu Hợp tác' : 'Partnership Requests'
      case 'dashboard':
        return t.sidebar.dashboard
      case 'my documents':
        return t.sidebar.myDocuments
      case 'upload':
        return t.sidebar.upload
      case 'shared files':
        return t.sidebar.sharedFiles
      case 'cloud storage':
        return t.sidebar.cloudStorage
      case 'notifications':
        return t.sidebar.notifications
      case 'study plans':
        return t.sidebar.studyPlans
      case 'ai chatbot':
        return t.sidebar.aiChatbot
      case 'profile':
        return t.sidebar.profile
      case 'settings':
        return t.sidebar.settings
      case 'upgrade to pro':
        return t.sidebar.upgradePro
      case 'log out':
        return t.sidebar.logout
      case 'admin panel':
        return t.sidebar.adminPanel
      case 'admin dashboard':
        return language === 'vi' ? 'Tổng quan Admin' : 'Admin Dashboard'
      case 'user management':
        return language === 'vi' ? 'Quản lý người dùng' : 'User Management'
      case 'package management':
        return language === 'vi' ? 'Quản lý gói cước' : 'Package Management'
      case 'notification management':
        return language === 'vi' ? 'Gửi thông báo' : 'Notification Management'
      case 'analytics':
        return language === 'vi' ? 'Thống kê' : 'Analytics'
      case 'activity logs':
        return language === 'vi' ? 'Nhật ký hoạt động' : 'Activity Logs'
      case 'reports':
        return language === 'vi' ? 'Báo cáo vi phạm' : 'Reports'
      case 'document management':
        return language === 'vi' ? 'Quản lý tài liệu' : 'Document Management'
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
          "flex h-screen min-h-0 flex-col justify-between border-r bg-white text-slate-900 border-slate-200 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800 pt-5 pb-3 sticky top-0 left-0 z-50 select-none transition-all duration-300 ease-in-out overflow-y-hidden overflow-x-hidden",
          isSidebarCollapsed ? "w-[72px] px-4" : "w-[240px] px-4",
          // Mobile drawer states
          "max-md:fixed max-md:h-full max-md:w-[240px] max-md:translate-x-0 max-md:px-4 max-md:pt-5 max-md:pb-3",
          sidebarOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
        )}
      >
        <div className="flex flex-col gap-0 w-full flex-1 min-h-0">
          {/* Logo and Brand */}
          <div className={cn(
            "flex items-center shrink-0 border-b border-slate-200 dark:border-slate-800 transition-all duration-300 pb-4 mb-5 overflow-hidden w-full min-w-0",
            isSidebarCollapsed ? "justify-center px-0 md:justify-center md:px-0 max-md:justify-between max-md:px-1" : "justify-between px-1"
          )}>
            {/* Collapsed Header (Desktop only) */}
            {isSidebarCollapsed && (
              <div className="hidden md:flex group relative size-10 items-center justify-center mx-auto shrink-0 select-none">
                <img
                  src="/logo.png"
                  alt="LumiEdu"
                  className="
                    size-8 transition-opacity duration-200
                    group-hover:opacity-0 group-focus-within:opacity-0 object-contain
                  "
                />

                <button
                  type="button"
                  aria-label="Expand sidebar"
                  onClick={() => setSidebarCollapsed(false)}
                  className="
                    absolute inset-0 flex size-10 items-center justify-center rounded-xl
                    opacity-0 transition-opacity duration-200
                    group-hover:opacity-100 group-focus-within:opacity-100
                    hover:bg-slate-100 dark:hover:bg-slate-800
                    text-slate-600 dark:text-slate-300
                    focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none
                    cursor-pointer
                  "
                >
                  <PanelLeftOpen className="size-5" />
                </button>
              </div>
            )}

            {/* Expanded Header (Desktop expanded / Mobile always) */}
            {!isSidebarCollapsed ? (
              <>
                              <Link to={user?.role?.toLowerCase() === 'admin' ? "/dashboard/admin" : "/dashboard"} onClick={handleLinkClick} className="flex items-center gap-2.5 no-underline shrink-0 max-w-full overflow-hidden select-none">
                  <img
                    src="/logo.png"
                    alt="LumiEdu"
                    className="w-14 h-14 shrink-0 object-contain"
                  />
                  <div className="flex flex-col justify-center animate-fade-in whitespace-nowrap overflow-hidden min-w-0 text-left">
                    <h1 className="text-[21px] font-extrabold leading-tight text-blue-600 dark:text-blue-400 tracking-tight truncate">
                      LumiEdu
                    </h1>
                    <p className="text-[9.5px] font-bold leading-tight text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {t.sidebar.brandSubtitle || "Illuminate Your Learning"}
                    </p>
                  </div>
                </Link>

                {/* Collapse Button inside header when expanded */}
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors max-md:hidden shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="size-5" />
                </button>
              </>
            ) : (
              /* Expanded Header layout visible ONLY on Mobile when collapsed */
              <div className="md:hidden flex items-center justify-between w-full min-w-0">
                <Link to={user?.role?.toLowerCase() === 'admin' ? "/dashboard/admin" : "/dashboard"} onClick={handleLinkClick} className="flex items-center gap-2.5 no-underline shrink-0 max-w-full overflow-hidden select-none">
                  <img
                    src="/logo.png"
                    alt="LumiEdu"
                    className="w-14 h-14 shrink-0 object-contain"
                  />
                  <div className="flex flex-col justify-center whitespace-nowrap overflow-hidden min-w-0 text-left">
                    <h1 className="text-[21px] font-extrabold leading-tight text-blue-600 dark:text-blue-400 tracking-tight truncate">
                      LumiEdu
                    </h1>
                    <p className="text-[9.5px] font-bold leading-tight text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {t.sidebar.brandSubtitle || "Illuminate Your Learning"}
                    </p>
                  </div>
                </Link>
              </div>
            )}

            {/* Close button on Mobile (visible only on small screens) */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              aria-label="Close sidebar"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation list */}
          <nav className="flex flex-col gap-1.5 pr-1 overflow-y-auto flex-1 min-h-0 no-scrollbar">
            {user?.role?.toLowerCase() === 'admin' ? (
              adminNavItems.map((item) => (
                <SidebarLink
                  key={item.path}
                  to={item.path}
                  icon={item.icon}
                  label={getSidebarLabel(item.label)}
                  pathname={pathname}
                  search={search}
                  onClick={handleLinkClick}
                />
              ))
            ) : (
              mainNavItems.map((item) => (
                <SidebarLink
                  key={item.path}
                  to={item.path}
                  icon={item.icon}
                  label={getSidebarLabel(item.label)}
                  pathname={pathname}
                  search={search}
                  onClick={handleLinkClick}
                />
              ))
            )}
          </nav>
        </div>

        <div className="flex flex-col shrink-0 mt-auto overflow-visible w-full min-w-0">
          {/* Section Divider & Spacing to separate Main nav from Secondary nav */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 w-full" />

          {/* Bottom Nav items */}
          <nav className={cn("flex flex-col overflow-x-hidden gap-1.5")}>
            {bottomNavItems.map((item) => (
              <SidebarLink
                key={item.path}
                to={item.path}
                icon={item.icon}
                label={getSidebarLabel(item.label)}
                pathname={pathname}
                search={search}
                onClick={handleLinkClick}
              />
            ))}
          </nav>

          {/* Upgrade to Pro button */}
          {user?.role?.toLowerCase() !== 'admin' && (() => {
            const isPro = user?.plan === 'pro';
            const isPremium = user?.plan === 'institutional';
            
            const btnLabel = isPremium
              ? (language === 'vi' ? 'Xem các gói cước' : 'View Plans')
              : isPro
                ? (language === 'vi' ? 'Nâng cấp Premium' : 'Upgrade to Premium')
                : (t.sidebar.upgradePro || 'Upgrade to Pro');
                
            return (
              <PortalTooltip content={btnLabel} disabled={!isSidebarCollapsed}>
                <Link
                  to="/dashboard/upgrade"
                  onClick={handleLinkClick}
                  className={cn(
                    "mt-2 mb-2 flex items-center justify-center gap-2 text-sm font-bold transition-all duration-200 shadow-sm shrink-0 no-underline w-full max-w-full overflow-hidden",
                    isSidebarCollapsed 
                      ? "rounded-2xl w-10 h-10 mx-auto justify-center p-0" 
                      : "rounded-2xl px-4 h-12",
                    isPremium
                      ? "text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 cursor-pointer"
                      : "text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 cursor-pointer",
                    "md:max-lg:w-10 md:max-lg:h-10 md:max-lg:mx-auto md:max-lg:rounded-2xl md:max-lg:p-0 md:max-lg:mt-2 md:max-lg:mb-2"
                  )}
                >
                  <Zap className="size-5 shrink-0 text-white" strokeWidth={2.25} />
                  {!isSidebarCollapsed && (
                    <span className="md:max-lg:hidden block truncate animate-fade-in min-w-0">
                      {btnLabel}
                    </span>
                  )}
                </Link>
              </PortalTooltip>
            );
          })()}
        </div>
      </aside>
    </>
  )
}
