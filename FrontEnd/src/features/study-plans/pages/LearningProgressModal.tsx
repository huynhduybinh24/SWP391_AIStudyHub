import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  FileText,
  HelpCircle,
  Code2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  FlaskConical,
  Sparkles,
  Clock3,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

// ─── Types ───────────────────────────────────────────────

export type LessonType = 'video' | 'reading' | 'quiz' | 'practice'

export type LearningLesson = {
  id: string
  title: string
  duration: string
  type: LessonType
  completed: boolean
}

export type LearningSection = {
  label: string
  value: number
  lessons: LearningLesson[]
}

export type LearningProgressPlan = {
  id: string
  title: string
  description: string
  isAiGenerated: boolean
  overallProgress: number
  sections: LearningSection[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  plan: LearningProgressPlan | null
}

// ─── Lesson type icon ─────────────────────────────────────

function LessonTypeIcon({ type }: { type: LessonType }) {
  const map: Record<LessonType, { icon: React.ComponentType<{ className?: string }>, color: string }> = {
    video:    { icon: PlayCircle, color: 'text-[#2557E8]'   },
    reading:  { icon: FileText,   color: 'text-slate-400'   },
    quiz:     { icon: HelpCircle, color: 'text-amber-500'   },
    practice: { icon: Code2,      color: 'text-emerald-500' },
  }
  const { icon: Icon, color } = map[type]
  return <Icon className={`size-4 shrink-0 ${color}`} />
}

// ─── Component ───────────────────────────────────────────

export function LearningProgressModal({ isOpen, onClose, plan }: Props) {
  // ── All hooks MUST be called before any conditional return ──

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Reset state when plan changes
  useEffect(() => {
    if (!plan) return
    const initial = new Set(
      plan.sections.flatMap((s) => s.lessons.filter((l) => l.completed).map((l) => l.id))
    )
    setCompletedIds(initial)
    // Auto-expand first section with incomplete lessons
    const target = plan.sections.find((s) => s.lessons.some((l) => !initial.has(l.id)))
    setExpandedSection(target?.label ?? plan.sections[0]?.label ?? null)
  }, [plan?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived: per-section stats (hook before guard) ───────
  const sectionStats = useMemo(
    () =>
      (plan?.sections ?? []).map((section) => {
        const done = section.lessons.filter((l) => completedIds.has(l.id)).length
        const pct  =
          section.lessons.length === 0
            ? 0
            : Math.round((done / section.lessons.length) * 100)
        return { done, total: section.lessons.length, pct }
      }),
    [plan?.sections, completedIds]
  )

  // ── Now safe to early-return after all hooks ─────────────
  if (!plan) return null

  // ── Non-hook derived values ───────────────────────────────
  const allLessons     = plan.sections.flatMap((s) => s.lessons)
  const totalCount     = allLessons.length
  const completedCount = allLessons.filter((l) => completedIds.has(l.id)).length
  const overallPct     = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
  const nextLesson     = allLessons.find((l) => !completedIds.has(l.id))

  // SVG circular progress
  const radius  = 34
  const circum  = 2 * Math.PI * radius
  const dashOff = circum * (1 - overallPct / 100)

  // ── Handlers ─────────────────────────────────────────────

  const toggleLesson = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleResume = () => {
    if (!nextLesson) return
    // Mark the next lesson as completed
    setCompletedIds((prev) => new Set([...prev, nextLesson.id]))
    // Expand the section containing it
    const ownerSection = plan.sections.find((s) =>
      s.lessons.some((l) => l.id === nextLesson.id)
    )
    if (ownerSection) setExpandedSection(ownerSection.label)
  }

  // ─────────────────────────────────────────────────────────

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Learning Progress"
      description={plan.title}
      className="max-w-2xl"
    >
      {/* ── Overview banner ── */}
      <div className="flex items-center gap-5 rounded-xl bg-[#f0f4ff] border border-[#e5eeff] p-4 mb-5">
        {/* Circular progress ring */}
        <div className="relative flex items-center justify-center w-[80px] h-[80px] shrink-0">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={radius} fill="none" stroke="#dce8ff" strokeWidth="8" />
            <circle
              cx="40" cy="40" r={radius} fill="none"
              stroke="#2557E8" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circum}
              strokeDashoffset={dashOff}
              className="transition-all duration-500"
            />
          </svg>
          <span className="text-[16px] font-extrabold text-[#2557E8] z-10">
            {overallPct}%
          </span>
        </div>

        {/* Plan info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#e8eeff] flex items-center justify-center shrink-0">
              <FlaskConical className="size-4 text-[#2557E8]" strokeWidth={1.75} />
            </div>
            <h3 className="font-bold text-slate-900 text-[15px] leading-snug">
              {plan.title}
            </h3>
            {plan.isAiGenerated && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#00897B] text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide">
                <Sparkles className="size-2.5" /> AI
              </span>
            )}
          </div>

          <p className="text-slate-500 text-sm line-clamp-1">{plan.description}</p>

          <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <BookOpen className="size-3.5" />
              {completedCount}/{totalCount} lessons completed
            </span>
            {nextLesson && (
              <span className="flex items-center gap-1 text-[#2557E8] font-semibold">
                <Clock3 className="size-3.5" />
                Next: {nextLesson.title}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Sections accordion ── */}
      <div className="flex flex-col gap-2">
        {plan.sections.map((section, idx) => {
          const isExpanded = expandedSection === section.label
          const { done, total, pct } = sectionStats[idx]

          return (
            <div key={section.label} className="rounded-xl border border-slate-200 overflow-hidden">
              {/* Section header */}
              <button
                type="button"
                onClick={() => setExpandedSection(isExpanded ? null : section.label)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {section.label}
                    </span>
                    <span className="text-xs text-slate-400">{done}/{total}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#e5eeff] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2557E8] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-[#2557E8] w-8 text-right shrink-0">
                  {pct}%
                </span>
                {isExpanded
                  ? <ChevronUp   className="size-4 text-slate-400 shrink-0" />
                  : <ChevronDown className="size-4 text-slate-400 shrink-0" />
                }
              </button>

              {/* Lesson rows */}
              {isExpanded && (
                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  {section.lessons.map((lesson) => {
                    const isDone = completedIds.has(lesson.id)
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => toggleLesson(lesson.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/80 transition-colors text-left"
                      >
                        {isDone
                          ? <CheckCircle2 className="size-4 text-[#2557E8] shrink-0" />
                          : <Circle       className="size-4 text-slate-300 shrink-0" />
                        }
                        <LessonTypeIcon type={lesson.type} />
                        <span className={`flex-1 text-sm ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {lesson.title}
                        </span>
                        <span className="text-xs text-slate-400 shrink-0">{lesson.duration}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        {overallPct === 100 ? (
          <Button
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onClose}
          >
            🎉 All Done! Close
          </Button>
        ) : (
          <Button
            variant="primary"
            className="bg-[#2557E8] hover:bg-[#1d4ed8] text-white px-6"
            onClick={handleResume}
          >
            Resume Learning
          </Button>
        )}
      </div>
    </Modal>
  )
}
