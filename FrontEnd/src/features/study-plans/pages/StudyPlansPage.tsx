import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Clock,
  MoreVertical,
  Sparkles,
  Plus,
  FlaskConical,
  Link2,
  TrendingUp,
  Clock3,
  Copy,
  Archive,
  Trash2,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  Rocket,
  Calendar,
  Bot,
  Cpu,
  Languages,
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CreateStudyPlanModal } from '@/features/study-plans/pages/CreateStudyPlanModal'
import { LearningProgressModal, type LearningProgressPlan } from '@/features/study-plans/pages/LearningProgressModal'
import { CurriculumModal, type CurriculumPlan } from '@/features/study-plans/pages/CurriculumModal'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type FilterTab = 'All' | 'Active' | 'Completed' | 'Upcoming' | 'AI Generated'

type ProgressSegment = {
  label: string
  value: number // 0-100
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
  milestone?: Milestone
  themeColor: 'blue' | 'purple' | 'teal'
  completedAt?: string
  startsAt?: string
  tasks?: number
  iconType?: 'flask' | 'rocket' | 'bot' | 'cpu' | 'languages'
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
    themeColor: 'blue',
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
    title: 'Organic Chemistry Deep Dive',
    description:
      'Exploring carbon compounds and metabolic pathways.',
    isAiGenerated: true,
    status: 'Active',
    documents: 8,
    hoursEst: 30,
    difficulty: 'Medium',
    overallProgress: 20,
    themeColor: 'purple',
    segments: [
      { label: 'Nomenclature', value: 100 },
      { label: 'Substitution', value: 20 },
      { label: 'Elimination', value: 0 },
    ],
    milestone: {
      month: 'OCT',
      day: 26,
      title: 'Alkanes & Cycloalkanes',
      time: '2:00 PM Wednesday',
    },
  },
  {
    id: '3',
    title: 'Final Exam Prep: Advanced Robotics',
    description: 'Advanced kinematics and autonomous navigation systems.',
    isAiGenerated: false,
    status: 'Upcoming',
    documents: 12,
    hoursEst: 0,
    difficulty: 'Hard',
    overallProgress: 0,
    themeColor: 'blue',
    segments: [],
    startsAt: 'Nov 15, 2024',
    tasks: 24,
    iconType: 'bot',
  },
  {
    id: '6',
    title: 'Winter Session: Deep Learning Fundamentals',
    description: 'Foundations of neural networks and gradient descent optimization.',
    isAiGenerated: false,
    status: 'Upcoming',
    documents: 8,
    hoursEst: 0,
    difficulty: 'Hard',
    overallProgress: 0,
    themeColor: 'blue',
    segments: [],
    startsAt: 'Dec 10, 2024',
    tasks: 45,
    iconType: 'cpu',
  },
  {
    id: '7',
    title: 'GRE Vocabulary & Logic Track',
    description: 'Intensive verbal reasoning and analytical writing preparation.',
    isAiGenerated: false,
    status: 'Upcoming',
    documents: 30,
    hoursEst: 0,
    difficulty: 'Hard',
    overallProgress: 0,
    themeColor: 'blue',
    segments: [],
    startsAt: 'Jan 05, 2025',
    tasks: 90,
    iconType: 'languages',
  },
  {
    id: '8',
    title: 'Advanced Robotics',
    description: 'Kinematics, control systems, and machine learning integration.',
    isAiGenerated: true,
    status: 'Active',
    documents: 15,
    hoursEst: 55,
    difficulty: 'Hard',
    overallProgress: 0,
    themeColor: 'blue',
    segments: [],
  },
  {
    id: '4',
    title: 'Advanced Organic Chemistry',
    description: 'Mastery of advanced reaction mechanisms and synthesis.',
    isAiGenerated: false,
    status: 'Completed',
    documents: 15,
    hoursEst: 0,
    difficulty: 'Hard',
    overallProgress: 100,
    themeColor: 'teal',
    segments: [],
    completedAt: 'Oct 15, 2024',
    iconType: 'flask',
  },
  {
    id: '5',
    title: 'Introduction to Astrophysics',
    description: 'Foundational principles of stellar evolution and cosmology.',
    isAiGenerated: false,
    status: 'Completed',
    documents: 10,
    hoursEst: 0,
    difficulty: 'Medium',
    overallProgress: 100,
    themeColor: 'teal',
    segments: [],
    completedAt: 'Sep 28, 2024',
    iconType: 'rocket',
  },
]

