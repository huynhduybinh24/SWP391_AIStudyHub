import {
  BookOpen,
  TrendingUp,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { StudyPlan } from '../types'

export function StatsStrip({ plans }: { plans: StudyPlan[] }) {
  const active    = plans.filter((p) => p.status === 'Active').length
  const completed = plans.filter((p) => p.status === 'Completed').length
  const aiCount   = plans.filter((p) => p.isAiGenerated).length
  const avgProg   = plans.length
    ? Math.round(plans.reduce((s, p) => s + p.overallProgress, 0) / plans.length)
    : 0

  const stats = [
    { label: 'Active Plans',    value: active,    icon: BookOpen,    color: 'text-[#2557E8] bg-[#e5eeff]' },
    { label: 'Completed',       value: completed, icon: ChevronRight, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'AI Generated',    value: aiCount,   icon: Sparkles,    color: 'text-violet-700 bg-violet-50' },
    { label: 'Avg. Progress',   value: `${avgProg}%`, icon: TrendingUp, color: 'text-amber-700 bg-amber-50' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-sm"
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
            <Icon className="size-4" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wide leading-none">
              {label}
            </p>
            <p className="text-xl font-extrabold text-foreground mt-0.5 leading-none">
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
