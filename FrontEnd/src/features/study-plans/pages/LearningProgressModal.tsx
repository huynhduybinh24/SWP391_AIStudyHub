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
import { useNavigate } from 'react-router-dom'
import { useToastStore } from '@/stores/toastStore'
import { getDocumentIdByName } from './CurriculumModal'
import { useTheme } from '@/features/settings/components/ThemeProvider'
import { useTranslation } from '@/context/LanguageContext'
import { Language } from '@/locales'

// ─── Types ───────────────────────────────────────────────

export type LessonType = 'video' | 'reading' | 'quiz' | 'practice'

export type LearningLesson = {
  id: string
  title: string
  duration: string
  type: LessonType
  completed: boolean
  linkedDocName?: string
  pageRange?: string
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
  linkedDocs?: string[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  plan: LearningProgressPlan | null
}

// Helper to localize section labels
function getLocalizedSectionLabel(label: string, language: Language): string {
  const map: Record<string, string> = {
    'Core Concepts': language === 'vi' ? 'Khái niệm cốt lõi' : language === 'ja' ? 'コア概念' : language === 'ko' ? '핵심 개념' : 'Core Concepts',
    'Advanced Theory': language === 'vi' ? 'Lý thuyết nâng cao' : language === 'ja' ? '高度な理論' : language === 'ko' ? '고급 이론' : 'Advanced Theory',
    'Mock Exam': language === 'vi' ? 'Thi thử' : language === 'ja' ? '模擬試験' : language === 'ko' ? '모의고사' : 'Mock Exam',
    'Basics': language === 'vi' ? 'Cơ bản' : language === 'ja' ? '基礎' : language === 'ko' ? '기초' : 'Basics',
    'Reactions': language === 'vi' ? 'Phản ứng' : language === 'ja' ? '反応' : language === 'ko' ? '반응' : 'Reactions',
    'Synthesis': language === 'vi' ? 'Tổng hợp' : language === 'ja' ? '合成' : language === 'ko' ? '합성' : 'Synthesis',
    'Kinematics': language === 'vi' ? 'Động học' : language === 'ja' ? '運動学' : language === 'ko' ? '운동학' : 'Kinematics',
    'Navigation': language === 'vi' ? 'Định vị' : language === 'ja' ? 'ナビゲーション' : language === 'ko' ? '주행/내비게이션' : 'Navigation',
    'Neural Networks Basics': language === 'vi' ? 'Mạng thần kinh cơ bản' : language === 'ja' ? 'ニューラルネットワークの基礎' : language === 'ko' ? '인공신경망 기초' : 'Neural Networks Basics',
    'Verbal Reasoning': language === 'vi' ? 'Suy luận ngôn ngữ' : language === 'ja' ? '言語推論' : language === 'ko' ? '언어 추론' : 'Verbal Reasoning',
    'Control Systems': language === 'vi' ? 'Hệ thống điều khiển' : language === 'ja' ? '制御システム' : language === 'ko' ? '제어 시스템' : 'Control Systems',
    'WWI & WWII': 'WWI & WWII',
    'Cold War': language === 'vi' ? 'Chiến tranh lạnh' : language === 'ja' ? '冷戦' : language === 'ko' ? '냉전' : 'Cold War',
    'Modern Era': language === 'vi' ? 'Kỷ nguyên hiện đại' : language === 'ja' ? '現代' : language === 'ko' ? '현대' : 'Modern Era',
  }
  return map[label] ?? label
}

// Helper to localize lesson titles
function getLocalizedLessonTitle(title: string, language: Language): string {
  const map: Record<string, string> = {
    'Introduction to Quantum Theory': language === 'vi' ? 'Giới thiệu về Thuyết Lượng tử' : language === 'ja' ? '量子論入門' : language === 'ko' ? '양자론 입문' : 'Introduction to Quantum Theory',
    'Wave-Particle Duality': language === 'vi' ? 'Lưỡng tính sóng-hạt' : language === 'ja' ? '波と粒子の二重性' : language === 'ko' ? '파동-입자 이중성' : 'Wave-Particle Duality',
    'Quantum States & Superposition': language === 'vi' ? 'Trạng thái Lượng tử & Chồng chập' : language === 'ja' ? '量子状態と重ね合わせ' : language === 'ko' ? '양자 상태 및 중첩' : 'Quantum States & Superposition',
    "Schrödinger's Equation": language === 'vi' ? 'Phương trình Schrödinger' : language === 'ja' ? 'シュレーディンガー方程式' : language === 'ko' ? '슈뢰딩거 방정식' : "Schrödinger's Equation",
    'Quantum Entanglement': language === 'vi' ? 'Vướng víu Lượng tử' : language === 'ja' ? '量子もつれ' : language === 'ko' ? '양자 얽힘' : 'Quantum Entanglement',
    'Heisenberg Uncertainty Principle': language === 'vi' ? 'Nguyên lý bất định Heisenberg' : language === 'ja' ? 'ハイゼンベルクの不確定性原理' : language === 'ko' ? '하이젠베르크의 불확정성 원리' : 'Heisenberg Uncertainty Principle',
    'Practice Quiz 1': language === 'vi' ? 'Bài trắc nghiệm thực hành 1' : language === 'ja' ? '練習クイズ1' : language === 'ko' ? '연습 퀴즈 1' : 'Practice Quiz 1',
    'Final Mock Exam': language === 'vi' ? 'Bài thi thử cuối kỳ' : language === 'ja' ? '最終模擬試験' : language === 'ko' ? '최종 모의고사' : 'Final Mock Exam',
    'Functional Groups Overview': language === 'vi' ? 'Tổng quan về Nhóm chức' : language === 'ja' ? '官能基の概要' : language === 'ko' ? '작용기 개요' : 'Functional Groups Overview',
    'Nomenclature Rules': language === 'vi' ? 'Quy tắc Danh pháp' : language === 'ja' ? '命名法規則' : language === 'ko' ? '명명법 규칙' : 'Nomenclature Rules',
    'Addition Reactions': language === 'vi' ? 'Phản ứng cộng' : language === 'ja' ? '付加反応' : language === 'ko' ? '첨가 반응' : 'Addition Reactions',
    'Substitution Mechanisms': language === 'vi' ? 'Cơ chế phản ứng thế' : language === 'ja' ? '置換反応機構' : language === 'ko' ? '치환 반응 메커니즘' : 'Substitution Mechanisms',
    'Multi-step Synthesis': language === 'vi' ? 'Tổng hợp nhiều bước' : language === 'ja' ? '多段階合成' : language === 'ko' ? '다단계 합성' : 'Multi-step Synthesis',
    'Synthesis Quiz': language === 'vi' ? 'Bài kiểm tra tổng hợp' : language === 'ja' ? '合成クイズ' : language === 'ko' ? '합성 퀴즈' : 'Synthesis Quiz',
    'Forward Kinematics': language === 'vi' ? 'Động học thuận' : language === 'ja' ? '順運動学' : language === 'ko' ? '순기구학' : 'Forward Kinematics',
    'Inverse Kinematics': language === 'vi' ? 'Động học ngược' : language === 'ja' ? '逆運動学' : language === 'ko' ? '역기구학' : 'Inverse Kinematics',
    'Path Planning': language === 'vi' ? 'Quy hoạch đường đi' : language === 'ja' ? '経路計画' : language === 'ko' ? '경로 계획' : 'Path Planning',
    'Obstacle Avoidance': language === 'vi' ? 'Tránh chướng ngại vật' : language === 'ja' ? '障害物回避' : language === 'ko' ? '장애물 회피' : 'Obstacle Avoidance',
    'Introduction to NNs': language === 'vi' ? 'Giới thiệu về Mạng thần kinh' : language === 'ja' ? 'ニューラルネットワーク入門' : language === 'ko' ? '인공신경망 입문' : 'Introduction to NNs',
    'Vocabulary Basics': language === 'vi' ? 'Từ vựng Cơ bản' : language === 'ja' ? '基本語彙' : language === 'ko' ? '기본 어휘' : 'Vocabulary Basics',
    'PID Controllers': language === 'vi' ? 'Bộ điều khiển PID' : language === 'ja' ? 'PIDコントローラー' : language === 'ko' ? 'PID 제어기' : 'PID Controllers',
    'Causes of WWI': language === 'vi' ? 'Nguyên nhân Thế chiến I' : language === 'ja' ? '第一次世界大戦の原因' : language === 'ko' ? '제1차 세계대전의 원인' : 'Causes of WWI',
    'WWII Major Battles': language === 'vi' ? 'Các trận đánh lớn Thế chiến II' : language === 'ja' ? '第二次世界大戦の主要な戦い' : language === 'ko' ? '제2차 세계대전의 주요 전투' : 'WWII Major Battles',
    'Cold War Origins': language === 'vi' ? 'Nguồn gốc Chiến tranh lạnh' : language === 'ja' ? '冷戦の起源' : language === 'ko' ? '냉전의 기원' : 'Cold War Origins',
    'Cuban Missile Crisis': language === 'vi' ? 'Khủng hoảng Tên lửa Cuba' : language === 'ja' ? 'キューバ危機' : language === 'ko' ? '쿠바 미사일 위기' : 'Cuban Missile Crisis',
    'Post-Cold War World': language === 'vi' ? 'Thế giới sau Chiến tranh lạnh' : language === 'ja' ? 'ポスト冷戦の世界' : language === 'ko' ? '탈냉전 시대의 세계' : 'Post-Cold War World',
    'Comprehensive Exam': language === 'vi' ? 'Kỳ thi toàn diện' : language === 'ja' ? '総合試験' : language === 'ko' ? '종합 시험' : 'Comprehensive Exam',
  }
  return map[title] ?? title
}

function extractPageNumber(range?: string): number | undefined {
  if (!range) return undefined
  const match = range.match(/\d+/)
  return match ? parseInt(match[0], 10) : undefined
}

// ─── Lesson type icon ─────────────────────────────────────

function LessonTypeIcon({ type }: { type: LessonType }) {
  const map: Record<LessonType, { icon: React.ComponentType<{ className?: string }>, color: string }> = {
    video:    { icon: PlayCircle, color: 'text-[#2557E8] dark:text-blue-400'   },
    reading:  { icon: FileText,   color: 'text-slate-400 dark:text-slate-500'   },
    quiz:     { icon: HelpCircle, color: 'text-amber-500'   },
    practice: { icon: Code2,      color: 'text-emerald-500' },
  }
  const { icon: Icon, color } = map[type]
  return <Icon className={`size-4 shrink-0 ${color}`} />
}

// ─── Component ───────────────────────────────────────────

export function LearningProgressModal({ isOpen, onClose, plan }: Props) {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Localize plan title & description
  const localizedPlanInfo = useMemo(() => {
    if (!plan) return null
    let title = plan.title
    let description = plan.description
    if (plan.id === '1') {
      title = language === 'vi' ? 'Làm chủ Cơ học lượng tử' : language === 'ja' ? '量子力学マスター' : language === 'ko' ? '양자 역학 마스터' : plan.title
      description = language === 'vi' ? 'Một hành trình toàn diện từ hàm sóng đến vướng víu lượng tử.' : language === 'ja' ? '波動関数から量子もつれまでの包括的な旅。' : language === 'ko' ? '파동 함수에서 양자 얽힘까지의 포괄적인 여정.' : plan.description
    } else if (plan.id === '2') {
      title = language === 'vi' ? 'Nghiên cứu sâu Hóa hữu cơ' : language === 'ja' ? '有機化学の探求' : language === 'ko' ? '유기 화학 심층 탐구' : plan.title
      description = language === 'vi' ? 'Khám phá các hợp chất carbon và con đường chuyển hóa.' : language === 'ja' ? '炭素化合物および代謝経路の調査。' : language === 'ko' ? '탄소 화합물 및 대사 경로 탐구.' : plan.description
    } else if (plan.id === '3') {
      title = language === 'vi' ? 'Ôn thi cuối kỳ: Robot nâng cao' : language === 'ja' ? '期末試験対策：高度なロボット工学' : language === 'ko' ? '기말고사 대비: 고급 로봇 공학' : plan.title
      description = language === 'vi' ? 'Động học tiên tiến và hệ thống định vị tự hành.' : language === 'ja' ? '高度な運動学と自律ナビゲーションシステム。' : language === 'ko' ? '고급 운동학 및 자율 주행 시스템.' : plan.description
    }
    return { title, description }
  }, [plan, language])

  // Reset state when plan changes (merging with localStorage)
  useEffect(() => {
    if (!plan) return
    const completedLocalRaw = localStorage.getItem(`study_plan_completed_lessons_${plan.id}`)
    const completedLocal: string[] = completedLocalRaw ? JSON.parse(completedLocalRaw) : []
    const initial = new Set([
      ...plan.sections.flatMap((s) => s.lessons.filter((l) => l.completed).map((l) => l.id)),
      ...completedLocal
    ])
    setCompletedIds(initial)
    // Auto-expand first section with incomplete lessons
    const target = plan.sections.find((s) => s.lessons.some((l) => !initial.has(l.id)))
    setExpandedSection(target?.label ?? plan.sections[0]?.label ?? null)
  }, [plan?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist completed lessons back to localStorage
  useEffect(() => {
    if (!plan) return
    localStorage.setItem(`study_plan_completed_lessons_${plan.id}`, JSON.stringify(Array.from(completedIds)))
  }, [completedIds, plan?.id])

  // ── Derived: per-section stats ───────
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

  if (!plan || !localizedPlanInfo) return null

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
    const ownerSection = plan.sections.find((s) =>
      s.lessons.some((l) => l.id === nextLesson.id)
    )
    if (ownerSection) setExpandedSection(ownerSection.label)

    const docName = nextLesson.linkedDocName || plan.linkedDocs?.[0] || plan.title
    const docId = getDocumentIdByName(docName)

    if (nextLesson.type === 'reading') {
      addToast(
        language === 'vi'
          ? `Đang mở bài đọc tiếp theo: ${nextLesson.title}`
          : `Opening next reading lesson: ${nextLesson.title}`,
        'info'
      )
      onClose()
      const pageNum = extractPageNumber(nextLesson.pageRange)
      const pageQuery = pageNum ? `?page=${pageNum}` : ''
      navigate(`/dashboard/documents/document/${docId}${pageQuery}`)
    } else if (nextLesson.type === 'quiz') {
      addToast(
        language === 'vi'
          ? `Đang mở bài kiểm tra tiếp theo: ${nextLesson.title}`
          : `Opening next quiz lesson: ${nextLesson.title}`,
        'success'
      )
      onClose()
      navigate(`/dashboard/quizzes?doc=${docId}&lessonId=${nextLesson.id}&planId=${plan.id}`)
    } else {
      setCompletedIds((prev) => new Set([...prev, nextLesson.id]))
      addToast(
        language === 'vi'
          ? `Đã hoàn thành bài học: ${nextLesson.title}`
          : `Completed lesson: ${nextLesson.title}`,
        'success'
      )
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'vi' ? 'Tiến độ học tập' : language === 'ja' ? '学習進捗' : language === 'ko' ? '학습 진척도' : 'Learning Progress'}
      description={localizedPlanInfo.title}
      className="max-w-2xl"
    >
      {/* ── Overview banner ── */}
      <div className="flex items-center gap-5 rounded-xl bg-[#f0f4ff] dark:bg-blue-950/20 border border-[#e5eeff] dark:border-blue-900 p-4 mb-5">
        {/* Circular progress ring */}
        <div className="relative flex items-center justify-center w-[80px] h-[80px] shrink-0">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={radius} fill="none" stroke={isDark ? '#334155' : '#dce8ff'} strokeWidth="8" />
            <circle
              cx="40" cy="40" r={radius} fill="none"
              stroke={isDark ? '#3b82f6' : '#2557E8'} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circum}
              strokeDashoffset={dashOff}
              className="transition-all duration-500"
            />
          </svg>
          <span className="text-[16px] font-extrabold text-[#2557E8] dark:text-blue-400 z-10">
            {overallPct}%
          </span>
        </div>

        {/* Plan info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#e8eeff] dark:bg-slate-800 flex items-center justify-center shrink-0">
              <FlaskConical className="size-4 text-[#2557E8] dark:text-blue-400" strokeWidth={1.75} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-snug">
              {localizedPlanInfo.title}
            </h3>
            {plan.isAiGenerated && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#00897B] text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide">
                <Sparkles className="size-2.5" /> AI
              </span>
            )}
          </div>

          <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-1">{localizedPlanInfo.description}</p>

          <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <BookOpen className="size-3.5" />
              {language === 'vi' 
                ? `Đã hoàn thành ${completedCount}/${totalCount} bài học` 
                : language === 'ja' 
                ? `${completedCount}/${totalCount} のレッスン完了` 
                : language === 'ko' 
                ? `${completedCount}/${totalCount}개 학습 완료` 
                : `${completedCount}/${totalCount} lessons completed`}
            </span>
            {nextLesson && (
              <span className="flex items-center gap-1 text-[#2557E8] dark:text-blue-400 font-semibold truncate max-w-[250px]">
                <Clock3 className="size-3.5" />
                {language === 'vi' ? 'Tiếp theo: ' : language === 'ja' ? '次：' : language === 'ko' ? '다음: ' : 'Next: '}
                {getLocalizedLessonTitle(nextLesson.title, language)}
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
            <div key={section.label} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Section header */}
              <button
                type="button"
                onClick={() => setExpandedSection(isExpanded ? null : section.label)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      {getLocalizedSectionLabel(section.label, language)}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{done}/{total}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#e5eeff] dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2557E8] dark:bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-[#2557E8] dark:text-blue-400 w-8 text-right shrink-0">
                  {pct}%
                </span>
                {isExpanded
                  ? <ChevronUp   className="size-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  : <ChevronDown className="size-4 text-slate-400 dark:text-slate-500 shrink-0" />
                }
              </button>

              {/* Lesson rows */}
              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {section.lessons.map((lesson) => {
                    const isDone = completedIds.has(lesson.id)
                    const localizedDuration = lesson.duration
                      ? lesson.duration.replace('min', language === 'vi' ? 'phút' : language === 'ja' ? '分' : language === 'ko' ? '분' : 'min')
                      : ''

                    return (
                      <div
                        key={lesson.id}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors text-left"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleLesson(lesson.id)
                          }}
                          className="p-1 -m-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 cursor-pointer shrink-0 transition-colors"
                          title={language === 'vi' ? 'Đánh dấu hoàn thành' : 'Mark as completed'}
                        >
                          {isDone
                            ? <CheckCircle2 className="size-4 text-[#2557E8] dark:text-blue-400" />
                            : <Circle       className="size-4 text-slate-300 dark:text-slate-600" />
                          }
                        </button>

                        <div className="flex-1 flex flex-col gap-1 text-left">
                          <div
                            onClick={() => {
                              if (lesson.type === 'reading') {
                                addToast(
                                  language === 'vi'
                                    ? `Đang mở tài liệu bài học: ${lesson.title}`
                                    : `Opening reading materials: ${lesson.title}`,
                                  'info'
                                )
                                onClose()
                                const docName = lesson.linkedDocName || plan.linkedDocs?.[0] || plan.title
                                const docId = getDocumentIdByName(docName)
                                const pageNum = extractPageNumber(lesson.pageRange)
                                const pageQuery = pageNum ? `?page=${pageNum}` : ''
                                navigate(`/dashboard/documents/document/${docId}${pageQuery}`)
                              } else if (lesson.type === 'quiz') {
                                addToast(
                                  language === 'vi'
                                    ? `Đang mở bài kiểm tra tự luyện: ${lesson.title}`
                                    : `Opening practice quiz: ${lesson.title}`,
                                  'success'
                                )
                                onClose()
                                const docName = lesson.linkedDocName || plan.linkedDocs?.[0] || plan.title
                                const docId = getDocumentIdByName(docName)
                                navigate(`/dashboard/quizzes?doc=${docId}&lessonId=${lesson.id}&planId=${plan.id}`)
                              } else {
                                addToast(
                                  language === 'vi'
                                    ? `Đã hoàn thành bài học: ${lesson.title}`
                                    : `Completed lesson: ${lesson.title}`,
                                  'success'
                                )
                                toggleLesson(lesson.id)
                              }
                            }}
                            className="flex items-center gap-3 cursor-pointer hover:text-indigo-650 dark:hover:text-indigo-400"
                          >
                            <LessonTypeIcon type={lesson.type} />
                            <span className={`text-sm ${isDone ? 'text-slate-400 dark:text-slate-500 line-through font-medium' : 'text-slate-700 dark:text-slate-300 font-medium'}`}>
                              {getLocalizedLessonTitle(lesson.title, language)}
                            </span>
                          </div>

                          {lesson.linkedDocName && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                const docId = getDocumentIdByName(lesson.linkedDocName || '')
                                const pageNum = extractPageNumber(lesson.pageRange)
                                const pageQuery = pageNum ? `?page=${pageNum}` : ''
                                navigate(`/dashboard/documents/document/${docId}${pageQuery}`)
                                onClose()
                              }}
                              className="text-xs text-indigo-650 dark:text-indigo-400 hover:underline pl-7 flex items-center gap-1 cursor-pointer font-normal"
                            >
                              <span>📖 Tài liệu: {lesson.linkedDocName}</span>
                              {lesson.pageRange && <span className="text-[11px] text-slate-450 dark:text-slate-500">({lesson.pageRange})</span>}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{localizedDuration}</span>
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
      <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button variant="ghost" onClick={onClose}>{t.common.close}</Button>
        {overallPct === 100 ? (
          <Button
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white"
            onClick={onClose}
          >
            {language === 'vi' ? '🎉 Hoàn tất! Đóng' : language === 'ja' ? '🎉 すべて完了！閉じる' : language === 'ko' ? '🎉 완료! 닫기' : '🎉 All Done! Close'}
          </Button>
        ) : (
          <Button
            variant="primary"
            className="bg-[#2557E8] hover:bg-[#1d4ed8] dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-6"
            onClick={handleResume}
          >
            {language === 'vi' ? 'Tiếp tục học tập' : language === 'ja' ? '学習を再開' : language === 'ko' ? '학습 재개' : 'Resume Learning'}
          </Button>
        )}
      </div>
    </Modal>
  )
}