// ─────────────────────────────────────────────
// Mock: Learning Progress data (keyed by plan id)
// ─────────────────────────────────────────────

const LEARNING_DATA: Record<string, LearningProgressPlan> = {
  '1': {
    id: '1', title: 'Quantum Mechanics Mastery',
    description: 'A comprehensive journey from wave functions to quantum entanglement.',
    isAiGenerated: true, overallProgress: 65,
    sections: [
      { label: 'Core Concepts', value: 100, lessons: [
        { id: 'l1', title: 'Introduction to Quantum Theory',   duration: '20 min', type: 'video',   completed: true },
        { id: 'l2', title: 'Wave-Particle Duality',            duration: '25 min', type: 'reading', completed: true },
        { id: 'l3', title: 'Quantum States & Superposition',   duration: '30 min', type: 'quiz',    completed: true },
      ]},
      { label: 'Advanced Theory', value: 65, lessons: [
        { id: 'l4', title: "Schrödinger's Equation",           duration: '40 min', type: 'video',    completed: true },
        { id: 'l5', title: 'Quantum Entanglement',             duration: '35 min', type: 'reading',  completed: false },
        { id: 'l6', title: 'Heisenberg Uncertainty Principle', duration: '30 min', type: 'practice', completed: false },
      ]},
      { label: 'Mock Exam', value: 0, lessons: [
        { id: 'l7', title: 'Practice Quiz 1',    duration: '45 min', type: 'quiz', completed: false },
        { id: 'l8', title: 'Final Mock Exam',    duration: '90 min', type: 'quiz', completed: false },
      ]},
    ],
  },
  '2': {
    id: '2', title: 'Organic Chemistry Fundamentals',
    description: 'Master reaction mechanisms, functional groups, and synthesis pathways.',
    isAiGenerated: false, overallProgress: 40,
    sections: [
      { label: 'Basics', value: 100, lessons: [
        { id: 'l1', title: 'Functional Groups Overview',  duration: '20 min', type: 'video',   completed: true },
        { id: 'l2', title: 'Nomenclature Rules',          duration: '15 min', type: 'reading', completed: true },
      ]},
      { label: 'Reactions', value: 40, lessons: [
        { id: 'l3', title: 'Addition Reactions',          duration: '30 min', type: 'video',    completed: true },
        { id: 'l4', title: 'Substitution Mechanisms',     duration: '35 min', type: 'practice', completed: false },
      ]},
      { label: 'Synthesis', value: 0, lessons: [
        { id: 'l5', title: 'Multi-step Synthesis',        duration: '50 min', type: 'practice', completed: false },
        { id: 'l6', title: 'Synthesis Quiz',              duration: '40 min', type: 'quiz',     completed: false },
      ]},
    ],
  },
  '3': {
    id: '3', title: 'Final Exam Prep: Advanced Robotics',
    description: 'Advanced kinematics and autonomous navigation systems.',
    isAiGenerated: false, overallProgress: 0,
    sections: [
      { label: 'Kinematics', value: 0, lessons: [
        { id: 'l1', title: 'Forward Kinematics', duration: '20 min', type: 'video', completed: false },
        { id: 'l2', title: 'Inverse Kinematics', duration: '25 min', type: 'practice', completed: false },
      ]},
      { label: 'Navigation', value: 0, lessons: [
        { id: 'l3', title: 'Path Planning', duration: '30 min', type: 'video', completed: false },
        { id: 'l4', title: 'Obstacle Avoidance', duration: '40 min', type: 'practice', completed: false },
      ]},
    ],
  },
  '6': {
    id: '6', title: 'Winter Session: Deep Learning Fundamentals',
    description: 'Foundations of neural networks and gradient descent optimization.',
    isAiGenerated: false, overallProgress: 0,
    sections: [
      { label: 'Neural Networks Basics', value: 0, lessons: [
        { id: 'l1', title: 'Introduction to NNs', duration: '20 min', type: 'video', completed: false },
      ]}
    ]
  },
  '7': {
    id: '7', title: 'GRE Vocabulary & Logic Track',
    description: 'Intensive verbal reasoning and analytical writing preparation.',
    isAiGenerated: false, overallProgress: 0,
    sections: [
      { label: 'Verbal Reasoning', value: 0, lessons: [
        { id: 'l1', title: 'Vocabulary Basics', duration: '20 min', type: 'reading', completed: false },
      ]}
    ]
  },
  '8': {
    id: '8', title: 'Advanced Robotics',
    description: 'Kinematics, control systems, and machine learning integration.',
    isAiGenerated: true, overallProgress: 0,
    sections: [
      { label: 'Kinematics', value: 0, lessons: [
        { id: 'l1', title: 'Forward Kinematics', duration: '20 min', type: 'video', completed: false },
        { id: 'l2', title: 'Inverse Kinematics', duration: '25 min', type: 'practice', completed: false },
      ]},
      { label: 'Control Systems', value: 0, lessons: [
        { id: 'l3', title: 'PID Controllers', duration: '30 min', type: 'video', completed: false },
      ]}
    ]
  },
  '4': {
    id: '4', title: 'World History: Modern Era',
    description: 'Explore major events shaping the 20th and 21st centuries.',
    isAiGenerated: false, overallProgress: 100,
    sections: [
      { label: 'WWI & WWII', value: 100, lessons: [
        { id: 'l1', title: 'Causes of WWI',               duration: '20 min', type: 'video',   completed: true },
        { id: 'l2', title: 'WWII Major Battles',          duration: '25 min', type: 'reading', completed: true },
      ]},
      { label: 'Cold War', value: 100, lessons: [
        { id: 'l3', title: 'Cold War Origins',            duration: '20 min', type: 'video',   completed: true },
        { id: 'l4', title: 'Cuban Missile Crisis',        duration: '15 min', type: 'reading', completed: true },
      ]},
      { label: 'Modern Era', value: 100, lessons: [
        { id: 'l5', title: 'Post-Cold War World',         duration: '25 min', type: 'video',   completed: true },
        { id: 'l6', title: 'Comprehensive Exam',          duration: '60 min', type: 'quiz',    completed: true },
      ]},
    ],
  },
  '5': {
    id: '5', title: 'Introduction to Astrophysics',
    description: 'Foundational principles of stellar evolution and cosmology.',
    isAiGenerated: false, overallProgress: 100,
    sections: [
      { label: 'Stellar Evolution', value: 100, lessons: [
        { id: 'l1', title: 'Star Formation', duration: '30 min', type: 'video', completed: true },
        { id: 'l2', title: 'Main Sequence Stars', duration: '20 min', type: 'reading', completed: true },
      ]},
      { label: 'Cosmology', value: 100, lessons: [
        { id: 'l3', title: 'The Big Bang Theory', duration: '25 min', type: 'video', completed: true },
        { id: 'l4', title: 'Dark Matter & Energy', duration: '35 min', type: 'reading', completed: true },
      ]}
    ]
  },
}

