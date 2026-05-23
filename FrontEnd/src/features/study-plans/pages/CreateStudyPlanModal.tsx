import { useEffect, useState, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BrainCircuit, Loader2 } from 'lucide-react'

import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Radio } from '@/components/ui/Radio'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'
import { Language } from '@/locales'

// ─── Types ──────────────────────────────────────────────

type StudyPlanFormValues = {
  title:       string
  subject:     string
  description: string
  startDate:   string
  endDate:     string
  priority:    'Low' | 'Medium' | 'High'
  schedule:    string[]
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// AI suggestion templates per subject (raw English suggestions, mapped on request)
const AI_SUGGESTIONS: Record<string, { title: string; description: string; schedule: string[] }> = {
  Mathematics:      { title: 'Mathematics Mastery Plan',      description: 'Structured approach to master calculus, algebra, and statistics from fundamentals to advanced topics.',      schedule: ['Mon', 'Wed', 'Fri'] },
  Physics:          { title: 'Physics Deep Dive',             description: 'Comprehensive study of mechanics, thermodynamics, electromagnetism, and modern physics.',                    schedule: ['Tue', 'Thu', 'Sat'] },
  'Computer Science': { title: 'CS & Algorithms Bootcamp',   description: 'From data structures to system design — crack technical interviews and build solid CS foundations.',          schedule: ['Mon', 'Tue', 'Thu', 'Fri'] },
  Literature:       { title: 'Literature Analysis Journey',   description: 'Explore classic and modern literature through close reading, critical analysis, and essay writing practice.', schedule: ['Wed', 'Sat', 'Sun'] },
  Chemistry:        { title: 'Chemistry Complete Guide',      description: 'Master organic and inorganic chemistry with lab practicals, reaction mechanisms, and exam preparation.',       schedule: ['Mon', 'Wed', 'Fri'] },
  Biology:          { title: 'Biology Systems Mastery',       description: 'Comprehensive coverage of cell biology, genetics, ecology, and human physiology with diagram practice.',       schedule: ['Tue', 'Thu', 'Sat'] },
}

// ─── Props ───────────────────────────────────────────────

interface CreateStudyPlanModalProps {
  isOpen:   boolean
  onClose:  () => void
}

// ─── Component ───────────────────────────────────────────

export const CreateStudyPlanModal = ({ isOpen, onClose }: CreateStudyPlanModalProps) => {
  const { t, language } = useTranslation()
  const [isGenerating, setIsGenerating] = useState(false)

  // Memoize Zod Schema based on language translations
  const studyPlanSchema = useMemo(() => {
    return z
      .object({
        title: z.string().min(1, language === 'vi' ? 'Tiêu đề là bắt buộc' : language === 'ja' ? 'タイトルは必須です' : language === 'ko' ? '제목은 필수입니다' : 'Title is required'),
        subject: z.string().min(1, language === 'vi' ? 'Môn học là bắt buộc' : language === 'ja' ? '科目は必須です' : language === 'ko' ? '과목은 필수입니다' : 'Subject is required'),
        description: z.string().optional(),
        startDate: z.string().min(1, language === 'vi' ? 'Ngày bắt đầu là bắt buộc' : language === 'ja' ? '開始日は必須です' : language === 'ko' ? '시작일은 필수입니다' : 'Start date is required'),
        endDate: z.string().min(1, language === 'vi' ? 'Ngày kết thúc là bắt buộc' : language === 'ja' ? '終了日は必須です' : language === 'ko' ? '종료일은 필수입니다' : 'End date is required'),
        priority: z.enum(['Low', 'Medium', 'High']),
        schedule: z.array(z.string()).min(1, language === 'vi' ? 'Chọn ít nhất một ngày' : language === 'ja' ? '少なくとも1日を選択してください' : language === 'ko' ? '최소 하루 이상 선택하세요' : 'Select at least one day'),
      })
      .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
        message: language === 'vi' ? 'Ngày kết thúc phải sau ngày bắt đầu' : language === 'ja' ? '終了日は開始日より後である必要があります' : language === 'ko' ? '종료일은 시작일 이후여야 합니다' : 'End date must be after start date',
        path: ['endDate'],
      })
  }, [language])

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StudyPlanFormValues>({
    resolver: zodResolver(studyPlanSchema),
    defaultValues: {
      title:       '',
      subject:     'Mathematics',
      description: '',
      startDate:   '',
      endDate:     '',
      priority:    'High',
      schedule:    [],
    },
  })

  // Reset form whenever the modal opens fresh
  useEffect(() => {
    if (isOpen) {
      reset({
        title: '', subject: 'Mathematics', description: '',
        startDate: '', endDate: '', priority: 'High', schedule: [],
      })
    }
  }, [isOpen, reset])

  const currentSubject = watch('subject')

  // Localize AI suggestion outputs
  const getLocalizedSuggestion = (sub: string) => {
    const raw = AI_SUGGESTIONS[sub] ?? AI_SUGGESTIONS['Mathematics']
    if (language === 'vi') {
      const suggestionsVI: Record<string, { title: string; description: string }> = {
        Mathematics: { title: 'Kế hoạch Làm chủ Toán học', description: 'Cách tiếp cận cấu trúc để thành thạo giải tích, đại số và thống kê từ cơ bản đến nâng cao.' },
        Physics: { title: 'Nghiên cứu Vật lý Chuyên sâu', description: 'Nghiên cứu toàn diện về cơ học, nhiệt động lực học, điện từ học và vật lý hiện đại.' },
        'Computer Science': { title: 'Bootcamp Khoa học Máy tính & Thuật toán', description: 'Từ cấu trúc dữ liệu đến thiết kế hệ thống — chinh phục phỏng vấn kỹ thuật và xây dựng nền tảng vững chắc.' },
        Literature: { title: 'Hành trình Phân tích Văn học', description: 'Khám phá văn học cổ điển và hiện đại thông qua đọc hiểu sâu sắc, phân tích phản biện và thực hành viết tiểu luận.' },
        Chemistry: { title: 'Hướng dẫn Hóa học Toàn diện', description: 'Làm chủ hóa học hữu cơ và vô cơ với thực hành phòng thí nghiệm, cơ chế phản ứng và chuẩn bị thi cử.' },
        Biology: { title: 'Làm chủ Hệ thống Sinh học', description: 'Bao quát toàn diện sinh học tế bào, di truyền học, sinh thái học và sinh lý học người kèm thực hành vẽ sơ đồ.' }
      }
      return { ...raw, ...suggestionsVI[sub] }
    }
    if (language === 'ja') {
      const suggestionsJA: Record<string, { title: string; description: string }> = {
        Mathematics: { title: '数学マスター計画', description: '基礎から応用まで、微積分、代数、統計をマスターするための構造化されたアプローチ。' },
        Physics: { title: '物理学徹底探求', description: '力学、熱力学、電磁気学、そして現代物理学の包括的な学習。' },
        'Computer Science': { title: 'CS＆アルゴリズムブートキャンプ', description: 'データ構造からシステム設計まで — 技術面接を突破し、強固なCS基盤を構築。' },
        Literature: { title: '文学分析の旅', description: '精読、批判的分析、エッセイ執筆練習を通じて、古典文学と現代文学を探求。' },
        Chemistry: { title: '化学完全ガイド', description: '実験実習、反応機構、試験対策を通じて、有機化学と無機化学をマスター。' },
        Biology: { title: '生物システム習得計画', description: '図の練習を交えながら、細胞生物学、遺伝学、生態学、人体の生理学を包括的にカバー。' }
      }
      return { ...raw, ...suggestionsJA[sub] }
    }
    if (language === 'ko') {
      const suggestionsKO: Record<string, { title: string; description: string }> = {
        Mathematics: { title: '수학 마스터 계획', description: '기초부터 고급까지 미적분학, 대수학, 통계학을 마스터하기 위한 구조화된 접근법.' },
        Physics: { title: '물리학 심층 탐구', description: '역학, 열역학, 전자기학 및 현대 물리학에 대한 포괄적인 학습.' },
        'Computer Science': { title: 'CS 및 알고리즘 부트캠프', description: '자료구조부터 시스템 설계까지 — 기술 면접을 통과하고 탄탄한 CS 기반을 구축.' },
        Literature: { title: '문학 분석 여정', description: '정독, 비판적 분석, 에세이 작성 연습을 통해 고전 및 현대 문학을 탐구.' },
        Chemistry: { title: '화학 완전 가이드', description: '실험 실습, 반응 메커니즘 및 시험 준비와 함께 유기 및 무기 화학 마스터.' },
        Biology: { title: '생물학 시스템 마스터', description: '그림 연습과 함께 세포 생물학, 유전학, 생태학 및 인체 생리학의 포괄적인 범위 학습.' }
      }
      return { ...raw, ...suggestionsKO[sub] }
    }
    return raw
  }

  // ── Generate with AI ─────────────────────────────────
  const handleGenerateAI = async () => {
    setIsGenerating(true)
    // Simulate AI generation delay
    await new Promise((r) => setTimeout(r, 1200))

    const suggestion = getLocalizedSuggestion(currentSubject)
    if (suggestion.title)       setValue('title', suggestion.title, { shouldValidate: true })
    if (suggestion.description) setValue('description', suggestion.description, { shouldValidate: true })
    if (suggestion.schedule)    setValue('schedule', suggestion.schedule, { shouldValidate: true })
    setValue('priority', 'High')

    // Set start date to today, end date to +30 days
    const today = new Date()
    const endDay = new Date(today)
    endDay.setDate(today.getDate() + 30)
    setValue('startDate', today.toISOString().split('T')[0], { shouldValidate: true })
    setValue('endDate',   endDay.toISOString().split('T')[0],  { shouldValidate: true })

    setIsGenerating(false)
  }

  // ── Submit ───────────────────────────────────────────
  const onSubmit = (data: StudyPlanFormValues) => {
    console.log('Create Study Plan:', data)
    reset()
    onClose()
  }

  // ── Save as Draft ────────────────────────────────────
  const handleSaveDraft = () => {
    const values = watch()
    console.log('Saved as draft:', values)
    localStorage.setItem('studyPlanDraft', JSON.stringify(values))
    onClose()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const getDayLabel = (day: string) => {
    switch (day) {
      case 'Mon': return language === 'vi' ? 'T2' : language === 'ja' ? '月' : language === 'ko' ? '월' : 'Mon'
      case 'Tue': return language === 'vi' ? 'T3' : language === 'ja' ? '火' : language === 'ko' ? '화' : 'Tue'
      case 'Wed': return language === 'vi' ? 'T4' : language === 'ja' ? '水' : language === 'ko' ? '수' : 'Wed'
      case 'Thu': return language === 'vi' ? 'T5' : language === 'ja' ? '木' : language === 'ko' ? '목' : 'Thu'
      case 'Fri': return language === 'vi' ? 'T6' : language === 'ja' ? '金' : language === 'ko' ? '금' : 'Fri'
      case 'Sat': return language === 'vi' ? 'T7' : language === 'ja' ? '土' : language === 'ko' ? '토' : 'Sat'
      case 'Sun': return language === 'vi' ? 'CN' : language === 'ja' ? '日' : language === 'ko' ? '일' : 'Sun'
      default: return day
    }
  }

  const getPriorityLabel = (level: string) => {
    switch (level) {
      case 'Low': return language === 'vi' ? 'Thấp' : language === 'ja' ? '低' : language === 'ko' ? '낮음' : 'Low'
      case 'Medium': return language === 'vi' ? 'Trung bình' : language === 'ja' ? '中' : language === 'ko' ? '보통' : 'Medium'
      case 'High': return language === 'vi' ? 'Cao' : language === 'ja' ? '高' : language === 'ko' ? '높음' : 'High'
      default: return level
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={language === 'vi' ? 'Tạo kế hoạch học tập mới' : language === 'ja' ? '新しい学習計画の作成' : language === 'ko' ? '새 학습 계획 생성' : 'Create New Study Plan'}
      description={language === 'vi' ? 'Sắp xếp mục tiêu học tập và theo dõi tiến độ của bạn.' : language === 'ja' ? '学習目標を整理し、進捗状況を追跡します。' : language === 'ko' ? '학습 목표를 정리하고 진척도를 추적하세요.' : 'Organize your learning goals and track your progress.'}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Title ── */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {language === 'vi' ? 'Tiêu đề kế hoạch' : language === 'ja' ? '学習計画のタイトル' : language === 'ko' ? '학습 계획 제목' : 'Study Plan Title'} <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder={language === 'vi' ? 'Ví dụ: Ôn tập tuần thi cuối kỳ' : language === 'ja' ? '例：期末試験対策' : language === 'ko' ? '예: 기말고사 대비 공부' : 'e.g. Finals Week Preparation'}
            {...register('title')}
            error={errors.title?.message}
          />
        </div>

        {/* ── Subject ── */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {language === 'vi' ? 'Môn học' : language === 'ja' ? '科目' : language === 'ko' ? '과목' : 'Subject'} <span className="text-red-500">*</span>
          </label>
          <Select {...register('subject')} error={errors.subject?.message}>
            <option value="Mathematics">{t.myDocuments.math}</option>
            <option value="Physics">{language === 'vi' ? 'Vật lý' : language === 'ja' ? '物理学' : language === 'ko' ? '물리학' : 'Physics'}</option>
            <option value="Computer Science">{t.myDocuments.compsci}</option>
            <option value="Literature">{t.myDocuments.literature || 'Literature'}</option>
            <option value="Chemistry">{language === 'vi' ? 'Hóa học' : language === 'ja' ? '化学' : language === 'ko' ? '화학' : 'Chemistry'}</option>
            <option value="Biology">{t.myDocuments.bio || 'Biology'}</option>
          </Select>
        </div>

        {/* ── Description ── */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {language === 'vi' ? 'Mục tiêu / Mô tả' : language === 'ja' ? '目標 / 説明' : language === 'ko' ? '목표 / 상세 설명' : 'Goal / Description'}
          </label>
          <Textarea
            placeholder={language === 'vi' ? 'Bạn muốn đạt được điều gì với kế hoạch học tập này?' : language === 'ja' ? 'この学習計画で何を達成したいですか？' : language === 'ko' ? '이 학습 계획을 통해 무엇을 달성하고 싶으신가요?' : 'What do you want to achieve with this study plan?'}
            {...register('description')}
            error={errors.description?.message}
          />
        </div>

        {/* ── Dates ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {language === 'vi' ? 'Ngày bắt đầu' : language === 'ja' ? '開始日' : language === 'ko' ? '시작일' : 'Start Date'} <span className="text-red-500">*</span>
            </label>
            <Input type="date" {...register('startDate')} error={errors.startDate?.message} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {language === 'vi' ? 'Ngày kết thúc' : language === 'ja' ? '終了日' : language === 'ko' ? '종료일' : 'End Date'} <span className="text-red-500">*</span>
            </label>
            <Input type="date" {...register('endDate')} error={errors.endDate?.message} />
          </div>
        </div>

        {/* ── Priority ── */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {language === 'vi' ? 'Độ ưu tiên' : language === 'ja' ? '優先度' : language === 'ko' ? '우선순위' : 'Priority'}
          </label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <div className="flex items-center gap-6">
                {(['Low', 'Medium', 'High'] as const).map((level) => (
                  <Radio
                    key={level}
                    label={getPriorityLabel(level)}
                    value={level}
                    checked={field.value === level}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                ))}
              </div>
            )}
          />
          {errors.priority && <p className="text-sm text-red-500">{errors.priority.message}</p>}
        </div>

        {/* ── Study Schedule ── */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {language === 'vi' ? 'Lịch học tập' : language === 'ja' ? '学習スケジュール' : language === 'ko' ? '학습 일정' : 'Study Schedule'} <span className="text-red-500">*</span>
          </label>
          <Controller
            control={control}
            name="schedule"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const isSelected = field.value.includes(day)
                  return (
                    <label
                      key={day}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150 select-none',
                        isSelected
                          ? 'border-[#2557E8] bg-[#eef2ff] text-[#2557E8] dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:border-slate-700'
                      )}
                    >
                      <input
                        type="checkbox"
                        value={day}
                        className="sr-only"
                        checked={isSelected}
                        onChange={(e) => {
                          field.onChange(
                            e.target.checked
                              ? [...field.value, day]
                              : field.value.filter((v: string) => v !== day)
                          )
                        }}
                      />
                      <div
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border transition-colors shrink-0',
                          isSelected ? 'border-[#2557E8] bg-[#2557E8] text-white dark:border-blue-600 dark:bg-blue-600' : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
                        )}
                      >
                        {isSelected && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      {getDayLabel(day)}
                    </label>
                  )
                })}
              </div>
            )}
          />
          {errors.schedule && <p className="text-sm text-red-500">{errors.schedule.message}</p>}
        </div>

        {/* ── AI Suggestion Box ── */}
        <div className="flex items-start gap-4 rounded-xl bg-[#eef2ff] dark:bg-blue-950/20 border border-[#c7d2fe] dark:border-blue-900 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-900 text-[#2557E8] dark:text-blue-400 shadow-sm">
            {isGenerating
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : <BrainCircuit className="h-5 w-5" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-[#2557E8] dark:text-blue-400">
              {language === 'vi' ? 'Đề xuất Học tập bằng AI' : language === 'ja' ? 'AI学習提案' : language === 'ko' ? 'AI 학습 추천' : 'AI Study Suggestion'}
            </h4>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
              {isGenerating
                ? (language === 'vi' ? `Đang tạo kế hoạch thông minh cho môn ${t.myDocuments[currentSubject.toLowerCase() as any] || currentSubject}...` : language === 'ja' ? `科目のスマートな計画を生成中...` : language === 'ko' ? `과목에 대한 스마트 계획 생성 중...` : `Generating a smart plan for ${currentSubject}...`)
                : (language === 'vi' ? 'Hãy để AI giúp bạn thiết lập thời gian học tập thông minh dựa trên hạn chót và môn học.' : language === 'ja' ? '期限や科目に基づいて、AIがスマートな学習スケジュールの作成をサポートします。' : language === 'ko' ? '마감일과 과목을 기반으로 AI가 스마트한 학습 일정을 수립하도록 도와드립니다.' : 'Let AI help you create a smart study schedule based on your deadline and subject.')}
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="shrink-0 mt-1 bg-[#2557E8] hover:bg-[#1d4ed8] dark:bg-blue-600 dark:hover:bg-blue-500 text-white"
            onClick={handleGenerateAI}
            disabled={isGenerating}
          >
            {isGenerating 
              ? (language === 'vi' ? 'Đang tạo...' : language === 'ja' ? '生成中...' : language === 'ko' ? '생성 중...' : 'Generating...') 
              : (language === 'vi' ? 'Tạo với AI' : language === 'ja' ? 'AIで生成' : language === 'ko' ? 'AI로 생성' : 'Generate with AI')}
          </Button>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={handleClose}>
            {t.common.cancel}
          </Button>
          <Button type="button" variant="secondary" onClick={handleSaveDraft}>
            {language === 'vi' ? 'Lưu bản nháp' : language === 'ja' ? '下書き保存' : language === 'ko' ? '임시 저장' : 'Save as Draft'}
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="bg-[#2557E8] hover:bg-[#1d4ed8] dark:bg-blue-600 dark:hover:bg-blue-500 text-white"
            disabled={isSubmitting}
          >
            {t.studyPlans.createPlan}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
