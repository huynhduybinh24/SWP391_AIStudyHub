import { Link, useLocation } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { bottomNavItems, mainNavItems } from '@/config/navigation'

function isNavActive(pathname: string, path: string) {
  if (pathname === '/dashboard/shared-files/research-materials' || pathname === '/dashboard/shared-files/research-materials/') {
    return path === '/dashboard/notifications'
  }
  if (path === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/dashboard/'
  }
  if (path === '/') {
    return pathname === '/' || pathname === ''
  }
  return pathname === path || pathname.startsWith(`${path}/`)
}

function SidebarLink({
  to,
  icon: Icon,
  label,
}: {
  to: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>
  label: string
}) {
  const { pathname } = useLocation()
  const active = isNavActive(pathname, to)

  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`
        flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200 no-underline select-none
        ${active 
          ? 'bg-[#2557E8] text-white rounded-xl shadow-sm' 
          : 'text-[#4b5563] hover:bg-slate-50 hover:text-slate-900 rounded-xl'
        }
      `}
    >
      <Icon 
        className="size-[18px] shrink-0" 
        strokeWidth={active ? 2 : 1.75} 
        style={{ color: active ? '#ffffff' : '#6B7280' }}
      />
      <span>{label}</span>
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside className="flex h-screen w-[256px] shrink-0 flex-col justify-between border-r border-[#EAECF0] bg-white py-6 px-4 sticky top-0 left-0 z-30 select-none">
      <div className="flex flex-col gap-6 flex-1 min-h-0">
        {/* Logo and Brand */}
        <div className="px-2 flex items-center gap-3 shrink-0">
          <img 
            src="/logo.png" 
            alt="AI Study Hub" 
            className="w-9 h-9 shrink-0 object-contain" 
          />
          <div className="flex flex-col justify-center">
            <h1 className="text-[19px] font-bold leading-tight text-[#2557E8] tracking-tight">AI Study Hub</h1>
            <p className="text-[11px] font-medium leading-none text-[#737686] mt-0.5">Focused Intelligence</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1">
          {mainNavItems.map((item) => (
            <SidebarLink key={item.path} to={item.path} icon={item.icon} label={item.label} />
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-1 px-1 shrink-0 mt-auto">
        {/* Divider */}
        <div className="border-t border-[#EAECF0] my-3 w-full" />
        
        {/* Bottom Nav items */}
        <nav className="flex flex-col gap-1">
          {bottomNavItems.map((item) => (
            <SidebarLink key={item.path} to={item.path} icon={item.icon} label={item.label} />
          ))}
        </nav>

        {/* Upgrade to Pro button */}
        <button
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2557E8] py-3 text-sm font-semibold text-white hover:bg-[#1a45cb] transition-all duration-200 cursor-pointer shadow-sm shadow-[#2557E8]/10 shrink-0"
        >
          <Zap className="size-4 text-white" strokeWidth={2} />
          Upgrade to Pro
        </button>
      </div>
    </aside>
  )
}