// ─────────────────────────────────────────────

// Mock: Curriculum data (keyed by plan id)
// ─────────────────────────────────────────────

const CURRICULUM_DATA: Record<string, CurriculumPlan> = {
  '1': {
    id: '1', title: 'Quantum Mechanics Mastery', documents: 12, hoursEst: 48, difficulty: 'Hard',
    modules: [
      { id: 'm1', title: 'Core Concepts', description: 'Foundations of quantum theory',
        lessons: [
          { id: 'c1', title: 'Introduction to Quantum Theory',   duration: '20 min', type: 'video',    status: 'completed' },
          { id: 'c2', title: 'Wave-Particle Duality',            duration: '25 min', type: 'reading',  status: 'completed' },
          { id: 'c3', title: 'Quantum States Quiz',              duration: '30 min', type: 'quiz',     status: 'completed' },
        ]},
      { id: 'm2', title: 'Advanced Theory', description: 'Deep dive into quantum equations',
        lessons: [
          { id: 'c4', title: "Schrödinger's Equation",           duration: '40 min', type: 'video',    status: 'completed' },
          { id: 'c5', title: 'Quantum Entanglement',             duration: '35 min', type: 'reading',  status: 'in-progress' },
          { id: 'c6', title: 'Uncertainty Principle Practice',   duration: '30 min', type: 'practice', status: 'locked' },
        ]},
      { id: 'm3', title: 'Mock Exam Prep', description: 'Exam simulations and review',
        lessons: [
          { id: 'c7', title: 'Practice Quiz 1',                  duration: '45 min', type: 'quiz',     status: 'locked' },
          { id: 'c8', title: 'Full Mock Examination',            duration: '90 min', type: 'quiz',     status: 'locked' },
        ]},
    ],
  },
  '2': {
    id: '2', title: 'Organic Chemistry Fundamentals', documents: 8, hoursEst: 32, difficulty: 'Medium',
    modules: [
      { id: 'm1', title: 'Basics', description: 'Core organic chemistry concepts',
        lessons: [
          { id: 'c1', title: 'Functional Groups Overview', duration: '20 min', type: 'video',   status: 'completed' },
          { id: 'c2', title: 'Nomenclature Rules',         duration: '15 min', type: 'reading', status: 'completed' },
        ]},
      { id: 'm2', title: 'Reactions', description: 'Reaction types and mechanisms',
        lessons: [
          { id: 'c3', title: 'Addition Reactions',          duration: '30 min', type: 'video',    status: 'completed' },
          { id: 'c4', title: 'Substitution Mechanisms',     duration: '35 min', type: 'practice', status: 'in-progress' },
        ]},
      { id: 'm3', title: 'Synthesis', description: 'Advanced synthesis pathways',
        lessons: [
          { id: 'c5', title: 'Multi-step Synthesis',        duration: '50 min', type: 'practice', status: 'locked' },
          { id: 'c6', title: 'Synthesis Quiz',              duration: '40 min', type: 'quiz',     status: 'locked' },
        ]},
    ],
  },
  '3': {
    id: '3', title: 'Data Structures & Algorithms', documents: 15, hoursEst: 60, difficulty: 'Hard',
    modules: [
      { id: 'm1', title: 'Arrays & Strings', description: 'Linear data structures',
        lessons: [
          { id: 'c1', title: 'Array Fundamentals',        duration: '20 min', type: 'video',    status: 'locked' },
          { id: 'c2', title: 'Two Pointer Technique',     duration: '25 min', type: 'practice', status: 'locked' },
        ]},
      { id: 'm2', title: 'Trees & Graphs', description: 'Non-linear data structures',
        lessons: [
          { id: 'c3', title: 'Binary Trees',              duration: '30 min', type: 'video',    status: 'locked' },
          { id: 'c4', title: 'BFS & DFS Traversal',       duration: '40 min', type: 'practice', status: 'locked' },
        ]},
      { id: 'm3', title: 'Dynamic Programming', description: 'Optimization techniques',
        lessons: [
          { id: 'c5', title: 'DP Fundamentals',           duration: '45 min', type: 'video',    status: 'locked' },
          { id: 'c6', title: 'Classic DP Problems',       duration: '60 min', type: 'quiz',     status: 'locked' },
        ]},
    ],
  },
  '4': {
    id: '4', title: 'World History: Modern Era', documents: 6, hoursEst: 20, difficulty: 'Easy',
    modules: [
      { id: 'm1', title: 'WWI & WWII', description: 'World wars and their impact',
        lessons: [
          { id: 'c1', title: 'Causes of WWI',        duration: '20 min', type: 'video',   status: 'completed' },
          { id: 'c2', title: 'WWII Major Battles',   duration: '25 min', type: 'reading', status: 'completed' },
        ]},
      { id: 'm2', title: 'Cold War', description: 'East vs West geopolitics',
        lessons: [
          { id: 'c3', title: 'Cold War Origins',     duration: '20 min', type: 'video',   status: 'completed' },
          { id: 'c4', title: 'Cuban Missile Crisis', duration: '15 min', type: 'reading', status: 'completed' },
        ]},
      { id: 'm3', title: 'Modern Era', description: 'Post-Cold War world events',
        lessons: [
          { id: 'c5', title: 'Post-Cold War World',  duration: '25 min', type: 'video',   status: 'completed' },
          { id: 'c6', title: 'Comprehensive Exam',   duration: '60 min', type: 'quiz',    status: 'completed' },
        ]},
    ],
  },
  '5': {
    id: '5', title: 'Introduction to Astrophysics', documents: 10, hoursEst: 40, difficulty: 'Medium',
    modules: [
      { id: 'm1', title: 'Stellar Evolution', description: 'Life cycle of stars',
        lessons: [
          { id: 'c1', title: 'Star Formation',        duration: '30 min', type: 'video',   status: 'completed' },
          { id: 'c2', title: 'Main Sequence Stars',   duration: '20 min', type: 'reading', status: 'completed' },
        ]},
      { id: 'm2', title: 'Cosmology', description: 'The universe at large',
        lessons: [
          { id: 'c3', title: 'The Big Bang Theory',     duration: '25 min', type: 'video',   status: 'completed' },
          { id: 'c4', title: 'Dark Matter & Energy', duration: '35 min', type: 'reading', status: 'completed' },
        ]},
    ],
  },
  '8': {
    id: '8', title: 'Advanced Robotics', documents: 15, hoursEst: 55, difficulty: 'Hard',
    modules: [
      { id: 'm1', title: 'Kinematics', description: 'Robot motion and control',
        lessons: [
          { id: 'c1', title: 'Forward Kinematics',        duration: '20 min', type: 'video',    status: 'locked' },
          { id: 'c2', title: 'Inverse Kinematics',        duration: '25 min', type: 'practice', status: 'locked' },
        ]},
      { id: 'm2', title: 'Control Systems', description: 'Feedback and automation',
        lessons: [
          { id: 'c3', title: 'PID Controllers',           duration: '30 min', type: 'video',    status: 'locked' },
        ]},
    ],
  },
  '6': {
    id: '6', title: 'Winter Session: Deep Learning Fundamentals', documents: 8, hoursEst: 45, difficulty: 'Hard',
    modules: [
      { id: 'm1', title: 'Neural Networks Basics', description: 'Foundations of neural networks',
        lessons: [
          { id: 'c1', title: 'Introduction to NNs',        duration: '20 min', type: 'video',    status: 'locked' },
        ]},
    ],
  },
  '7': {
    id: '7', title: 'GRE Vocabulary & Logic Track', documents: 30, hoursEst: 90, difficulty: 'Hard',
    modules: [
      { id: 'm1', title: 'Verbal Reasoning', description: 'Intensive verbal prep',
        lessons: [
          { id: 'c1', title: 'Vocabulary Basics',          duration: '20 min', type: 'reading',  status: 'locked' },
        ]},
    ],
  },
}

