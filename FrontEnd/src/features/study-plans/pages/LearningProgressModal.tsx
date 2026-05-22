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
  value: number // 0–100
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

// ─── Component ───────────────────────────────────────────

export function LearningProgressModal({ isOpen, onClose, plan }: Props) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  if (!plan) return null

  const allLessons     = plan.sections.flatMap((s) => s.lessons)
  const completedCount = allLessons.filter((l) => l.completed).length
  const totalCount     = allLessons.length
  const nextLesson     = allLessons.find((l) => !l.completed)

  // SVG circular progress
  const radius   = 34
  const circum   = 2 * Math.PI * radius
  const dashOffset = circum * (1 - plan.overallProgress / 100)

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
        {/* Circular progress */}
        <div className="relative flex items-center justify-center w-[80px] h-[80px] shrink-0">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={radius} fill="none" stroke="#e5eeff" strokeWidth="8" />
            <circle
              cx="40" cy="40" r={radius} fill="none"
              stroke="#2557E8" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circum}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700"
            />
          </svg>
          <span className="text-[16px] font-extrabold text-[#2557E8] z-10">
            {plan.overallProgress}%
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#e8eeff] flex items-center justify-center">
              <FlaskConical className="size-4 text-[#2557E8]" strokeWidth={1.75} />
            </div>
            <h3 className="font-bold text-slate-900 text-[15px] leading-snug">
              {plan.title}
            </h3>
            {plan.isAiGenerated && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#00897B] text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide">
                <Sparkles className="size-2.5" />AI
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
              <span className="flex items-center gap-1 text-[#2557E8] font-medium">
                <Clock3 className="size-3.5" />
                Next: {nextLesson.title}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="flex flex-col gap-2">
        {plan.sections.map((section) => {
          const isExpanded = expandedSection === section.label
          const done = section.lessons.filter((l) => l.completed).length

          return (
            <div key={section.label} className="rounded-xl border border-slate-200 overflow-hidden">
              {/* Section header */}
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.label)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {section.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {done}/{section.lessons.length}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#e5eeff] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2557E8] rounded-full transition-all duration-500"
                      style={{ width: `${section.value}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-[#2557E8] w-8 text-right shrink-0">
                  {section.value}%
                </span>
                {isExpanded
                  ? <ChevronUp className="size-4 text-slate-400 shrink-0" />
                  : <ChevronDown className="size-4 text-slate-400 shrink-0" />
                }
              </button>

              {/* Lessons list */}
              {isExpanded && (
                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  {section.lessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/60 transition-colors">
                      {lesson.completed
                        ? <CheckCircle2 className="size-4 text-[#2557E8] shrink-0" />
                        : <Circle className="size-4 text-slate-300 shrink-0" />
                      }
                      <LessonTypeIcon type={lesson.type} />
                      <span className={`flex-1 text-sm ${lesson.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {lesson.title}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">{lesson.duration}</span>
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
          {nextLesson ? 'Resume Learning' : '🎉 Review All'}
        </Button>
      </div>
    </Modal>
  )
}
