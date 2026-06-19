import { useEffect, useRef, useState, useMemo } from 'react'
import {
  CheckCircle2,
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
import { useNavigate } from 'react-router-dom'
import { useToastStore } from '@/stores/toastStore'
import { useTranslation } from '@/context/LanguageContext'
import { Language } from '@/locales'

// ─── Types ───────────────────────────────────────────────

type LessonType = 'video' | 'reading' | 'quiz' | 'practice'
type LessonStatus = 'completed' | 'in-progress' | 'locked'

export type CurriculumLesson = {
  id: string
  title: string
  duration: string
  type: LessonType
  status: LessonStatus
  linkedDocName?: string
  pageRange?: string
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
  linkedDocs?: string[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onStart?: () => void
  plan: CurriculumPlan | null
}

export function getDocumentIdByName(name: string): string {
  const n = name.toLowerCase()

  // Try to lookup in localStorage name-to-id map
  try {
    const localMapRaw = localStorage.getItem('document_name_to_id_map')
    if (localMapRaw) {
      const map = JSON.parse(localMapRaw)
      const foundKey = Object.keys(map).find(k => k.toLowerCase() === n || name.includes(k) || k.includes(name))
      if (foundKey) {
        return map[foundKey]
      }
    }
  } catch (e) {
    console.error('Error reading document_name_to_id_map:', e)
  }

  if (n.includes('lượng tử') || n.includes('quantum') || n.includes('vật lý') || n.includes('physics')) {
    return 'doc-3' // Introduction to Quantum Mechanics
  }
  if (
    n.includes('hóa hữu cơ') ||
    n.includes('chemistry') ||
    n.includes('cấu trúc') ||
    n.includes('data structures') ||
    n.includes('design patterns') ||
    n.includes('giải thuật')
  ) {
    return 'doc-design-patterns' // Design Patterns / Java
  }
  if (n.includes('văn học') || n.includes('philosophy') || n.includes('triết học')) {
    return 'doc-5' // Philosophy 101 Notes
  }
  return 'doc-1' // Mathematics Cheat Sheet
}

function extractPageNumber(range?: string): number | undefined {
  if (!range) return undefined
  const match = range.match(/\d+/)
  return match ? parseInt(match[0], 10) : undefined
}

// Helper to localize module titles
function getLocalizedModuleTitle(title: string, language: Language): string {
  const map: Record<string, string> = {
    'Core Concepts': language === 'vi' ? 'Khái niệm cốt lõi' : language === 'ja' ? 'コア概念' : language === 'ko' ? '핵심 개념' : 'Core Concepts',
    'Advanced Theory': language === 'vi' ? 'Lý thuyết nâng cao' : language === 'ja' ? '高度な理論' : language === 'ko' ? '고급 이론' : 'Advanced Theory',
    'Mock Exam Prep': language === 'vi' ? 'Thi thử & Ôn tập' : language === 'ja' ? '模擬試験の準備' : language === 'ko' ? '모의고사 준비' : 'Mock Exam Prep',
    'Basics': language === 'vi' ? 'Cơ bản' : language === 'ja' ? '基礎' : language === 'ko' ? '기초' : 'Basics',
    'Reactions': language === 'vi' ? 'Phản ứng' : language === 'ja' ? '反応' : language === 'ko' ? '반응' : 'Reactions',
    'Synthesis': language === 'vi' ? 'Tổng hợp' : language === 'ja' ? '合成' : language === 'ko' ? '합성' : 'Synthesis',
    'Kinematics': language === 'vi' ? 'Động học' : language === 'ja' ? '運動学' : language === 'ko' ? '운동학' : 'Kinematics',
    'Control Systems': language === 'vi' ? 'Hệ thống điều khiển' : language === 'ja' ? '制御システム' : language === 'ko' ? '제어 시스템' : 'Control Systems',
    'Arrays & Strings': language === 'vi' ? 'Mảng & Chuỗi' : language === 'ja' ? '配列と文字列' : language === 'ko' ? '배열 및 문자열' : 'Arrays & Strings',
    'Trees & Graphs': language === 'vi' ? 'Cây & Đồ thị' : language === 'ja' ? '木とグラフ' : language === 'ko' ? '트리 및 그래프' : 'Trees & Graphs',
    'Dynamic Programming': language === 'vi' ? 'Quy hoạch động' : language === 'ja' ? '動的計画法' : language === 'ko' ? '동적 계획법' : 'Dynamic Programming',
    'WWI & WWII': 'WWI & WWII',
    'Cold War': language === 'vi' ? 'Chiến tranh lạnh' : language === 'ja' ? '冷戦' : language === 'ko' ? '냉전' : 'Cold War',
    'Modern Era': language === 'vi' ? 'Kỷ nguyên hiện đại' : language === 'ja' ? '現代' : language === 'ko' ? '현대' : 'Modern Era',
  }
  return map[title] ?? title
}

// Helper to localize module descriptions
function getLocalizedModuleDesc(desc: string, language: Language): string {
  const map: Record<string, string> = {
    'Foundations of quantum theory': language === 'vi' ? 'Nền tảng của lý thuyết lượng tử' : language === 'ja' ? '量子論の基礎' : language === 'ko' ? '양자론의 기초' : 'Foundations of quantum theory',
    'Deep dive into quantum equations': language === 'vi' ? 'Đi sâu vào các phương trình lượng tử' : language === 'ja' ? '量子方程式の探求' : language === 'ko' ? '양자 방정식 심층 탐구' : 'Deep dive into quantum equations',
    'Exam simulations and review': language === 'vi' ? 'Mô phỏng kỳ thi và ôn tập' : language === 'ja' ? '試験のシミュレーションと復習' : language === 'ko' ? '시험 시뮬레이션 및 복습' : 'Exam simulations and review',
    'Core organic chemistry concepts': language === 'vi' ? 'Các khái niệm hóa hữu cơ cốt lõi' : language === 'ja' ? '有機化学のコア概念' : language === 'ko' ? '유기 화학 핵심 개념' : 'Core organic chemistry concepts',
    'Reaction types and mechanisms': language === 'vi' ? 'Các loại phản ứng và cơ chế' : language === 'ja' ? '反応の種類と機構' : language === 'ko' ? '반응 유형 및 메커니즘' : 'Reaction types and mechanisms',
    'Advanced synthesis pathways': language === 'vi' ? 'Các con đường tổng hợp nâng cao' : language === 'ja' ? '高度な合成経路' : language === 'ko' ? '고급 합성 경로' : 'Advanced synthesis pathways',
    'Linear data structures': language === 'vi' ? 'Cấu trúc dữ liệu tuyến tính' : language === 'ja' ? '線形データ構造' : language === 'ko' ? '선형 자료구조' : 'Linear data structures',
    'Non-linear data structures': language === 'vi' ? 'Cấu trúc dữ liệu phi tuyến tính' : language === 'ja' ? '非線形データ構造' : language === 'ko' ? '비선형 자료구조' : 'Non-linear data structures',
    'Optimization techniques': language === 'vi' ? 'Các kỹ thuật tối ưu hóa' : language === 'ja' ? '最適化手法' : language === 'ko' ? '최적화 기법' : 'Optimization techniques',
    'World wars and their impact': language === 'vi' ? 'Chiến tranh thế giới và tác động của chúng' : language === 'ja' ? '世界大戦とその影響' : language === 'ko' ? '세계 대전과 그 영향' : 'World wars and their impact',
    'East vs West geopolitics': language === 'vi' ? 'Địa chính trị Đông - Tây' : language === 'ja' ? '東西の地政学' : language === 'ko' ? '동서 지오폴리틱스' : 'East vs West geopolitics',
    'Post-Cold War world events': language === 'vi' ? 'Các sự kiện thế giới sau Chiến tranh lạnh' : language === 'ja' ? 'ポスト冷戦の世界情勢' : language === 'ko' ? '탈냉전 시대의 세계적 사건' : 'Post-Cold War world events',
    'Robot motion and control': language === 'vi' ? 'Chuyển động và điều khiển robot' : language === 'ja' ? 'ロボットの運動と制御' : language === 'ko' ? '로봇 모션 및 제어' : 'Robot motion and control',
    'Feedback and automation': language === 'vi' ? 'Phản hồi và tự động hóa' : language === 'ja' ? 'フィードバックと自動化' : language === 'ko' ? '피드백 및 자동화' : 'Feedback and automation',
  }
  return map[desc] ?? desc
}

// Helper to localize lesson titles
function getLocalizedLessonTitle(title: string, language: Language): string {
  const map: Record<string, string> = {
    'Introduction to Quantum Theory': language === 'vi' ? 'Giới thiệu về Thuyết Lượng tử' : language === 'ja' ? '量子論入門' : language === 'ko' ? '양자론 입문' : 'Introduction to Quantum Theory',
    'Wave-Particle Duality': language === 'vi' ? 'Lưỡng tính sóng-hạt' : language === 'ja' ? '波と粒子の二重性' : language === 'ko' ? '파동-입자 이중성' : 'Wave-Particle Duality',
    'Quantum States Quiz': language === 'vi' ? 'Trắc nghiệm Trạng thái lượng tử' : language === 'ja' ? '量子状態クイズ' : language === 'ko' ? '양자 상태 퀴즈' : 'Quantum States Quiz',
    "Schrödinger's Equation": language === 'vi' ? 'Phương trình Schrödinger' : language === 'ja' ? 'シュレーディンガー方程式' : language === 'ko' ? '슈뢰딩거 방정식' : "Schrödinger's Equation",
    'Quantum Entanglement': language === 'vi' ? 'Vướng víu Lượng tử' : language === 'ja' ? '量子もつれ' : language === 'ko' ? '양자 얽힘' : 'Quantum Entanglement',
    'Uncertainty Principle Practice': language === 'vi' ? 'Thực hành Nguyên lý bất định' : language === 'ja' ? '不確定性原理の練習' : language === 'ko' ? '불확정성 원리 연습' : 'Uncertainty Principle Practice',
    'Practice Quiz 1': language === 'vi' ? 'Bài trắc nghiệm thực hành 1' : language === 'ja' ? '練習クイズ1' : language === 'ko' ? '연습 퀴즈 1' : 'Practice Quiz 1',
    'Full Mock Examination': language === 'vi' ? 'Kỳ thi thử toàn diện' : language === 'ja' ? '総合模擬試験' : language === 'ko' ? '종합 모의고사' : 'Full Mock Examination',
    'Functional Groups Overview': language === 'vi' ? 'Tổng quan về Nhóm chức' : language === 'ja' ? '官能基の概要' : language === 'ko' ? '작용기 개요' : 'Functional Groups Overview',
    'Nomenclature Rules': language === 'vi' ? 'Quy tắc Danh pháp' : language === 'ja' ? '命名法規則' : language === 'ko' ? '명명법 규칙' : 'Nomenclature Rules',
    'Addition Reactions': language === 'vi' ? 'Phản ứng cộng' : language === 'ja' ? '付加反応' : language === 'ko' ? '첨가 반응' : 'Addition Reactions',
    'Substitution Mechanisms': language === 'vi' ? 'Cơ chế phản ứng thế' : language === 'ja' ? '置換反応機構' : language === 'ko' ? '치환 반응 메커니즘' : 'Substitution Mechanisms',
    'Multi-step Synthesis': language === 'vi' ? 'Tổng hợp nhiều bước' : language === 'ja' ? '多段階合成' : language === 'ko' ? '다단계 합성' : 'Multi-step Synthesis',
    'Synthesis Quiz': language === 'vi' ? 'Bài kiểm tra tổng hợp' : language === 'ja' ? '合成クイズ' : language === 'ko' ? '합성 퀴즈' : 'Synthesis Quiz',
    'Array Fundamentals': language === 'vi' ? 'Cơ bản về Mảng' : language === 'ja' ? '配列の基礎' : language === 'ko' ? '배열 기초' : 'Array Fundamentals',
    'Two Pointer Technique': language === 'vi' ? 'Kỹ thuật con trỏ kép' : language === 'ja' ? 'ツーポインタ手法' : language === 'ko' ? '투 포인터 기법' : 'Two Pointer Technique',
    'Binary Trees': language === 'vi' ? 'Cây nhị phân' : language === 'ja' ? '二分木' : language === 'ko' ? '이진 트리' : 'Binary Trees',
    'BFS & DFS Traversal': 'BFS & DFS Traversal',
    'DP Fundamentals': language === 'vi' ? 'Cơ bản về QHĐ' : language === 'ja' ? '動的計画法の基礎' : language === 'ko' ? '동적 계획법 기초' : 'DP Fundamentals',
    'Classic DP Problems': language === 'vi' ? 'Các bài toán QHĐ kinh điển' : language === 'ja' ? '古典的DP問題' : language === 'ko' ? '클래식 DP 문제' : 'Classic DP Problems',
    'Causes of WWI': language === 'vi' ? 'Nguyên nhân Thế chiến I' : language === 'ja' ? '第一次世界大戦の原因' : language === 'ko' ? '제1차 세계대전의 원인' : 'Causes of WWI',
    'WWII Major Battles': language === 'vi' ? 'Các trận đánh lớn Thế chiến II' : language === 'ja' ? '第二次世界大戦の主要な戦い' : language === 'ko' ? '제2차 세계대전의 주요 전투' : 'WWII Major Battles',
    'Cold War Origins': language === 'vi' ? 'Nguồn gốc Chiến tranh lạnh' : language === 'ja' ? '冷戦の起源' : language === 'ko' ? '냉전의 기원' : 'Cold War Origins',
    'Cuban Missile Crisis': language === 'vi' ? 'Khủng hoảng Tên lửa Cuba' : language === 'ja' ? 'キューバ危機' : language === 'ko' ? '쿠바 미사일 위기' : 'Cuban Missile Crisis',
    'Post-Cold War World': language === 'vi' ? 'Thế giới sau Chiến tranh lạnh' : language === 'ja' ? 'ポスト冷戦の世界' : language === 'ko' ? '탈냉전 시대의 세계' : 'Post-Cold War World',
    'Comprehensive Exam': language === 'vi' ? 'Kỳ thi toàn diện' : language === 'ja' ? '総合試験' : language === 'ko' ? '종합 시험' : 'Comprehensive Exam',
    'Forward Kinematics': language === 'vi' ? 'Động học thuận' : language === 'ja' ? '順運動学' : language === 'ko' ? '순기구학' : 'Forward Kinematics',
    'Inverse Kinematics': language === 'vi' ? 'Động học ngược' : language === 'ja' ? '逆運動学' : language === 'ko' ? '역기구학' : 'Inverse Kinematics',
    'PID Controllers': language === 'vi' ? 'Bộ điều khiển PID' : language === 'ja' ? 'PIDコントローラー' : language === 'ko' ? 'PID 제어기' : 'PID Controllers',
  }
  return map[title] ?? title
}

// ─── Lesson type icon ─────────────────────────────────────

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

export function CurriculumModal({ isOpen, onClose, onStart, plan }: Props) {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [highlightedModule] = useState<string | null>(null)
  const activeModuleRef = useRef<HTMLDivElement | null>(null)
  const addToast = useToastStore((s) => s.addToast)

  // Localize plan title
  const localizedTitle = useMemo(() => {
    if (!plan) return ''
    if (plan.id === '1') {
      return language === 'vi' ? 'Làm chủ Cơ học lượng tử' : language === 'ja' ? '量子力学マスター' : language === 'ko' ? '양자 역학 마스터' : plan.title
    } else if (plan.id === '2') {
      return language === 'vi' ? 'Nghiên cứu sâu Hóa hữu cơ' : language === 'ja' ? '有機化学の探求' : language === 'ko' ? '유기 화학 심층 탐구' : plan.title
    } else if (plan.id === '3') {
      return language === 'vi' ? 'Cấu trúc dữ liệu & Thuật toán' : language === 'ja' ? 'データ構造とアルゴリズム' : language === 'ko' ? '자료구조 및 알고리즘' : plan.title
    }
    return plan.title
  }, [plan, language])

  // Reset expanded module whenever a different plan is opened
  useEffect(() => {
    if (!plan) return
    const firstActive = plan.modules.find((m) =>
      m.lessons.some((l) => l.status !== 'completed')
    )
    setExpandedModule(firstActive?.id ?? plan.modules[0]?.id ?? null)
  }, [plan?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!plan) return null

  // ── Derived values ────────────────────────────────────────
  const allLessons = plan.modules.flatMap((m) => m.lessons)
  const completedCount = allLessons.filter((l) => l.status === 'completed').length
  const totalCount = allLessons.length

  const firstActiveModule = plan.modules.find((m) =>
    m.lessons.some((l) => l.status !== 'completed')
  )


  // ── Handlers ─────────────────────────────────────────────

  const handleStart = () => {
    if (!firstActiveModule) return
    const titleLocalized = getLocalizedModuleTitle(firstActiveModule.title, language)
    addToast(language === 'vi' ? `Bắt đầu học phần: ${titleLocalized}` : language === 'ja' ? `モジュールを開始：${titleLocalized}` : language === 'ko' ? `모듈 시작: ${titleLocalized}` : `Starting module: ${titleLocalized}`, 'success')
    if (onStart) onStart()
    else onClose()
  }

  const handleLessonClick = (lesson: CurriculumLesson) => {
    const titleLocalized = getLocalizedLessonTitle(lesson.title, language)
    if (lesson.status === 'locked') {
      addToast(language === 'vi' ? 'Bài học này đang khóa. Hãy hoàn thành bài trước.' : language === 'ja' ? 'このレッスンはロックされています。' : language === 'ko' ? '이 레슨은 잠겨 있습니다.' : 'This lesson is locked. Complete previous lessons first.', 'info')
      return
    }
    addToast(language === 'vi' ? `Đang mở bài học: ${titleLocalized}` : language === 'ja' ? `レッスンを開く：${titleLocalized}` : language === 'ko' ? `레슨 열기: ${titleLocalized}` : `Opening lesson: ${titleLocalized}`, 'success')
    if (onStart) onStart()
    else onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'vi' ? 'Lộ trình' : language === 'ja' ? 'カリキュラム' : language === 'ko' ? '커리큘럼' : 'Curriculum'}
      description={localizedTitle}
      className="max-w-2xl"
    >
      {/* ── Linked Reference Documents ── */}
      {plan.linkedDocs && plan.linkedDocs.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 dark:text-slate-500 flex items-center gap-1.5">
            <Link2 className="size-3.5 text-indigo-500 dark:text-indigo-400" />
            {language === 'vi' ? 'TÀI LIỆU LIÊN KẾT' : language === 'ja' ? '関連する参照ドキュメント' : language === 'ko' ? '연결된 참조 문서' : 'LINKED REFERENCE DOCUMENTS'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {plan.linkedDocs.map((docName, idx) => (
              <button
                key={idx}
                onClick={() => {
                  addToast(
                    language === 'vi'
                      ? `Đang mở tài liệu chi tiết: ${docName}`
                      : `Opening document details: ${docName}`,
                    'info'
                  )
                  onClose()
                  navigate(`/dashboard/documents/document/${getDocumentIdByName(docName)}`)
                }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/40 border border-indigo-100/50 dark:border-indigo-900/30 text-[11px] font-semibold text-indigo-650 dark:text-indigo-400 cursor-pointer transition-colors"
              >
                {docName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Overview stats ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: BookOpen, label: language === 'vi' ? 'Học phần' : language === 'ja' ? 'モジュール' : language === 'ko' ? '모듈' : 'Modules', value: String(plan.modules.length), color: 'text-[#2557E8] bg-[#e5eeff]' },
          { icon: Link2, label: language === 'vi' ? 'Bài học' : language === 'ja' ? 'レッスン' : language === 'ko' ? '레슨' : 'Lessons', value: `${completedCount}/${totalCount}`, color: 'text-emerald-700 bg-emerald-50' },
          { icon: Clock, label: language === 'vi' ? 'Giờ ước tính' : language === 'ja' ? '予測時間' : language === 'ko' ? '예상 시간' : 'Est. Time', value: `${plan.hoursEst}h`, color: 'text-amber-700 bg-amber-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="size-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{value}</p>
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
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
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
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{getLocalizedModuleTitle(mod.title, language)}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{done}/{mod.lessons.length}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{getLocalizedModuleDesc(mod.description, language)}</p>
                  {/* Module progress bar */}
                  <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
                <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {mod.lessons.map((lesson) => {
                    const isLocked = lesson.status === 'locked'
                    const localizedDuration = lesson.duration
                      ? lesson.duration.replace('min', language === 'vi' ? 'phút' : language === 'ja' ? '分' : language === 'ko' ? '분' : 'min')
                      : ''

                    return (
                      <div
                        key={lesson.id}
                        className={`w-full flex items-center text-left gap-3 px-4 py-2.5 transition-colors ${isLocked
                          ? 'opacity-40 bg-slate-50/50'
                          : 'hover:bg-slate-50/70'
                          }`}
                      >
                        <StatusIcon status={lesson.status} />
                        <LessonTypeIcon type={lesson.type} />
                        <span className={`flex-1 text-sm ${lesson.status === 'completed'
                          ? 'text-slate-400 line-through'
                          : 'text-slate-700 font-medium'
                          }`}>
                          <div 
                            className={isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:text-indigo-600'}
                            onClick={() => !isLocked && handleLessonClick(lesson)}
                          >
                            {getLocalizedLessonTitle(lesson.title, language)}
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
                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 flex items-center gap-1 cursor-pointer font-normal"
                            >
                              <span>📖 Tài liệu: {lesson.linkedDocName}</span>
                              {lesson.pageRange && <span className="text-[11px] text-slate-450 dark:text-slate-500">({lesson.pageRange})</span>}
                            </div>
                          )}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Clock className="size-3 text-slate-400 dark:text-slate-500" />
                          <span className="text-xs text-slate-400 dark:text-slate-500">{localizedDuration}</span>
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
      <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button variant="ghost" onClick={onClose}>{t.common.close}</Button>
        {completedCount === totalCount ? (
          <Button
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white"
            onClick={onClose}
          >
            {language === 'vi' ? '🎉 Hoàn tất lộ trình!' : language === 'ja' ? '🎉 カリキュラム完了！' : language === 'ko' ? '🎉 커리큘럼 완료!' : '🎉 Curriculum Complete!'}
          </Button>
        ) : (
          <Button
            variant="primary"
            className="bg-[#2557E8] hover:bg-[#1d4ed8] dark:bg-blue-600 dark:hover:bg-blue-500 text-white"
            onClick={handleStart}
          >
            {firstActiveModule 
              ? (language === 'vi' ? 'Bắt đầu học' : language === 'ja' ? '学習を開始' : language === 'ko' ? '학습 시작' : 'Start Learning')
              : (language === 'vi' ? 'Xem lại tất cả' : language === 'ja' ? 'すべて復習' : language === 'ko' ? '모두 복습' : 'Review All')}
          </Button>
        )}
      </div>
    </Modal>
  )
}
