import { Sparkles } from 'lucide-react'
import { FilterTab } from '../types'

const TABS: FilterTab[] = ['All', 'Active', 'Completed', 'Upcoming', 'AI Generated']

export function FilterTabs({
  active,
  onChange,
}: {
  active: FilterTab
  onChange: (t: FilterTab) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const isActive = tab === active
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              isActive
                ? 'bg-[#2557E8] border-[#2557E8] text-white shadow-sm'
                : 'border-[#d1d5db] text-body bg-white hover:bg-surface hover:border-[#a5b4fc]'
            }`}
          >
            {tab === 'AI Generated' && (
              <Sparkles className="size-3.5" strokeWidth={2} />
            )}
            {tab}
          </button>
        )
      })}
    </div>
  )
}
