import { useState } from 'react'
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
    video:    { icon: PlayCircle, color: 'text-blue-500' },
    reading:  { icon: FileText,   color: 'text-slate-400' },
    quiz:     { icon: HelpCircle, color: 'text-amber-500' },
    practice: { icon: Code2,      color: 'text-emerald-500' },
  }
  const { icon: Icon, color } = map[type]
  return <Icon className={`size-4 shrink-0 ${color}`} />
}

function StatusIcon({ status }: { status: LessonStatus }) {
  if (status === 'completed')  return <CheckCircle2 className="size-4 text-[#2557E8] shrink-0" />
  if (status === 'in-progress') return <PlayCircle  className="size-4 text-amber-500 shrink-0" />
  return <Circle className="size-4 text-slate-300 shrink-0" />
}

// ─── Component ───────────────────────────────────────────

export function CurriculumModal({ isOpen, onClose, plan }: Props) {
  const [expandedModule, setExpandedModule] = useState<string | null>(
    plan?.modules[0]?.id ?? null
  )

  if (!plan) return null

  const allLessons      = plan.modules.flatMap((m) => m.lessons)
  const completedCount  = allLessons.filter((l) => l.status === 'completed').length
  const totalCount      = allLessons.length

  // Find first non-completed module
  const firstActiveModule = plan.modules.find((m) =>
    m.lessons.some((l) => l.status !== 'completed')
  )

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
          { icon: BookOpen, label: 'Modules',   value: String(plan.modules.length), color: 'text-[#2557E8] bg-[#e5eeff]' },
          { icon: Link2,    label: 'Lessons',   value: `${completedCount}/${totalCount}`, color: 'text-emerald-700 bg-emerald-50' },
          { icon: Clock,    label: 'Est. Time', value: `${plan.hoursEst}h`, color: 'text-amber-700 bg-amber-50' },
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

      {/* ── Module list ── */}
      <div className="flex flex-col gap-2">
        {plan.modules.map((mod, idx) => {
          const isExpanded = expandedModule === mod.id
          const done = mod.lessons.filter((l) => l.status === 'completed').length
          const pct  = mod.lessons.length
            ? Math.round((done / mod.lessons.length) * 100)
            : 0

          return (
            <div key={mod.id} className="rounded-xl border border-slate-200 overflow-hidden">
              {/* Module header */}
              <button
                onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-full bg-[#e5eeff] text-[#2557E8] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {pct === 100 ? <Trophy className="size-3.5" /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-800">{mod.title}</span>
                    <span className="text-xs text-slate-400 shrink-0">{done}/{mod.lessons.length}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                  <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2557E8] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                {isExpanded
                  ? <ChevronUp   className="size-4 text-slate-400 shrink-0 mt-1" />
                  : <ChevronDown className="size-4 text-slate-400 shrink-0 mt-1" />
                }
              </button>

              {/* Lesson rows */}
              {isExpanded && (
                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  {mod.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/60 transition-colors ${
                        lesson.status === 'locked' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <StatusIcon status={lesson.status} />
                      <LessonTypeIcon type={lesson.type} />
                      <span className={`flex-1 text-sm ${
                        lesson.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'
                      }`}>
                        {lesson.title}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Clock className="size-3 text-slate-400" />
                        <span className="text-xs text-slate-400">{lesson.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <Button
          variant="primary"
          className="bg-[#2557E8] hover:bg-[#1d4ed8] text-white"
        >
          {firstActiveModule ? `Start ${firstActiveModule.title}` : 'Review Curriculum'}
        </Button>
      </div>
    </Modal>
  )
}
