import { useState } from 'react'
import {
  BookOpen,
  Clock,
  TrendingUp,
  MoreVertical,
  Sparkles,
  ChevronRight,
  Plus,
  CalendarDays,
  Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CreateStudyPlanModal } from '@/features/documents/pages/CreateStudyPlanModal'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type FilterTab = 'All' | 'Active' | 'Completed' | 'Upcoming' | 'AI Generated'

type ProgressSegment = {
  label: string
  value: number   // 0-100
}

type Milestone = {
  month: string
  day: number
  title: string
  time: string
}

type StudyPlan = {
  id: string
  title: string
  description: string
  isAiGenerated: boolean
  status: 'Active' | 'Completed' | 'Upcoming'
  documents: number
  hoursEst: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  overallProgress: number
  segments: ProgressSegment[]
  milestone: Milestone
}

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────

const STUDY_PLANS: StudyPlan[] = [
  {
    id: '1',
    title: 'Quantum Mechanics Mastery',
    description:
      'A comprehensive journey from wave functions to quantum entanglement.',
    isAiGenerated: true,
    status: 'Active',
    documents: 12,
    hoursEst: 48,
    difficulty: 'Hard',
    overallProgress: 65,
    segments: [
      { label: 'Core Concepts', value: 100 },
      { label: 'Advanced Theory', value: 65 },
      { label: 'Mock Exam', value: 0 },
    ],
    milestone: {
      month: 'OCT',
      day: 24,
      title: "Schrödinger's Equation Quiz",
      time: '10:00 AM Tomorrow',
    },
  },
  {
    id: '2',
    title: 'Organic Chemistry Fundamentals',
    description:
      'Master reaction mechanisms, functional groups, and synthesis pathways.',
    isAiGenerated: false,
    status: 'Active',
    documents: 8,
    hoursEst: 32,
    difficulty: 'Medium',
    overallProgress: 40,
    segments: [
      { label: 'Basics', value: 100 },
      { label: 'Reactions', value: 40 },
      { label: 'Synthesis', value: 0 },
    ],
    milestone: {
      month: 'NOV',
      day: 3,
      title: 'Reaction Mechanisms Test',
      time: '2:00 PM, Next Week',
    },
  },
  {
    id: '3',
    title: 'Data Structures & Algorithms',
    description:
      'From arrays to graphs — crack competitive programming interviews.',
    isAiGenerated: true,
    status: 'Upcoming',
    documents: 15,
    hoursEst: 60,
    difficulty: 'Hard',
    overallProgress: 0,
    segments: [
      { label: 'Arrays & Strings', value: 0 },
      { label: 'Trees & Graphs', value: 0 },
      { label: 'Dynamic Prog.', value: 0 },
    ],
    milestone: {
      month: 'NOV',
      day: 10,
      title: 'Arrays & Sorting Quiz',
      time: '9:00 AM, Nov 10',
    },
  },
  {
    id: '4',
    title: 'World History: Modern Era',
    description:
      'Explore major events shaping the 20th and 21st centuries.',
    isAiGenerated: false,
    status: 'Completed',
    documents: 6,
    hoursEst: 20,
    difficulty: 'Easy',
    overallProgress: 100,
    segments: [
      { label: 'WWI & WWII', value: 100 },
      { label: 'Cold War', value: 100 },
      { label: 'Modern Era', value: 100 },
    ],
    milestone: {
      month: 'SEP',
      day: 15,
      title: 'Final Comprehensive Exam',
      time: 'Completed',
    },
  },
]

// ─────────────────────────────────────────────
// Difficulty badge helper
// ─────────────────────────────────────────────

function DifficultyBadge({ level }: { level: StudyPlan['difficulty'] }) {
  const map = {
    Easy: { icon: '↗', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    Medium: { icon: '↗', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    Hard: { icon: '↗', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  }
  const { icon, color } = map[level]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${color}`}>
      <span>{icon}</span> {level} Difficulty
    </span>
  )
}

// ─────────────────────────────────────────────
// Segment progress bar
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Single Study Plan Card
// ─────────────────────────────────────────────

function StudyPlanCard({ plan }: { plan: StudyPlan }) {
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

// ─────────────────────────────────────────────
// Filter Tab
// ─────────────────────────────────────────────

const TABS: FilterTab[] = ['All', 'Active', 'Completed', 'Upcoming', 'AI Generated']

function FilterTabs({
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
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${isActive
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

// ─────────────────────────────────────────────
// Stats Strip
// ─────────────────────────────────────────────

function StatsStrip({ plans }: { plans: StudyPlan[] }) {
  const active = plans.filter((p) => p.status === 'Active').length
  const completed = plans.filter((p) => p.status === 'Completed').length
  const aiCount = plans.filter((p) => p.isAiGenerated).length
  const avgProg = plans.length
    ? Math.round(plans.reduce((s, p) => s + p.overallProgress, 0) / plans.length)
    : 0

  const stats = [
    { label: 'Active Plans', value: active, icon: BookOpen, color: 'text-[#2557E8] bg-[#e5eeff]' },
    { label: 'Completed', value: completed, icon: ChevronRight, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'AI Generated', value: aiCount, icon: Sparkles, color: 'text-violet-700 bg-violet-50' },
    { label: 'Avg. Progress', value: `${avgProg}%`, icon: TrendingUp, color: 'text-amber-700 bg-amber-50' },
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

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e5eeff] bg-white py-16 px-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e5eeff]">
        <BookOpen className="size-8 text-[#2557E8]" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-foreground">No study plans found</h3>
      <p className="mt-2 text-sm text-muted max-w-xs">
        Create your first study plan to organize your learning journey and track your progress.
      </p>
      <Button
        onClick={onAdd}
        variant="primary"
        className="mt-6 bg-[#2557E8] hover:bg-[#1d4ed8] text-white"
      >
        <Plus className="size-4" /> Create Study Plan
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export function StudyPlansPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('All')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredPlans = STUDY_PLANS.filter((plan) => {
    if (activeTab === 'All') return true
    if (activeTab === 'AI Generated') return plan.isAiGenerated
    return plan.status === activeTab
  })

  return (
    <>
      {/* ── Page wrapper ─────────────────────────── */}
      <div className="flex flex-col gap-6 pb-10">

        {/* ── Header ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Study Plans</h1>
            <p className="text-muted mt-1 text-sm">
              Manage your personalized learning journeys and academic goals.
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            className="shrink-0 bg-[#2557E8] hover:bg-[#1d4ed8] text-white shadow-sm"
          >
            <Plus className="size-4" />
            Create Plan
          </Button>
        </div>

        {/* ── Stats strip ──────────────────────────── */}
        <StatsStrip plans={STUDY_PLANS} />

        {/* ── Filter tabs ──────────────────────────── */}
        <FilterTabs active={activeTab} onChange={setActiveTab} />

        {/* ── Plan cards ───────────────────────────── */}
        <div className="flex flex-col gap-4">
          {filteredPlans.length === 0 ? (
            <EmptyState onAdd={() => setIsModalOpen(true)} />
          ) : (
            filteredPlans.map((plan) => (
              <StudyPlanCard key={plan.id} plan={plan} />
            ))
          )}
        </div>
      </div>

      {/* ── Create Study Plan Modal ───────────────── */}
      <CreateStudyPlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
