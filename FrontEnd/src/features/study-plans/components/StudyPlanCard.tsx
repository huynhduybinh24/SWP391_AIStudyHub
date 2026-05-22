import { useState } from 'react'
import {
  BookOpen,
  Clock,
  MoreVertical,
  Sparkles,
  CalendarDays,
  Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StudyPlan, ProgressSegment } from '../types'

function DifficultyBadge({ level }: { level: StudyPlan['difficulty'] }) {
  const map = {
    Easy:   { icon: '↗', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    Medium: { icon: '↗', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    Hard:   { icon: '↗', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  }
  const { icon, color } = map[level]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${color}`}>
      <span>{icon}</span> {level} Difficulty
    </span>
  )
}

function SegmentedProgress({ segments }: { segments: ProgressSegment[] }) {
  return (
    <div className="flex flex-col gap-1.5 mt-3">
      {/* Track */}
      <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden">
        {segments.map((seg, i) => (
          <div key={i} className="flex-1 bg-[#e5eeff] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${seg.value}%`,
                backgroundColor: '#2557E8',
              }}
            />
          </div>
        ))}
      </div>
      {/* Labels */}
      <div className="flex" style={{ gap: 0 }}>
        {segments.map((seg, i) => (
          <span
            key={i}
            className="flex-1 text-[10px] font-semibold text-muted uppercase tracking-wide truncate"
          >
            {seg.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function StudyPlanCard({ plan }: { plan: StudyPlan }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Card className="flex overflow-hidden border border-[#e5eeff] shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Left accent border */}
      <div className="w-1.5 shrink-0 bg-[#2557E8] rounded-l-lg" />

      {/* Main content */}
      <div className="flex flex-1 min-w-0 p-5 gap-4">
        {/* Icon */}
        <div className="shrink-0 flex items-start pt-1">
          <div className="w-10 h-10 rounded-lg bg-[#e5eeff] flex items-center justify-center">
            <BookOpen className="size-5 text-[#2557E8]" strokeWidth={1.75} />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-foreground text-[15px] leading-snug">
                {plan.title}
              </h3>
              {plan.isAiGenerated && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#00897B] text-white text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wide">
                  <Sparkles className="size-3" strokeWidth={2} />
                  AI Generated
                </span>
              )}
            </div>
            {/* More menu */}
            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="p-1.5 rounded-lg text-muted hover:bg-surface hover:text-foreground transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="size-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-20 min-w-[140px] rounded-xl border border-border bg-white shadow-lg py-1">
                  {['Edit Plan', 'Duplicate', 'Archive', 'Delete'].map((item) => (
                    <button
                      key={item}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-surface ${item === 'Delete' ? 'text-danger' : 'text-body'}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-muted text-sm mt-1 leading-relaxed line-clamp-2">
            {plan.description}
          </p>

          {/* Tag pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5eeff] bg-[#f5f7ff] px-3 py-1 text-xs font-medium text-[#2557E8]">
              <Link2 className="size-3.5" /> {plan.documents} Documents
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5eeff] bg-[#f5f7ff] px-3 py-1 text-xs font-medium text-[#2557E8]">
              <Clock className="size-3.5" /> {plan.hoursEst} Hours Est.
            </span>
            <DifficultyBadge level={plan.difficulty} />
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                Overall Progress
              </span>
              <span className="text-xs font-bold text-[#2557E8]">
                {plan.overallProgress}%
              </span>
            </div>
            <SegmentedProgress segments={plan.segments} />
          </div>
        </div>
      </div>

      {/* Right panel – Milestone + Actions */}
      <div className="shrink-0 w-[220px] border-l border-[#e5eeff] flex flex-col justify-between p-5 gap-4 bg-[#fafbff]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">
            Next Milestone
          </p>
          <div className="flex items-start gap-3">
            {/* Date block */}
            <div className="flex flex-col items-center justify-center w-11 h-12 rounded-lg bg-[#2557E8] text-white shrink-0">
              <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
                {plan.milestone.month}
              </span>
              <span className="text-[22px] font-extrabold leading-tight">
                {plan.milestone.day}
              </span>
            </div>
            {/* Text */}
            <div>
              <p className="font-semibold text-foreground text-[13px] leading-snug">
                {plan.milestone.title}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <CalendarDays className="size-3 text-muted" />
                <span className="text-[11px] text-muted">{plan.milestone.time}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-center bg-[#2557E8] hover:bg-[#1d4ed8] text-white font-semibold text-[13px] py-2.5"
            disabled={plan.status === 'Completed'}
          >
            {plan.status === 'Completed' ? 'View Results' : 'Continue Learning'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-center font-semibold text-[13px] py-2.5"
          >
            View Curriculum
          </Button>
        </div>
      </div>
    </Card>
  )
}
