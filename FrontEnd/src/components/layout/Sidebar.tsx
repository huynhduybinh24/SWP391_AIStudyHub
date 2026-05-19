import { Link, useLocation } from 'react-router-dom'
import { Brain, Zap } from 'lucide-react'
import { bottomNavItems, mainNavItems } from '@/config/navigation'

function isNavActive(pathname: string, path: string) {
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
  const color = active ? '#ffffff' : '#434655'

  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-normal leading-6 no-underline"
      style={{
        backgroundColor: active ? '#2563eb' : 'transparent',
        color,
      }}
    >
      <Icon className="size-[18px] shrink-0" style={{ color }} strokeWidth={active ? 2 : 1.75} />
      <span>{label}</span>
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside className="flex h-full w-[256px] shrink-0 flex-col justify-between border-r border-[rgba(195,198,215,0.3)] bg-white py-6 pl-6 pr-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      <div>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e5eeff]">
            <Brain className="size-6 text-[#2563eb]" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xl font-bold leading-[25px] text-[#2563eb]">AI Study Hub</p>
            <p className="text-xs font-normal leading-3 text-[#737686]">Focused Intelligence</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 overflow-y-auto pr-2">
          {mainNavItems.map((item) => (
            <SidebarLink key={item.path} to={item.path} icon={item.icon} label={item.label} />
          ))}
        </nav>
      </div>

      <div className="border-t border-[rgba(195,198,215,0.3)] pt-[25px]">
        <nav className="flex flex-col gap-1">
          {bottomNavItems.map((item) => (
            <SidebarLink key={item.path} to={item.path} icon={item.icon} label={item.label} />
          ))}
        </nav>
        <button
          type="button"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] py-2.5 text-base font-normal text-white hover:bg-[#1d4ed8]"
        >
          <Zap className="size-3.5 text-white" strokeWidth={2} />
          Upgrade to Pro
        </button>
      </div>
    </aside>
  )
}
