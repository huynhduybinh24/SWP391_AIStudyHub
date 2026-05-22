import { useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  FileText,
  HelpCircle,
  Code2,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  Link2,
  Trophy,
  Lock,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

// ─── Types ───────────────────────────────────────────────

type LessonType = 'video' | 'reading' | 'quiz' | 'practice'
type LessonStatus = 'completed' | 'in-progress' | 'locked'

export type CurriculumLesson = {
  id: string
  title: string
  duration: string
  type: LessonType
  status: LessonStatus
}

export type CurriculumModule = {
  id: string
  title: string
  description: string
  lessons: CurriculumLesson[]
}

export type CurriculumPlan = {
  id: string
  title: string
  documents: number
  hoursEst: number
  difficulty: string
  modules: CurriculumModule[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  plan: CurriculumPlan | null
}

// ─── Helpers ─────────────────────────────────────────────

function LessonTypeIcon({ type }: { type: LessonType }) {
  const map: Record<LessonType, { icon: React.ComponentType<{ className?: string }>, color: string }> = {
    video: { icon: PlayCircle, color: 'text-[#2557E8]' },
    reading: { icon: FileText, color: 'text-slate-400' },
    quiz: { icon: HelpCircle, color: 'text-amber-500' },
    practice: { icon: Code2, color: 'text-emerald-500' },
  }
  const { icon: Icon, color } = map[type]
  return <Icon className={`size-4 shrink-0 ${color}`} />
}

function StatusIcon({ status }: { status: LessonStatus }) {
  if (status === 'completed') return <CheckCircle2 className="size-4 text-[#2557E8] shrink-0" />
  if (status === 'in-progress') return <PlayCircle className="size-4 text-amber-500 shrink-0" />
  return <Lock className="size-3.5 text-slate-300 shrink-0" />
}

// ─── Component ───────────────────────────────────────────

export function CurriculumModal({ isOpen, onClose, plan }: Props) {
  // ── All hooks before any conditional return ──────────────
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [highlightedModule, setHighlightedModule] = useState<string | null>(null)
  const activeModuleRef = useRef<HTMLDivElement | null>(null)
  const activeLesonRef = useRef<HTMLDivElement | null>(null)

  // Reset expanded module whenever a different plan is opened
  useEffect(() => {
    if (!plan) return
    // Auto-expand the first module that has in-progress or non-completed lessons
    const firstActive = plan.modules.find((m) =>
      m.lessons.some((l) => l.status !== 'completed')
    )
    setExpandedModule(firstActive?.id ?? plan.modules[0]?.id ?? null)
  }, [plan?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Early return after all hooks ─────────────────────────
  if (!plan) return null

  // ── Derived values ────────────────────────────────────────
  const allLessons = plan.modules.flatMap((m) => m.lessons)
  const completedCount = allLessons.filter((l) => l.status === 'completed').length
  const totalCount = allLessons.length

  const firstActiveModule = plan.modules.find((m) =>
    m.lessons.some((l) => l.status !== 'completed')
  )

  const firstActiveLessonId = firstActiveModule?.lessons.find(l => l.status !== 'completed')?.id

  // ── Handlers ─────────────────────────────────────────────

  // "Start Module" / "Review" button: expand + highlight + scroll to first active lesson
  const handleStart = () => {
    if (!firstActiveModule) return

    // 1. Expand the module
    setExpandedModule(firstActiveModule.id)

    // 2. Flash-highlight the module border
    setHighlightedModule(firstActiveModule.id)
    setTimeout(() => setHighlightedModule(null), 1500)

    // 3. Scroll to the first in-progress/not-completed lesson inside the module
    setTimeout(() => {
      if (activeLesonRef.current) {
        activeLesonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        activeModuleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 120)
  }

  // ─────────────────────────────────────────────────────────

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Curriculum"
      description={plan.title}
      className="max-w-2xl"
    >
      {/* ── Overview stats ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: BookOpen, label: 'Modules', value: String(plan.modules.length), color: 'text-[#2557E8] bg-[#e5eeff]' },
          { icon: Link2, label: 'Lessons', value: `${completedCount}/${totalCount}`, color: 'text-emerald-700 bg-emerald-50' },
          { icon: Clock, label: 'Est. Time', value: `${plan.hoursEst}h`, color: 'text-amber-700 bg-amber-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="size-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-bold text-slate-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Module accordion ── */}
      <div className="flex flex-col gap-2">
        {plan.modules.map((mod, idx) => {
          const isExpanded = expandedModule === mod.id
          const done = mod.lessons.filter((l) => l.status === 'completed').length
          const pct = mod.lessons.length
            ? Math.round((done / mod.lessons.length) * 100)
            : 0
          const isFullyDone = pct === 100

          return (
            <div
              key={mod.id}
              ref={mod.id === firstActiveModule?.id ? activeModuleRef : null}
              className={`rounded-xl border overflow-hidden transition-all duration-300 ${highlightedModule === mod.id
                ? 'border-[#2557E8] ring-2 ring-[#2557E8]/30 shadow-md'
                : 'border-slate-200'
                }`}>
              {/* Module header */}
              <button
                type="button"
                onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                {/* Index / trophy badge */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${isFullyDone
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-[#e5eeff] text-[#2557E8]'
                  }`}>
                  {isFullyDone ? <Trophy className="size-3.5" /> : idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-800">{mod.title}</span>
                    <span className="text-xs text-slate-400 shrink-0">{done}/{mod.lessons.length}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                  {/* Module progress bar */}
                  <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isFullyDone ? 'bg-emerald-500' : 'bg-[#2557E8]'
                        }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {isExpanded
                  ? <ChevronUp className="size-4 text-slate-400 shrink-0 mt-1" />
                  : <ChevronDown className="size-4 text-slate-400 shrink-0 mt-1" />
                }
              </button>

              {/* Lesson rows */}
              {isExpanded && (
                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  {mod.lessons.map((lesson) => {
                    const isLocked = lesson.status === 'locked'
                    // Attach ref to first non-completed lesson in the active module
                    const attachRef = lesson.id === firstActiveLessonId
                    return (
                      <div
                        key={lesson.id}
                        ref={attachRef ? activeLesonRef : undefined}
                        className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${isLocked
                          ? 'opacity-40 cursor-not-allowed bg-slate-50/50'
                          : 'hover:bg-slate-50/70 cursor-default'
                          }`}
                      >
                        <StatusIcon status={lesson.status} />
                        <LessonTypeIcon type={lesson.type} />
                        <span className={`flex-1 text-sm ${lesson.status === 'completed'
                          ? 'text-slate-400 line-through'
                          : 'text-slate-700'
                          }`}>
                          {lesson.title}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Clock className="size-3 text-slate-400" />
                          <span className="text-xs text-slate-400">{lesson.duration}</span>
                        </div>
                      </div>
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
        {completedCount === totalCount ? (
          <Button
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onClose}
          >
            🎉 Curriculum Complete!
          </Button>
        ) : (
          <Button
            variant="primary"
            className="bg-[#2557E8] hover:bg-[#1d4ed8] text-white"
            onClick={handleStart}
          >
            {firstActiveModule ? `Start: ${firstActiveModule.title}` : 'Review All'}
          </Button>
        )}
      </div>
    </Modal>
  )
}