// ─────────────────────────────────────────────
// Difficulty pill helper
// ─────────────────────────────────────────────

function DifficultyPill({ level }: { level: StudyPlan['difficulty'] }) {
  const map: Record<StudyPlan['difficulty'], { color: string }> = {
    Easy: { color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    Medium: { color: 'text-amber-700 bg-amber-50 border-amber-200' },
    Hard: { color: 'text-rose-700 bg-rose-50 border-rose-200' },
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${map[level].color}`}
    >
      <TrendingUp className="size-3" />
      {level} Difficulty
    </span>
  )
}

// ─────────────────────────────────────────────
// Segmented progress bar
// ─────────────────────────────────────────────

function SegmentedProgress({ segments, themeColor }: { segments: ProgressSegment[], themeColor: string }) {
  const isPurple = themeColor === 'purple'
  const isTeal = themeColor === 'teal'
  const fillClass = isTeal ? 'bg-teal-700' : isPurple ? 'bg-indigo-600' : 'bg-[#2557E8]'
  const bgClass = isTeal ? 'bg-teal-50' : isPurple ? 'bg-indigo-100' : 'bg-[#e5eeff]'

  return (
    <div className="flex flex-col gap-1.5 mt-2">
      {/* Track */}
      <div className="flex gap-1 h-[6px] w-full">
        {segments.length > 0 ? (
          segments.map((seg, i) => (
            <div key={i} className={`flex-1 rounded-full overflow-hidden ${bgClass}`}>
              <div
                className={`h-full rounded-full transition-all duration-700 ${fillClass}`}
                style={{ width: `${seg.value}%` }}
              />
            </div>
          ))
        ) : (
          <div className={`flex-1 rounded-full overflow-hidden ${bgClass}`}>
            <div
              className={`h-full rounded-full transition-all duration-700 ${fillClass}`}
              style={{ width: '100%' }}
            />
          </div>
        )}
      </div>
      {/* Labels */}
      {segments.length > 0 && (
        <div className="flex">
          {segments.map((seg, i) => (
            <span
              key={i}
              className="flex-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate"
            >
              {seg.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Study Plan Card
// ─────────────────────────────────────────────

interface CardCallbacks {
  onContinue: () => void
  onCurriculum: () => void
  onEdit: () => void
  onDuplicate: () => void
  onArchive: () => void
  onDelete: () => void
}

function StudyPlanCard({ plan, isAiTab, onContinue, onCurriculum, onEdit, onDuplicate, onArchive, onDelete }: { plan: StudyPlan, isAiTab?: boolean } & CardCallbacks) {
  const [menuOpen, setMenuOpen] = useState(false)

  const menuItems = [
    { label: 'Edit Plan',  icon: Pencil,  action: onEdit,      danger: false },
    { label: 'Duplicate',  icon: Copy,    action: onDuplicate,  danger: false },
    { label: 'Archive',    icon: Archive,  action: onArchive,   danger: false },
    { label: 'Delete',     icon: Trash2,  action: onDelete,     danger: true  },
  ]

  const isPurple = plan.themeColor === 'purple'
  const isTeal = plan.themeColor === 'teal'
  
  const isCompleted = plan.status === 'Completed'
  const isUpcoming = plan.status === 'Upcoming'

  const accentClass = isAiTab ? 'bg-[#2557E8]' : isCompleted ? 'bg-[#00897B]' : isTeal ? 'bg-teal-700' : isPurple ? 'bg-indigo-600' : 'bg-[#2557E8]'
  const iconBgClass = isAiTab ? 'bg-[#e5eeff]' : isCompleted ? 'bg-[#e6f4f1]' : isTeal ? 'bg-teal-50' : isPurple ? 'bg-indigo-50' : 'bg-[#e8eeff]'
  const iconTextClass = isAiTab ? 'text-[#2557E8]' : isCompleted ? 'text-[#00897B]' : isTeal ? 'text-teal-700' : isPurple ? 'text-indigo-600' : 'text-[#2557E8]'
  const buttonClass = isPurple 
    ? 'bg-indigo-600 hover:bg-indigo-700' 
    : 'bg-[#0055d4] hover:bg-[#004bbd]'

  const IconComponent = isAiTab ? Sparkles : plan.iconType === 'rocket' ? Rocket 
    : plan.iconType === 'bot' ? Bot 
    : plan.iconType === 'cpu' ? Cpu 
    : plan.iconType === 'languages' ? Languages 
    : FlaskConical

  return (
    <Card className="flex overflow-hidden border border-[#e5eeff] shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl">
      {/* Left accent bar */}
      <div className={`w-1.5 shrink-0 rounded-l-xl ${accentClass}`} />

      {/* Inner layout: left body + right panel */}
      <div className="flex flex-1 min-w-0 flex-col sm:flex-row">
        {/* ── LEFT BODY ── */}
        <div className="flex flex-1 min-w-0 p-5 gap-4">
          {/* Icon */}
          <div className="shrink-0 pt-0.5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgClass}`}>
              <IconComponent className={`size-5 ${iconTextClass}`} strokeWidth={1.75} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <h3 className="font-bold text-slate-900 text-[15px] leading-snug">
                  {plan.title}
                </h3>
                {isCompleted ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ccfbf1] text-[#00897B] text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wide shrink-0">
                    <CheckCircle2 className="size-3" strokeWidth={2.5} />
                    COMPLETED
                  </span>
                ) : isUpcoming ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e5eeff] text-[#2557E8] text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wide shrink-0">
                    Upcoming
                  </span>
                ) : isAiTab ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#2557E8] text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider shrink-0">
                      AI Generated
                    </span>
                    {plan.difficulty === 'Hard' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-600 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider shrink-0">
                        Hard
                      </span>
                    )}
                    {plan.difficulty === 'Medium' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-600 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider shrink-0">
                        Medium
                      </span>
                    )}
                    {plan.difficulty === 'Easy' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-600 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider shrink-0">
                        Easy
                      </span>
                    )}
                  </div>
                ) : plan.isAiGenerated ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#00897B] text-white text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wide shrink-0">
                    <Sparkles className="size-3" strokeWidth={2} />
                    AI Generated
                  </span>
                ) : null}
              </div>
              {/* More menu */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  aria-label="More options"
                >
                  <MoreVertical className="size-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-8 z-20 min-w-[160px] rounded-xl border border-slate-200 bg-white shadow-lg py-1">
                    {menuItems.map(({ label, icon: Icon, action, danger }) => (
                      <button
                        key={label}
                        className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-slate-50 ${
                          danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-700'
                        }`}
                        onClick={() => { setMenuOpen(false); action() }}
                      >
                        <Icon className="size-3.5" />{label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-500 text-sm mt-1 leading-relaxed line-clamp-2">
              {plan.description}
            </p>

            {/* Info pills */}
            <div className="flex flex-wrap gap-2 mt-3">
              {isCompleted && plan.completedAt && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  <Calendar className="size-3.5 text-slate-400" />
                  Completed {plan.completedAt}
                </span>
              )}
              {isUpcoming && plan.startsAt && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  <Calendar className="size-3.5 text-slate-400" />
                  Starts {plan.startsAt}
                </span>
              )}
              {isUpcoming && plan.tasks && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  <ClipboardList className="size-3.5 text-slate-400" />
                  {plan.tasks} Tasks
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                <Link2 className="size-3.5 text-slate-400" />
                {plan.documents} Documents
              </span>
              {!isCompleted && !isUpcoming && (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                    <Clock className="size-3.5 text-slate-400" />
                    {plan.hoursEst} Hours Est.
                  </span>
                  {!isAiTab && <DifficultyPill level={plan.difficulty} />}
                </>
              )}
            </div>

            {/* Progress */}
            {!isUpcoming && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {isCompleted ? 'Final Grade' : isAiTab ? 'Progress' : 'Overall Progress'}
                  </span>
                  <span className={`text-xs font-bold ${iconTextClass}`}>
                    {plan.overallProgress}%
                  </span>
                </div>
                {isAiTab || isCompleted ? (
                  <div className={`h-[6px] w-full rounded-full overflow-hidden ${isCompleted ? 'bg-[#ccfbf1]' : 'bg-[#e5eeff]'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-[#00897B]' : 'bg-[#2557E8]'}`}
                      style={{ width: `${plan.overallProgress}%` }}
                    />
                  </div>
                ) : (
                  <SegmentedProgress segments={plan.segments} themeColor={plan.themeColor} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className={`shrink-0 sm:w-[220px] border-t sm:border-t-0 sm:border-l border-[#e5eeff] flex flex-col p-5 gap-4 bg-[#fafbff] ${(isCompleted || isUpcoming || isAiTab) ? 'justify-center' : 'justify-between'}`}>
          {/* Milestone */}
          {!isCompleted && !isUpcoming && !isAiTab && plan.milestone && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Next Milestone
              </p>
              <div className="flex items-start gap-3">
                {/* Date block */}
                <div className="flex flex-col items-center justify-center w-11 shrink-0 pt-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest leading-none text-red-500 mb-0.5">
                    {plan.milestone.month}
                  </span>
                  <span className="text-2xl font-black leading-none text-slate-900">
                    {plan.milestone.day}
                  </span>
                </div>
                {/* Text */}
                <div>
                  <p className="font-semibold text-slate-800 text-[13px] leading-snug">
                    {plan.milestone.title}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock3 className="size-3 text-slate-400" />
                    <span className="text-[11px] text-slate-400">
                      {plan.milestone.time}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onContinue}
              className={`w-full justify-center text-white font-semibold text-[13px] py-2.5 rounded-lg shadow-sm ${isUpcoming ? 'bg-[#0055d4] hover:bg-[#004bbd]' : isCompleted ? 'bg-[#0055d4] hover:bg-[#004bbd]' : buttonClass}`}
            >
              {isCompleted ? 'View Review' : isUpcoming ? 'View Details' : 'Continue Learning'}
            </Button>
            {!isUpcoming && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onCurriculum}
                className="w-full justify-center font-semibold text-[13px] py-2.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {isCompleted ? 'View Summary' : 'View Curriculum'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ─────────────────────────────────────────────
// Filter tabs
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
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2557E8]/40 ${
              isActive
                ? 'bg-[#2557E8] border-[#2557E8] text-white shadow-sm'
                : 'border-slate-300 text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-400'
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
// Empty state
// ─────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e5eeff] bg-white py-16 px-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e5eeff]">
        <FlaskConical className="size-8 text-[#2557E8]" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-slate-800">No study plans found</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-xs">
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
  const [activeTab, setActiveTab]     = useState<FilterTab>('All')
  const [plans, setPlans]             = useState<StudyPlan[]>(STUDY_PLANS)
  const [createOpen, setCreateOpen]   = useState(false)
  const [learningPlan, setLearningPlan] = useState<LearningProgressPlan | null>(null)
  const [curriculumPlan, setCurriculumPlan] = useState<CurriculumPlan | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StudyPlan | null>(null)
  
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') || ''

  const filteredPlans = plans.filter((plan) => {
    // Search filter
    if (keyword) {
      const q = keyword.toLowerCase()
      const match = plan.title.toLowerCase().includes(q) || plan.description.toLowerCase().includes(q)
      if (!match) return false
    }

    // Tab filter
    if (activeTab === 'All') return true
    if (activeTab === 'AI Generated') return plan.isAiGenerated
    return plan.status === activeTab
  })

  const handleDuplicate = (plan: StudyPlan) => {
    const copy: StudyPlan = { ...plan, id: `${plan.id}-copy-${Date.now()}`, title: `${plan.title} (Copy)` }
    setPlans((prev) => [...prev, copy])
  }

  const handleArchive = (plan: StudyPlan) => {
    setPlans((prev) => prev.filter((p) => p.id !== plan.id))
  }

  const confirmDelete = () => {
    if (deleteTarget) setPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <>
      <div className="flex flex-col gap-6 pb-6">
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 leading-tight">Study Plans</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Manage your personalized learning journeys and academic goals.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            variant="primary"
            className="shrink-0 bg-[#2557E8] hover:bg-[#1d4ed8] text-white shadow-sm"
          >
            <Plus className="size-4" /> Create Plan
          </Button>
        </div>

        {/* ── Filter tabs ── */}
        <FilterTabs active={activeTab} onChange={setActiveTab} />

        {/* ── Plan cards ── */}
        <div className="flex flex-col gap-4">
          {filteredPlans.length === 0 ? (
            <EmptyState onAdd={() => setCreateOpen(true)} />
          ) : (
            filteredPlans.map((plan) => (
              <StudyPlanCard
                key={plan.id}
                plan={plan}
                isAiTab={activeTab === 'AI Generated'}
                onContinue={() => setLearningPlan(LEARNING_DATA[plan.id] ?? null)}
                onCurriculum={() => setCurriculumPlan(CURRICULUM_DATA[plan.id] ?? null)}
                onEdit={() => setCreateOpen(true)}
                onDuplicate={() => handleDuplicate(plan)}
                onArchive={() => handleArchive(plan)}
                onDelete={() => setDeleteTarget(plan)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Create Plan Modal ── */}
      <CreateStudyPlanModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />

      {/* ── Learning Progress Modal ── */}
      <LearningProgressModal
        isOpen={learningPlan !== null}
        onClose={() => setLearningPlan(null)}
        plan={learningPlan}
      />

      {/* ── Curriculum Modal ── */}
      <CurriculumModal
        isOpen={curriculumPlan !== null}
        onClose={() => setCurriculumPlan(null)}
        plan={curriculumPlan}
        onStart={() => {
          if (curriculumPlan) {
            setLearningPlan(LEARNING_DATA[curriculumPlan.id] ?? null)
            setCurriculumPlan(null)
          }
        }}
      />

      {/* ── Delete Confirmation ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Delete Study Plan</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              Are you sure you want to delete <span className="font-semibold">&ldquo;{deleteTarget.title}&rdquo;</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button
                variant="primary"
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
