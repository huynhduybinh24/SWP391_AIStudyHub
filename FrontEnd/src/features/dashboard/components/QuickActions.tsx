import { Link } from 'react-router-dom'
import { Bot, CalendarDays, Search, Share2, Upload } from 'lucide-react'
import { CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

const actions = [
  { label: 'Upload', icon: Upload, to: '/dashboard/upload' },
  { label: 'Search', icon: Search, to: '/dashboard/documents/search' },
  { label: 'AI Chat', icon: Bot, to: '/dashboard/chat' },
  { label: 'Shared', icon: Share2, to: '/dashboard/shared' },
  { label: 'Study Plans', icon: CalendarDays, to: '/dashboard/study-plans' },
] as const

export function QuickActions() {
  return (
    <section className="col-span-8 space-y-4">
      <CardTitle>Quick Actions</CardTitle>
      <div className="grid grid-cols-5 gap-3">
        {actions.map(({ label, icon: Icon, to }) => (
          <Link
            key={label}
            to={to}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-lg border border-border',
              'bg-white py-7 transition-colors hover:border-primary/30 hover:bg-surface',
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-icon-bg text-primary">
              <Icon className="size-4" />
            </span>
            <span className="text-center text-base text-foreground">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
