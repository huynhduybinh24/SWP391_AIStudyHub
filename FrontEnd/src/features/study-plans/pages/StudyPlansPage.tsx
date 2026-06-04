import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
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
import { CurriculumModal, type CurriculumPlan, getDocumentIdByName } from '@/features/study-plans/pages/CurriculumModal'
import { useTranslation } from '@/context/LanguageContext'
import { Language } from '@/locales'

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
  linkedDocs?: string[]
}

// Helper to localize mock plan strings
function localizePlan(plan: StudyPlan, language: Language): StudyPlan {
  const localMap: Record<string, { title: string; description: string; segments?: string[]; milestoneTitle?: string }> = {
    '1': {
      title: language === 'vi' ? 'Làm chủ Cơ học lượng tử' : language === 'ja' ? '量子力学マスター' : language === 'ko' ? '양자 역학 마스터' : 'Quantum Mechanics Mastery',
      description: language === 'vi' ? 'Một hành trình toàn diện từ hàm sóng đến vướng víu lượng tử.' : language === 'ja' ? '波動関数から量子もつれまでの包括的な旅。' : language === 'ko' ? '파동 함수에서 양자 얽힘까지의 포괄적인 여정.' : 'A comprehensive journey from wave functions to quantum entanglement.',
      segments: language === 'vi' ? ['Khái niệm cốt lõi', 'Lý thuyết nâng cao', 'Thi thử'] : language === 'ja' ? ['コア概念', '高度な理論', '模擬試験'] : language === 'ko' ? ['핵심 개념', '고급 이론', '모의고사'] : ['Core Concepts', 'Advanced Theory', 'Mock Exam'],
      milestoneTitle: language === 'vi' ? 'Trắc nghiệm Phương trình Schrödinger' : language === 'ja' ? 'シュレーディンガー方程式クイズ' : language === 'ko' ? '슈뢰딩거 방정식 퀴즈' : "Schrödinger's Equation Quiz",
    },
    '2': {
      title: language === 'vi' ? 'Nghiên cứu sâu Hóa hữu cơ' : language === 'ja' ? '有機化学の探求' : language === 'ko' ? '유기 화학 심층 탐구' : 'Organic Chemistry Deep Dive',
      description: language === 'vi' ? 'Khám phá các hợp chất carbon và con đường chuyển hóa.' : language === 'ja' ? '炭소 화합물 및 대사 경로 탐색.' : language === 'ko' ? '탄소 화합물 및 대사 경로 탐구.' : 'Exploring carbon compounds and metabolic pathways.',
      segments: language === 'vi' ? ['Danh pháp', 'Phản ứng thế', 'Phản ứng tách'] : language === 'ja' ? ['命名法', '置換反応', '脱離反応'] : language === 'ko' ? ['명명법', '치환 반응', '제거 반응'] : ['Nomenclature', 'Substitution', 'Elimination'],
      milestoneTitle: language === 'vi' ? 'Alkan & Cycloalkan' : language === 'ja' ? 'アルカンとシクロアルカン' : language === 'ko' ? '알칸 및 시클로알칸' : 'Alkanes & Cycloalkanes',
    },
    '3': {
      title: language === 'vi' ? 'Ôn thi cuối kỳ: Robot nâng cao' : language === 'ja' ? '期末試験対策：高度なロボット工学' : language === 'ko' ? '기말고사 대비: 고급 로봇 공학' : 'Final Exam Prep: Advanced Robotics',
      description: language === 'vi' ? 'Động học tiên tiến và hệ thống định vị tự hành.' : language === 'ja' ? '高度な運動学と自律ナビゲーションシステム。' : language === 'ko' ? '고급 운동학 및 자율 주행 시스템.' : 'Advanced kinematics and autonomous navigation systems.',
    },
    '6': {
      title: language === 'vi' ? 'Khóa học mùa đông: Cơ bản về Deep Learning' : language === 'ja' ? '冬季セッション：ディープラーニングの基礎' : language === 'ko' ? '겨울 세션: 딥러닝 기초' : 'Winter Session: Deep Learning Fundamentals',
      description: language === 'vi' ? 'Nền tảng của mạng thần kinh và tối ưu hóa hạ độ dốc.' : language === 'ja' ? 'ニューラルネットワークの基礎と勾配降下法最適化。' : language === 'ko' ? '인공신경망의 기초 및 경사하강법 최적화.' : 'Foundations of neural networks and gradient descent optimization.',
    },
    '7': {
      title: language === 'vi' ? 'Luyện từ vựng & Logic GRE' : language === 'ja' ? 'GRE語彙と論理トラック' : language === 'ko' ? 'GRE 어휘 및 논리 트랙' : 'GRE Vocabulary & Logic Track',
      description: language === 'vi' ? 'Luyện viết phân tích và suy luận ngôn ngữ chuyên sâu.' : language === 'ja' ? '集中的な言語的推論と分析的ライティング対策。' : language === 'ko' ? '집중적인 언어 추론 및 분석적 쓰기 준비.' : 'Intensive verbal reasoning and analytical writing preparation.',
    },
    '8': {
      title: language === 'vi' ? 'Robot học nâng cao' : language === 'ja' ? '高度なロボット工学' : language === 'ko' ? '고급 로봇 공학' : 'Advanced Robotics',
      description: language === 'vi' ? 'Động học, hệ thống điều khiển và tích hợp học máy.' : language === 'ja' ? '運動学、制御システム、機械学習の統合。' : language === 'ko' ? '운동학, 제어 시스템 및 머신러닝 통합.' : 'Kinematics, control systems, and machine learning integration.',
    },
    '4': {
      title: language === 'vi' ? 'Hóa học hữu cơ nâng cao' : language === 'ja' ? '高度な有機化学' : language === 'ko' ? '고급 유기 화학' : 'Advanced Organic Chemistry',
      description: language === 'vi' ? 'Làm chủ các cơ chế phản ứng và tổng hợp nâng cao.' : language === 'ja' ? '高度な反応機構と合成の習得。' : language === 'ko' ? '고급 반응 메커니즘 및 합성 마스터.' : 'Mastery of advanced reaction mechanisms and synthesis.',
    },
    '5': {
      title: language === 'vi' ? 'Giới thiệu về Vật lý thiên văn' : language === 'ja' ? '宇宙物理学入門' : language === 'ko' ? '천체물리학 입문' : 'Introduction to Astrophysics',
      description: language === 'vi' ? 'Các nguyên lý nền tảng về tiến hóa sao và vũ trụ học.' : language === 'ja' ? '恒星の進化と宇宙論の基礎原理。' : language === 'ko' ? '항성 진화 및 우주론의 기초 원리.' : 'Foundational principles of stellar evolution and cosmology.',
    },
  }

  const local = localMap[plan.id]
  if (!local) return plan

  const updatedSegments = plan.segments.map((seg, idx) => ({
    ...seg,
    label: local.segments?.[idx] ?? seg.label
  }))

  const updatedMilestone = plan.milestone
    ? {
        ...plan.milestone,
        title: local.milestoneTitle ?? plan.milestone.title,
        month: language === 'vi' ? 'TH10' : language === 'ja' ? '10月' : language === 'ko' ? '10월' : plan.milestone.month,
        time: plan.milestone.time === '10:00 AM Tomorrow'
          ? (language === 'vi' ? '10:00 Sáng mai' : language === 'ja' ? '明日 午前10:00' : language === 'ko' ? '내일 오전 10:00' : '10:00 AM Tomorrow')
          : plan.milestone.time === '2:00 PM Wednesday'
          ? (language === 'vi' ? '14:00 Thứ Tư' : language === 'ja' ? '水曜 午後2:00' : language === 'ko' ? '수요일 오후 2:00' : '2:00 PM Wednesday')
          : plan.milestone.time
      }
    : undefined

  return {
    ...plan,
    title: local.title,
    description: local.description,
    segments: updatedSegments,
    milestone: updatedMilestone
  }
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
    linkedDocs: ['Giáo trình Cơ học lượng tử nâng cao.pdf']
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
    linkedDocs: ['Slide bài giảng Hóa hữu cơ chương 2.pdf']
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
  const { language } = useTranslation()
  const map: Record<StudyPlan['difficulty'], { color: string }> = {
    Easy: { color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900/50' },
    Medium: { color: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-900/50' },
    Hard: { color: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/30 dark:border-rose-900/50' },
  }
  const levelText = level === 'Easy' 
    ? (language === 'vi' ? 'Dễ' : language === 'ja' ? '初級' : language === 'ko' ? '쉬움' : 'Easy')
    : level === 'Medium'
    ? (language === 'vi' ? 'Trung bình' : language === 'ja' ? '中級' : language === 'ko' ? '보통' : 'Medium')
    : (language === 'vi' ? 'Khó' : language === 'ja' ? '上級' : language === 'ko' ? '어려움' : 'Hard')

  const diffText = language === 'vi' ? 'Độ khó' : language === 'ja' ? '難易度' : language === 'ko' ? '난이도' : 'Difficulty'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${map[level].color}`}
    >
      <TrendingUp className="size-3" />
      {diffText}: {levelText}
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
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const { t, language } = useTranslation()

  const menuItems = [
    { label: language === 'vi' ? 'Chỉnh sửa' : language === 'ja' ? '計画を編集' : language === 'ko' ? '계획 편집' : 'Edit Plan',  icon: Pencil,  action: onEdit,      danger: false },
    { label: language === 'vi' ? 'Tạo bản sao' : language === 'ja' ? '複製' : language === 'ko' ? '복제' : 'Duplicate',  icon: Copy,    action: onDuplicate,  danger: false },
    { label: language === 'vi' ? 'Lưu trữ' : language === 'ja' ? 'アーカイブ' : language === 'ko' ? '보관' : 'Archive',    icon: Archive,  action: onArchive,   danger: false },
    { label: t.common.delete,     icon: Trash2,  action: onDelete,     danger: true  },
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

  const localizedPlanInfo = useMemo(() => localizePlan(plan, language), [plan, language])

  const localizedDateStr = (date: string, type: 'completed' | 'starts') => {
    if (type === 'completed') {
      return language === 'vi' ? `Đã hoàn thành ${date}` : language === 'ja' ? `${date}に完了` : language === 'ko' ? `${date} 완료됨` : `Completed ${date}`
    } else {
      return language === 'vi' ? `Bắt đầu ${date}` : language === 'ja' ? `${date}に開始` : language === 'ko' ? `${date} 시작` : `Starts ${date}`
    }
  }

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
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-snug">
                  {localizedPlanInfo.title}
                </h3>
                {isCompleted ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ccfbf1] text-[#00897B] text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wide shrink-0">
                    <CheckCircle2 className="size-3" strokeWidth={2.5} />
                    {language === 'vi' ? 'ĐÃ HOÀN THÀNH' : language === 'ja' ? '完了' : language === 'ko' ? '완료됨' : 'COMPLETED'}
                  </span>
                ) : isUpcoming ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e5eeff] text-[#2557E8] text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wide shrink-0">
                    {language === 'vi' ? 'Sắp diễn ra' : language === 'ja' ? '今後の予定' : language === 'ko' ? '예정됨' : 'Upcoming'}
                  </span>
                ) : isAiTab ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#2557E8] text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider shrink-0">
                      {language === 'vi' ? 'AI Tạo' : language === 'ja' ? 'AI生成' : language === 'ko' ? 'AI 생성됨' : 'AI Generated'}
                    </span>
                    {plan.difficulty === 'Hard' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-600 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider shrink-0">
                        {language === 'vi' ? 'Khó' : language === 'ja' ? '上級' : language === 'ko' ? '어려움' : 'Hard'}
                      </span>
                    )}
                    {plan.difficulty === 'Medium' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-600 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider shrink-0">
                        {language === 'vi' ? 'Trung bình' : language === 'ja' ? '中級' : language === 'ko' ? '보통' : 'Medium'}
                      </span>
                    )}
                    {plan.difficulty === 'Easy' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-600 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider shrink-0">
                        {language === 'vi' ? 'Dễ' : language === 'ja' ? '初級' : language === 'ko' ? '쉬움' : 'Easy'}
                      </span>
                    )}
                  </div>
                ) : plan.isAiGenerated ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ccfbf1] text-[#00897B] text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wide shrink-0">
                    <Sparkles className="size-3" strokeWidth={2} />
                    {language === 'vi' ? 'AI Tạo' : language === 'ja' ? 'AI生成' : language === 'ko' ? 'AI 생성됨' : 'AI Generated'}
                  </span>
                ) : null}
              </div>
              {/* More menu */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
                  aria-label="More options"
                >
                  <MoreVertical className="size-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-8 z-20 min-w-[160px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg dark:shadow-black/50 py-1">
                    {menuItems.map(({ label, icon: Icon, action, danger }) => (
                      <button
                        key={label}
                        className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          danger ? 'text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20' : 'text-slate-700 dark:text-slate-300'
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
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-relaxed line-clamp-2">
              {localizedPlanInfo.description}
            </p>

            {/* Linked Documents (Teacher feedback integration) */}
            {plan.linkedDocs && plan.linkedDocs.length > 0 && (
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 dark:text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Link2 className="size-3 text-indigo-500 dark:text-indigo-400" />
                  {language === 'vi' ? 'TÀI LIỆU LIÊN KẾT' : language === 'ja' ? '関連ドキュメント' : language === 'ko' ? '연결된 문서' : 'LINKED DOCUMENTS'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {plan.linkedDocs.map((docName, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/dashboard/documents/document/${getDocumentIdByName(docName)}`)
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-indigo-55/40 hover:bg-indigo-100/50 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/40 border border-indigo-100/50 dark:border-indigo-900/30 text-[11px] font-semibold text-indigo-650 dark:text-indigo-400 cursor-pointer transition-colors"
                    >
                      {docName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Info pills */}
            <div className="flex flex-wrap gap-2 mt-3">
              {isCompleted && plan.completedAt && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  <Calendar className="size-3.5 text-slate-400" />
                  {localizedDateStr(plan.completedAt, 'completed')}
                </span>
              )}
              {isUpcoming && plan.startsAt && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  <Calendar className="size-3.5 text-slate-400" />
                  {localizedDateStr(plan.startsAt, 'starts')}
                </span>
              )}
              {isUpcoming && plan.tasks && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  <ClipboardList className="size-3.5 text-slate-400" />
                  {language === 'vi' ? `${plan.tasks} Nhiệm vụ` : language === 'ja' ? `${plan.tasks}個のタスク` : language === 'ko' ? `${plan.tasks}개 작업` : `${plan.tasks} Tasks`}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                <Link2 className="size-3.5 text-slate-400" />
                {language === 'vi' ? `${plan.documents} Tài liệu` : language === 'ja' ? `${plan.documents}個のドキュメント` : language === 'ko' ? `${plan.documents}개 문서` : `${plan.documents} Documents`}
              </span>
              {!isCompleted && !isUpcoming && (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                    <Clock className="size-3.5 text-slate-400" />
                    {language === 'vi' ? `Ước tính ${plan.hoursEst} giờ` : language === 'ja' ? `推定 ${plan.hoursEst} 時間` : language === 'ko' ? `예상 ${plan.hoursEst} 시간` : `${plan.hoursEst} Hours Est.`}
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
                    {isCompleted 
                      ? (language === 'vi' ? 'Điểm số cuối kỳ' : language === 'ja' ? '最終成績' : language === 'ko' ? '최종 성적' : 'Final Grade') 
                      : isAiTab 
                      ? (language === 'vi' ? 'Tiến độ' : language === 'ja' ? '進捗' : language === 'ko' ? '진척도' : 'Progress') 
                      : (language === 'vi' ? 'Tiến độ tổng thể' : language === 'ja' ? '全体進捗' : language === 'ko' ? '전체 진척도' : 'Overall Progress')}
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
                  <SegmentedProgress segments={localizedPlanInfo.segments} themeColor={plan.themeColor} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className={`shrink-0 sm:w-[220px] border-t sm:border-t-0 sm:border-l border-[#e5eeff] flex flex-col p-5 gap-4 bg-[#fafbff] ${(isCompleted || isUpcoming || isAiTab) ? 'justify-center' : 'justify-between'}`}>
          {/* Milestone */}
          {!isCompleted && !isUpcoming && !isAiTab && localizedPlanInfo.milestone && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                {language === 'vi' ? 'Cột mốc tiếp theo' : language === 'ja' ? '次のマイルストーン' : language === 'ko' ? '다음 마일스톤' : 'Next Milestone'}
              </p>
              <div className="flex items-start gap-3">
                {/* Date block */}
                <div className="flex flex-col items-center justify-center w-11 shrink-0 pt-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest leading-none text-red-500 mb-0.5">
                    {localizedPlanInfo.milestone.month}
                  </span>
                  <span className="text-2xl font-black leading-none text-slate-900">
                    {localizedPlanInfo.milestone.day}
                  </span>
                </div>
                {/* Text */}
                <div>
                  <p className="font-semibold text-slate-800 text-[13px] leading-snug">
                    {localizedPlanInfo.milestone.title}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock3 className="size-3 text-slate-400" />
                    <span className="text-[11px] text-slate-400">
                      {localizedPlanInfo.milestone.time}
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
              {isCompleted 
                ? (language === 'vi' ? 'Xem đánh giá' : language === 'ja' ? 'レビューを表示' : language === 'ko' ? '평가 보기' : 'View Review') 
                : isUpcoming 
                ? (language === 'vi' ? 'Xem chi tiết' : language === 'ja' ? '詳細を表示' : language === 'ko' ? '상세 보기' : 'View Details') 
                : (language === 'vi' ? 'Tiếp tục học' : language === 'ja' ? '学習を継続' : language === 'ko' ? '학습 계속하기' : 'Continue Learning')}
            </Button>
            {!isUpcoming && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onCurriculum}
                className="w-full justify-center font-semibold text-[13px] py-2.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {isCompleted 
                  ? (language === 'vi' ? 'Xem tóm tắt' : language === 'ja' ? '要約を表示' : language === 'ko' ? '요약 보기' : 'View Summary') 
                  : (language === 'vi' ? 'Xem giáo trình' : language === 'ja' ? 'カリキュラム表示' : language === 'ko' ? '커리큘럼 보기' : 'View Curriculum')}
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
  const { t, language } = useTranslation()

  const getTabLabel = (tab: FilterTab) => {
    switch (tab) {
      case 'All':
        return t.common.all
      case 'Active':
        return language === 'vi' ? 'Đang học' : language === 'ja' ? '学習中' : language === 'ko' ? '학습 중' : 'Active'
      case 'Completed':
        return language === 'vi' ? 'Đã hoàn thành' : language === 'ja' ? '完了' : language === 'ko' ? '완료됨' : 'Completed'
      case 'Upcoming':
        return language === 'vi' ? 'Sắp diễn ra' : language === 'ja' ? '今後の予定' : language === 'ko' ? '예정됨' : 'Upcoming'
      case 'AI Generated':
        return language === 'vi' ? 'AI Tạo' : language === 'ja' ? 'AI生成' : language === 'ko' ? 'AI 생성됨' : 'AI Generated'
      default:
        return tab
    }
  }

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
                ? 'bg-[#2557E8] dark:bg-blue-600 border-[#2557E8] dark:border-blue-600 text-white shadow-sm'
                : 'border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
            }`}
          >
            {tab === 'AI Generated' && (
              <Sparkles className="size-3.5" strokeWidth={2} />
            )}
            {getTabLabel(tab)}
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
  const { t, language } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e5eeff] dark:border-slate-800 bg-white dark:bg-slate-900 py-16 px-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e5eeff] dark:bg-slate-800">
        <FlaskConical className="size-8 text-[#2557E8] dark:text-blue-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
        {language === 'vi' ? 'Không tìm thấy kế hoạch học tập' : language === 'ja' ? '学習計画が見つかりません' : language === 'ko' ? '학습 계획을 찾을 수 없습니다' : 'No study plans found'}
      </h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs">
        {language === 'vi' ? 'Tạo kế hoạch học tập đầu tiên để tổ chức lộ trình học tập và theo dõi tiến độ của bạn.' : language === 'ja' ? '最初の学習計画を作成して、学習の進捗を整理しましょう。' : language === 'ko' ? '첫 번째 학습 계획을 만들어 학습 여정을 체계화하고 진척도를 추적해 보세요.' : 'Create your first study plan to organize your learning journey and track your progress.'}
      </p>
      <Button
        onClick={onAdd}
        variant="primary"
        className="mt-6 bg-[#2557E8] hover:bg-[#1d4ed8] dark:bg-blue-600 dark:hover:bg-blue-500 text-white"
      >
        <Plus className="size-4" /> {t.studyPlans.createPlan}
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export function StudyPlansPage() {
  const { t, language } = useTranslation()
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
            <h1 className="text-[28px] font-bold text-slate-900 dark:text-slate-100 leading-tight">{t.studyPlans.title}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              {t.studyPlans.subtitle}
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            variant="primary"
            className="shrink-0 bg-[#2557E8] hover:bg-[#1d4ed8] dark:bg-blue-600 dark:hover:bg-blue-500 text-white shadow-sm"
          >
            <Plus className="size-4" /> {t.studyPlans.createPlan}
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
                onCurriculum={() => {
                  const baseCurriculum = CURRICULUM_DATA[plan.id] || {
                    id: plan.id,
                    title: plan.title,
                    documents: plan.documents,
                    hoursEst: plan.hoursEst,
                    difficulty: plan.difficulty,
                    modules: plan.segments.map((seg, sIdx) => ({
                      id: `m-${sIdx}-${Date.now()}`,
                      title: seg.label,
                      description: language === 'vi' 
                        ? `Nội dung học tập chi tiết được AI trích xuất và lên kế hoạch dựa trên tài liệu liên kết.`
                        : `Detailed study topics compiled by AI based on your linked reference documents.`,
                      lessons: [
                        { id: `l-${sIdx}-1`, title: language === 'vi' ? 'Đọc và hiểu tài liệu tham khảo chính' : 'Read & Understand Core References', duration: '25 min', type: 'reading', status: 'in-progress' },
                        { id: `l-${sIdx}-2`, title: language === 'vi' ? 'Trắc nghiệm tự luyện cùng AI' : 'AI-Assisted Practice Quiz', duration: '30 min', type: 'quiz', status: 'locked' }
                      ]
                    }))
                  }
                  setCurriculumPlan({
                    ...baseCurriculum,
                    linkedDocs: plan.linkedDocs
                  })
                }}
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
      <CreateStudyPlanModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(newPlan) => setPlans((prev) => [newPlan, ...prev])}
      />

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
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5 text-red-500 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  {language === 'vi' ? 'Xóa kế hoạch học tập' : language === 'ja' ? '学習計画の削除' : language === 'ko' ? '학습 계획 삭제' : 'Delete Study Plan'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {language === 'vi' ? 'Hành động này không thể hoàn tác.' : language === 'ja' ? 'この操作は取り消せません。' : language === 'ko' ? '이 작업은 취소할 수 없습니다.' : 'This action cannot be undone.'}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
              {language === 'vi' 
                ? `Bạn có chắc chắn muốn xóa "${deleteTarget.title}"?` 
                : language === 'ja' 
                ? `「${deleteTarget.title}」を本当に削除しますか？` 
                : language === 'ko' 
                ? `정말 "${deleteTarget.title}"을(를) 삭제하시겠습니까?` 
                : `Are you sure you want to delete "${deleteTarget.title}"?`}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>{t.common.cancel}</Button>
              <Button
                variant="primary"
                className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 text-white"
                onClick={confirmDelete}
              >
                {t.common.delete}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
