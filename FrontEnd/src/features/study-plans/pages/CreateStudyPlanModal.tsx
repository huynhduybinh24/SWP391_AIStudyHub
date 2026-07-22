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
import { useAuthStore } from '@/stores/authStore'
import { aiService } from '@/services/aiService'
import { documentService } from '@/services/documentService'
import { toast } from '@/components/ui/Toast'
import type { StudyPlan } from './StudyPlansPage'

// ─── Types & Constants ──────────────────────────────────────────

export interface CreateStudyPlanModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate?: (newPlan: StudyPlan) => void
  onUpdate?: (updatedPlan: StudyPlan) => void
  editingPlan?: StudyPlan | null
  preselectedDocId?: string | null
  autoGenerate?: boolean
}

const AI_SUGGESTIONS: Record<string, { title: string; description: string }> = {
  Mathematics: { title: 'Mathematics Mastery Plan', description: 'A structured approach to mastering calculus, algebra, and statistics from basics to advanced topics.' },
  Physics: { title: 'Physics Deep Dive', description: 'Comprehensive study covering mechanics, thermodynamics, electromagnetism, and modern physics.' },
  'Computer Science': { title: 'CS & Algorithms Bootcamp', description: 'From data structures to system design — conquer technical interviews and build solid CS foundations.' },
  Literature: { title: 'Literature Analysis Journey', description: 'Exploring classic and modern literature through close reading, critical analysis, and essay practice.' },
  Chemistry: { title: 'Comprehensive Chemistry Guide', description: 'Mastering organic and inorganic chemistry with lab practice, reaction mechanisms, and exam prep.' },
  Biology: { title: 'Biological Systems Mastery', description: 'Complete coverage of cell biology, genetics, ecology, and human physiology with diagram practice.' }
}

export type SemesterKey = 'ALL' | 'K1' | 'K2' | 'K3' | 'K4' | 'K5' | 'K6' | 'K7' | 'K8' | 'K9'

export const MAJORS = [
  { key: 'SE', labelVI: 'Kỹ thuật phần mềm (SE)', labelEN: 'Software Engineering (SE)' },
  { key: 'AI', labelVI: 'Trí tuệ nhân tạo (AI)', labelEN: 'Artificial Intelligence (AI)' },
  { key: 'IA', labelVI: 'An toàn thông tin (IA)', labelEN: 'Information Assurance (IA)' },
  { key: 'GD', labelVI: 'Thiết kế đồ họa (GD)', labelEN: 'Graphic Design (GD)' },
  { key: 'BA', labelVI: 'Quản trị kinh doanh (BA)', labelEN: 'Business Administration (BA)' },
  { key: 'IB', labelVI: 'Kinh doanh quốc tế (IB)', labelEN: 'International Business (IB)' },
  { key: 'DM', labelVI: 'Digital Marketing (DM)', labelEN: 'Digital Marketing (DM)' },
  { key: 'LANG', labelVI: 'Ngôn ngữ Anh/Nhật/Hàn', labelEN: 'English/Japanese/Korean Languages' },
]

type StudyPlanFormValues = {
  title:       string
  major?:      string
  semester?:   SemesterKey
  subject:     string
  description?: string
  startDate:   string
  endDate:     string
  priority:    'Low' | 'Medium' | 'High'
  schedule:    string[]
  selectedDocIds?: string[]
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const SEMESTERS: { key: SemesterKey; labelVI: string; labelEN: string }[] = [
  { key: 'ALL', labelVI: 'Tất cả học kỳ', labelEN: 'All Semesters' },
  { key: 'K1', labelVI: 'Học kỳ 1 (K1)', labelEN: 'Semester 1 (K1)' },
  { key: 'K2', labelVI: 'Học kỳ 2 (K2)', labelEN: 'Semester 2 (K2)' },
  { key: 'K3', labelVI: 'Học kỳ 3 (K3)', labelEN: 'Semester 3 (K3)' },
  { key: 'K4', labelVI: 'Học kỳ 4 (K4)', labelEN: 'Semester 4 (K4)' },
  { key: 'K5', labelVI: 'Học kỳ 5 (K5)', labelEN: 'Semester 5 (K5)' },
  { key: 'K6', labelVI: 'Học kỳ 6 (K6)', labelEN: 'Semester 6 (K6)' },
  { key: 'K7', labelVI: 'Học kỳ 7 (K7)', labelEN: 'Semester 7 (K7)' },
  { key: 'K8', labelVI: 'Học kỳ 8 (K8)', labelEN: 'Semester 8 (K8)' },
  { key: 'K9', labelVI: 'Học kỳ 9 (K9)', labelEN: 'Semester 9 (K9)' },
]

export interface SubjectOption {
  code: string
  title: string
  semester: SemesterKey
}

export const ALL_SUBJECTS: SubjectOption[] = [
  // Semester 1
  { code: 'PRF192', title: 'Programming Fundamentals (PRF192)', semester: 'K1' },
  { code: 'MAE101', title: 'Mathematics for Engineering (MAE101)', semester: 'K1' },
  { code: 'CEA201', title: 'Computer Organization (CEA201)', semester: 'K1' },
  { code: 'CSI104', title: 'Introduction to Computer Science (CSI104)', semester: 'K1' },
  { code: 'MGT103', title: 'Introduction to Management (MGT103)', semester: 'K1' },
  { code: 'ECO111', title: 'Microeconomics (ECO111)', semester: 'K1' },
  { code: 'FMA101', title: 'Financial Mathematics (FMA101)', semester: 'K1' },

  // Semester 2
  { code: 'PRO192', title: 'Object-Oriented Programming (PRO192)', semester: 'K2' },
  { code: 'MAD101', title: 'Discrete Mathematics (MAD101)', semester: 'K2' },
  { code: 'OSG202', title: 'Operating Systems (OSG202)', semester: 'K2' },
  { code: 'SSG104', title: 'Communication Skills (SSG104)', semester: 'K2' },
  { code: 'MKT101', title: 'Basic Marketing (MKT101)', semester: 'K2' },
  { code: 'ECO121', title: 'Macroeconomics (ECO121)', semester: 'K2' },
  { code: 'AMG111', title: 'Art Management (AMG111)', semester: 'K2' },

  // Semester 3
  { code: 'CSD201', title: 'Data Structures & Algorithms (CSD201)', semester: 'K3' },
  { code: 'DBI202', title: 'Database Systems (DBI202)', semester: 'K3' },
  { code: 'LAB211', title: 'OOP Java Lab (LAB211)', semester: 'K3' },
  { code: 'AIL302M', title: 'Machine Learning (AIL302m)', semester: 'K3' },
  { code: 'ACC101', title: 'Principles of Accounting (ACC101)', semester: 'K3' },
  { code: 'FIN201', title: 'Corporate Finance (FIN201)', semester: 'K3' },
  { code: 'BUL201', title: 'Business Law (BUL201)', semester: 'K3' },

  // Semester 4
  { code: 'PRN211', title: 'Basic Cross-Platform .NET (PRN211)', semester: 'K4' },
  { code: 'SWE201', title: 'Software Engineering (SWE201)', semester: 'K4' },
  { code: 'JPD113', title: 'Japanese Language 1 (JPD113)', semester: 'K4' },
  { code: 'AIP301', title: 'Artificial Intelligence Project (AIP301)', semester: 'K4' },
  { code: 'MTH202', title: 'Probability & Statistics (MTH202)', semester: 'K4' },
  { code: 'HRM201', title: 'Human Resource Management (HRM201)', semester: 'K4' },
  { code: 'OBH201', title: 'Organizational Behavior (OBH201)', semester: 'K4' },
  { code: 'MRF301', title: 'Marketing Research (MRF301)', semester: 'K4' },

  // Semester 5
  { code: 'SWP391', title: 'Software Development Project (SWP391)', semester: 'K5' },
  { code: 'SWD392', title: 'Software Architecture & Design (SWD392)', semester: 'K5' },
  { code: 'SWT301', title: 'Software Testing (SWT301)', semester: 'K5' },
  { code: 'DLN301', title: 'Deep Learning (DLN301)', semester: 'K5' },
  { code: 'BIS301', title: 'Business Information Systems (BIS301)', semester: 'K5' },
  { code: 'ENT301', title: 'Entrepreneurship (ENT301)', semester: 'K5' },
  { code: 'POM201', title: 'Production & Operations Management (POM201)', semester: 'K5' },

  // Semester 6
  { code: 'OJT202', title: 'On-the-Job Training (OJT202)', semester: 'K6' },

  // Semester 7
  { code: 'PRM392', title: 'Mobile Programming (PRM392)', semester: 'K7' },
  { code: 'PRN221', title: 'Advanced .NET Application (PRN221)', semester: 'K7' },
  { code: 'WDP301', title: 'Web Development Project (WDP301)', semester: 'K7' },
  { code: 'NLP301', title: 'Natural Language Processing (NLP301)', semester: 'K7' },
  { code: 'CVP301', title: 'Computer Vision Project (CVP301)', semester: 'K7' },
  { code: 'IBM301', title: 'International Business Management (IBM301)', semester: 'K7' },
  { code: 'SCM301', title: 'Supply Chain Management (SCM301)', semester: 'K7' },
  { code: 'BRM301', title: 'Business Research Methods (BRM301)', semester: 'K7' },

  // Semester 8
  { code: 'SEP490', title: 'Capstone Project Prep - SE (SEP490)', semester: 'K8' },
  { code: 'CAP490', title: 'Capstone Project Prep - AI (CAP490)', semester: 'K8' },
  { code: 'BAP490', title: 'Capstone Project Prep - BA (BAP490)', semester: 'K8' },
  { code: 'EXE101', title: 'Experiential Entrepreneurship 1 (EXE101)', semester: 'K8' },
  { code: 'IAS301', title: 'Information Assurance & Security (IAS301)', semester: 'K8' },
  { code: 'BDA301', title: 'Big Data Analytics (BDA301)', semester: 'K8' },
  { code: 'SMA301', title: 'Strategic Management (SMA301)', semester: 'K8' },

  // Semester 9
  { code: 'SEP490_DEF', title: 'Capstone Graduation - SE (SEP490)', semester: 'K9' },
  { code: 'CAP490_DEF', title: 'Capstone Graduation - AI (CAP490)', semester: 'K9' },
  { code: 'BAP490_DEF', title: 'Capstone Graduation - BA (BAP490)', semester: 'K9' },
  { code: 'EXE201', title: 'Experiential Entrepreneurship 2 (EXE201)', semester: 'K9' },
  { code: 'PMG201', title: 'Project Management (PMG201)', semester: 'K9' },
  { code: 'EBU301', title: 'E-Business (EBU301)', semester: 'K9' },
]

function detectSubjectFromDocName(name: string): { code: string; semester: SemesterKey } | null {
  const lower = name.toLowerCase()
  for (const subj of ALL_SUBJECTS) {
    if (lower.includes(subj.code.toLowerCase())) {
      return { code: subj.code, semester: subj.semester }
    }
  }
  // Software Testing & QA
  if (lower.includes('test') || lower.includes('smell') || lower.includes('qa') || lower.includes('unit') || lower.includes('automation')) {
    return { code: 'SWT301', semester: 'K5' }
  }
  // Software Architecture & Design / Use cases / Diagrams
  if (lower.includes('use case') || lower.includes('diagram') || lower.includes('uml') || lower.includes('spec') || lower.includes('design') || lower.includes('architecture')) {
    return { code: 'SWD392', semester: 'K5' }
  }
  // Software Development Project / Java / Web / Code
  if (lower.includes('swp') || lower.includes('state diagram') || lower.includes('dfd') || lower.includes('java') || lower.includes('software project') || lower.includes('du an')) {
    return { code: 'SWP391', semester: 'K5' }
  }
  // Software Engineering Basics
  if (lower.includes('swe') || lower.includes('software engineering') || lower.includes('kỹ thuật phần mềm')) {
    return { code: 'SWE201', semester: 'K4' }
  }
  // Math & Statistics
  if (lower.includes('math') || lower.includes('calculus') || lower.includes('algebra') || lower.includes('toán') || lower.includes('giai tich')) {
    return { code: 'MAE101', semester: 'K1' }
  }
  if (lower.includes('mth') || lower.includes('prob') || lower.includes('stat') || lower.includes('thống kê') || lower.includes('xác suất')) {
    return { code: 'MTH202', semester: 'K4' }
  }
  // Operating Systems / Physics
  if (lower.includes('physic') || lower.includes('vật lý') || lower.includes('vật ly') || lower.includes('osg') || lower.includes('operating')) {
    return { code: 'OSG202', semester: 'K2' }
  }
  // Programming & OOP
  if (lower.includes('prf') || lower.includes('c prog') || lower.includes('lap trinh c') || lower.includes('fundamental')) {
    return { code: 'PRF192', semester: 'K1' }
  }
  if (lower.includes('pro') || lower.includes('oop') || lower.includes('object')) {
    return { code: 'PRO192', semester: 'K2' }
  }
  // Data Structures & Algorithms
  if (lower.includes('csd') || lower.includes('data structure') || lower.includes('cấu trúc dữ liệu') || lower.includes('dsa') || lower.includes('algorithm')) {
    return { code: 'CSD201', semester: 'K3' }
  }
  // Database Systems
  if (lower.includes('dbi') || lower.includes('database') || lower.includes('sql') || lower.includes('cơ sở dữ liệu')) {
    return { code: 'DBI202', semester: 'K3' }
  }
  // .NET & C#
  if (lower.includes('prn') || lower.includes('.net') || lower.includes('c#')) {
    return { code: 'PRN211', semester: 'K4' }
  }
  // Japanese & Languages
  if (lower.includes('read') || lower.includes('hiragana') || lower.includes('jpd') || lower.includes('tiếng nhật') || lower.includes('japanese') || lower.includes('kanji')) {
    return { code: 'JPD113', semester: 'K4' }
  }
  // Mobile Programming
  if (lower.includes('prm') || lower.includes('mobile') || lower.includes('android') || lower.includes('flutter') || lower.includes('ios')) {
    return { code: 'PRM392', semester: 'K7' }
  }
  // Capstone
  if (lower.includes('sep') || lower.includes('capstone') || lower.includes('do an') || lower.includes('đồ án')) {
    return { code: 'SEP490', semester: 'K8' }
  }
  return null
}

function formatCleanDescriptionText(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/^#+\s*/gm, '')         // Remove #, ##, ### headers
    .replace(/\*\*/g, '')            // Remove bold **
    .replace(/^\s*[-*]\s*/gm, '• ')  // Convert - or * to clean bullet point •
    .replace(/\n{3,}/g, '\n\n')      // Limit consecutive blank lines
    .trim()
}

function generateSmartPreviewForDocument(docName: string, lang = 'vi'): {
  title: string
  subjectCode: string
  semester: SemesterKey
  description: string
  schedule: string[]
} {
  const detected = detectSubjectFromDocName(docName)
  const code = detected?.code || 'SWP391'
  const semester = detected?.semester || 'K5'

  const lower = docName.toLowerCase()
  let title = `Lộ trình học tập ${code} (${docName})`
  let description = `Học tập chi tiết và ôn luyện dựa trên tài liệu ${docName}`
  let schedule = ['Mon', 'Wed', 'Fri']

  if (lower.includes('test') || lower.includes('smell') || lower.includes('qa')) {
    title = `Lộ trình 4 tuần Ôn tập & Phân tích Test Smell (${docName})`
    description = `• Tuần 1: Khái niệm cốt lõi Kiểm thử & Test Smell.\n• Tuần 2: Phân tích mẫu Code Smell & Refactoring bài test.\n• Tuần 3: Automation Testing & Viết Unit Test chuẩn.\n• Tuần 4: Ôn tập tổng hợp & Kiểm thử ứng dụng thực tế.`
    schedule = ['Tue', 'Thu', 'Sat']
  } else if (lower.includes('use case') || lower.includes('diagram') || lower.includes('uml') || lower.includes('spec')) {
    title = `Lộ trình Phân tích & Thiết kế Phần mềm (${docName})`
    description = `• Tuần 1: Thu thập yêu cầu & Use Case Specification.\n• Tuần 2: Thiết kế sơ đồ Use Case & Diagram tương tác.\n• Tuần 3: Phân tích luồng nghiệp vụ & Architecture.\n• Tuần 4: Ôn tập và hoàn thiện tài liệu thiết kế.`
    schedule = ['Mon', 'Wed', 'Fri']
  } else if (lower.includes('read') || lower.includes('hiragana') || lower.includes('jpd') || lower.includes('japanese')) {
    title = `Lộ trình 4 tuần chinh phục Hiragana (${docName})`
    description = `• Tuần 1: Bảng chữ cái Hiragana cơ bản.\n• Tuần 2: Từ vựng & Mẫu câu giao tiếp.\n• Tuần 3: Luyện đọc hiểu & Viết chữ.\n• Tuần 4: Thi thử phản xạ & Tổng hợp kiến thức.`
    schedule = ['Mon', 'Tue', 'Thu', 'Fri']
  } else if (lower.includes('math') || lower.includes('toán') || lower.includes('mae')) {
    title = `Kế hoạch Ôn luyện Toán học Chuyên sâu (${docName})`
    description = `• Tuần 1: Hàm số, Giới hạn & Đạo hàm cơ bản.\n• Tuần 2: Tích phân & Ứng dụng hình học.\n• Tuần 3: Đại số tuyến tính & Ma trận.\n• Tuần 4: Giải đề thi thử và tổng hợp công thức.`
    schedule = ['Mon', 'Wed', 'Fri']
  } else if (lower.includes('db') || lower.includes('sql') || lower.includes('database')) {
    title = `Lộ trình Master Cơ sở dữ liệu & SQL (${docName})`
    description = `• Tuần 1: Truy vấn SQL cơ bản & ER Diagram.\n• Tuần 2: Join, Subquery & Chuẩn hóa CSDL.\n• Tuần 3: Index, Transaction & Stored Procedure.\n• Tuần 4: Thực hành tối ưu truy vấn SQL.`
    schedule = ['Tue', 'Thu', 'Sat']
  }

  return { title, subjectCode: code, semester, description, schedule }
}

function mapResponseToStudyPlan(response: any) {
  let segments = [
    { label: 'Khái niệm cốt lõi', value: 0 },
    { label: 'Lý thuyết nâng cao', value: 0 },
    { label: 'Thi thử', value: 0 }
  ]

  if (response.curriculumJson) {
    try {
      const parsed = JSON.parse(response.curriculumJson)
      if (Array.isArray(parsed) && parsed.length > 0) {
        segments = parsed.map((mod: any) => ({
          label: mod.title || 'Bài học',
          value: 0
        }))
      }
    } catch (e) {
      console.error('Failed to parse curriculumJson for segments:', e)
    }
  }

  const docNames = response.sourceDocuments ? response.sourceDocuments.map((d: any) => d.title || d.fileName) : []

  return {
    id: String(response.id),
    title: response.title || 'Study Plan',
    description: response.planText || '',
    isAiGenerated: true,
    status: 'Active' as const,
    documents: docNames.length,
    hoursEst: 28,
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    overallProgress: 0,
    segments,
    themeColor: 'purple' as 'blue' | 'purple' | 'teal',
    linkedDocs: docNames,
    curriculumJson: response.curriculumJson
  }
}

// ─── Component ───────────────────────────────────────────

export const CreateStudyPlanModal = ({ 
  isOpen, 
  onClose, 
  onCreate,
  onUpdate,
  editingPlan,
  preselectedDocId,
  autoGenerate
}: CreateStudyPlanModalProps) => {
  const { t, language } = useTranslation()
  const [isGenerating, setIsGenerating] = useState(false)
  const { user } = useAuthStore()
  
  const [selectedSemester, setSelectedSemester] = useState<SemesterKey>('ALL')
  const [userDocuments, setUserDocuments] = useState<{ id: string; name: string; size: string }[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [generatedCurriculumJson, setGeneratedCurriculumJson] = useState<string | undefined>(undefined)
  const [hasAutoGenerated, setHasAutoGenerated] = useState(false)
  const [generatedPlanId, setGeneratedPlanId] = useState<number | null>(null)

  const filteredSubjects = useMemo(() => {
    if (selectedSemester === 'ALL') return ALL_SUBJECTS
    return ALL_SUBJECTS.filter((s) => s.semester === selectedSemester)
  }, [selectedSemester])

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
        selectedDocIds: z.array(z.string()).optional(),
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
      major:       'SE',
      semester:    'ALL',
      subject:     'PRF192',
      description: '',
      startDate:   '',
      endDate:     '',
      priority:    'High',
      schedule:    [],
      selectedDocIds: [],
    },
  })

  // Reset form whenever the modal opens fresh or populates editingPlan
  useEffect(() => {
    if (isOpen) {
      if (editingPlan) {
        setValue('title', editingPlan.title, { shouldValidate: true })
        setValue('description', editingPlan.description, { shouldValidate: true })
        setValue('priority', editingPlan.difficulty === 'Hard' ? 'High' : editingPlan.difficulty === 'Medium' ? 'Medium' : 'Low', { shouldValidate: true })
        const today = new Date()
        const endDay = new Date(today)
        endDay.setDate(today.getDate() + 30)
        setValue('startDate', today.toISOString().split('T')[0], { shouldValidate: true })
        setValue('endDate',   endDay.toISOString().split('T')[0],  { shouldValidate: true })
        setValue('schedule', ['Mon', 'Wed', 'Fri'], { shouldValidate: true })
        if (editingPlan.curriculumJson) {
          setGeneratedCurriculumJson(editingPlan.curriculumJson)
        }
      } else {
        reset({
          title: '', major: 'SE', semester: 'ALL', subject: 'PRF192', description: '',
          startDate: '', endDate: '', priority: 'High', schedule: [],
          selectedDocIds: [],
        })
        setGeneratedCurriculumJson(undefined)
        setHasAutoGenerated(false)
        setGeneratedPlanId(null)
      }
    }
  }, [isOpen, editingPlan, reset, setValue])

  // Load user documents
  useEffect(() => {
    if (isOpen) {
      const loadDocs = async () => {
        setLoadingDocs(true)
        try {
          const userId = user?.id ? Number(user.id) : undefined
          const docs = await documentService.getAllDocuments(userId)
          const formatted = docs.map((d) => ({
            id: String(d.id),
            name: d.title || d.originalFileName || d.fileName || 'Untitled Document',
            size: d.fileSize ? `${(d.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'Unknown size'
          }))
          setUserDocuments(formatted)
        } catch (e) {
          console.error('Failed to load user documents:', e)
        } finally {
          setLoadingDocs(false)
        }
      }
      loadDocs()
    }
  }, [isOpen, user])

  // Pre-select document and trigger auto-generation if requested
  useEffect(() => {
    if (isOpen && preselectedDocId && userDocuments.length > 0 && !hasAutoGenerated) {
      const matchedDoc = userDocuments.find(
        (d) => d.id === preselectedDocId || d.id === preselectedDocId.replace('doc-', '') || `doc-${d.id}` === preselectedDocId
      )
      if (matchedDoc) {
        setValue('selectedDocIds', [matchedDoc.id])
        if (autoGenerate) {
          setHasAutoGenerated(true)
          setTimeout(() => {
            handleGenerateAI()
          }, 100)
        }
      }
    }
  }, [isOpen, preselectedDocId, userDocuments, autoGenerate, hasAutoGenerated])

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
    const selectedDocs = watch('selectedDocIds') || []
    if (selectedDocs.length === 0) {
      const msg = language === 'vi'
        ? 'Vui lòng chọn ít nhất 1 tài liệu trong danh sách trước khi tạo với AI!'
        : (language === 'ja'
          ? 'AIで学習計画を生成するには、少なくとも1つのドキュメントを選択してください。'
          : (language === 'ko'
            ? 'AI 학습 계획을 생성하려면 최소 1개의 문서를 선택하세요.'
            : 'Please select at least 1 document before generating a study plan with AI!'))
      toast.error(msg)
      return
    }

    setIsGenerating(true)
    try {
      const userId = user?.id ? Number(user.id) : 1
      const docIds = selectedDocs.map((id: string) => Number(id.replace('doc-', ''))).filter((n: number) => !isNaN(n))

      // Auto-detect subject and smart preview from the selected document
      let targetSubject = currentSubject
      const selectedDocObj = userDocuments.find(d => selectedDocs.includes(d.id) || selectedDocs.includes(`doc-${d.id}`))
      const docNameHint = selectedDocObj ? selectedDocObj.name : 'tài liệu'
      const preview = generateSmartPreviewForDocument(docNameHint, language)

      if (selectedDocObj) {
        const detected = detectSubjectFromDocName(selectedDocObj.name)
        if (detected) {
          targetSubject = detected.code
          setSelectedSemester(detected.semester)
          setValue('subject', detected.code, { shouldValidate: true })
        }
      }

      const customDesc = watch('description')
      const goal = customDesc && customDesc.trim().length > 0 
        ? customDesc 
        : (language === 'vi' 
          ? `Lập kế hoạch học tập chi tiết dựa trên nội dung tài liệu ${docNameHint}`
          : `Create a detailed study plan based on document ${docNameHint}`)

      // Call OpenAI study plan generator
      const plan = await aiService.generateStudyPlan(
        userId,
        targetSubject,
        goal,
        4, // Default 4 weeks
        docIds
      )

      // Auto-fill ALL form fields with clean formatted text
      const rawDesc = plan.planText || preview.description
      const cleanDesc = formatCleanDescriptionText(rawDesc)

      setValue('title', plan.title || preview.title, { shouldValidate: true })
      setValue('major', 'SE', { shouldValidate: true })
      setSelectedSemester(preview.semester)
      setValue('subject', targetSubject, { shouldValidate: true })
      setValue('description', cleanDesc, { shouldValidate: true })
      setValue('schedule', preview.schedule, { shouldValidate: true })
      setValue('priority', 'High', { shouldValidate: true })

      setGeneratedCurriculumJson(plan.curriculumJson)
      setGeneratedPlanId(plan.id)

      // Set start date to today, end date to +30 days
      const today = new Date()
      const endDay = new Date(today)
      endDay.setDate(today.getDate() + 30)
      setValue('startDate', today.toISOString().split('T')[0], { shouldValidate: true })
      setValue('endDate',   endDay.toISOString().split('T')[0],  { shouldValidate: true })

      toast.success(language === 'vi' ? `Đã tự động điền đầy đủ thông tin theo tài liệu ${docNameHint}!` : `Auto-filled all details based on ${docNameHint}!`)
    } catch (err) {
      console.error('Error generating AI plan:', err)
      // Fallback: auto-fill using smart preview
      const selectedDocObj = userDocuments.find(d => selectedDocs.includes(d.id) || selectedDocs.includes(`doc-${d.id}`))
      const docNameHint = selectedDocObj ? selectedDocObj.name : 'tài liệu'
      const preview = generateSmartPreviewForDocument(docNameHint, language)

      setValue('title', preview.title, { shouldValidate: true })
      setValue('major', 'SE', { shouldValidate: true })
      setSelectedSemester(preview.semester)
      setValue('subject', preview.subjectCode, { shouldValidate: true })
      setValue('description', preview.description, { shouldValidate: true })
      setValue('schedule', preview.schedule, { shouldValidate: true })
      setValue('priority', 'High', { shouldValidate: true })

      const today = new Date()
      const endDay = new Date(today)
      endDay.setDate(today.getDate() + 30)
      setValue('startDate', today.toISOString().split('T')[0], { shouldValidate: true })
      setValue('endDate',   endDay.toISOString().split('T')[0],  { shouldValidate: true })

      toast.success(language === 'vi' ? `Đã tự động điền thông tin đề xuất cho ${docNameHint}!` : `Auto-filled suggested details for ${docNameHint}!`)
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Submit ───────────────────────────────────────────
  const onSubmit = async (data: StudyPlanFormValues) => {
    try {
      const userIdVal = user?.id ? Number(user.id) : 1
      const selectedDocs = data.selectedDocIds || []
      const docIds = selectedDocs.map((id: string) => Number(id.replace('doc-', ''))).filter((n: number) => !isNaN(n))

      const selectedDocObjs = userDocuments.filter(d => selectedDocs.includes(d.id) || selectedDocs.includes(`doc-${d.id}`))
      const selectedDocNames = selectedDocObjs.map(d => d.name)

      let savedPlan: any

      if (editingPlan && editingPlan.id) {
        const planIdNum = Number(editingPlan.id)
        if (!isNaN(planIdNum) && planIdNum > 0) {
          savedPlan = await aiService.updateStudyPlan(planIdNum, {
            userId: userIdVal,
            title: data.title,
            subject: data.subject || 'PRF192',
            planText: data.description && data.description.trim().length > 0 ? data.description : `Lộ trình học tập môn ${data.subject || 'PRF192'}`,
            curriculumJson: generatedCurriculumJson || '',
            documentId: docIds.length > 0 ? docIds[0] : undefined
          })
        }
        if (onUpdate && savedPlan) {
          const mappedPlan = mapResponseToStudyPlan(savedPlan)
          mappedPlan.difficulty = data.priority === 'High' ? 'Hard' : data.priority === 'Medium' ? 'Medium' : 'Easy'
          mappedPlan.themeColor = data.priority === 'High' ? 'purple' : data.priority === 'Medium' ? 'blue' : 'teal'
          mappedPlan.documents = Math.max(selectedDocNames.length, mappedPlan.documents || 0, docIds.length > 0 ? 1 : 0)
          mappedPlan.linkedDocs = selectedDocNames.length > 0 ? selectedDocNames : (mappedPlan.linkedDocs || [])
          onUpdate(mappedPlan)
        }
        toast.success(language === 'vi' ? 'Đã cập nhật kế hoạch học tập!' : 'Study plan updated successfully!')
      } else {
        savedPlan = await aiService.saveStudyPlan({
          userId: userIdVal,
          title: data.title,
          subject: data.subject || 'PRF192',
          planText: data.description && data.description.trim().length > 0 ? data.description : `Lộ trình học tập môn ${data.subject || 'PRF192'}`,
          curriculumJson: generatedCurriculumJson || '',
          documentId: docIds.length > 0 ? docIds[0] : undefined
        })

        if (onCreate && savedPlan) {
          const mappedPlan = mapResponseToStudyPlan(savedPlan)
          mappedPlan.difficulty = data.priority === 'High' ? 'Hard' : data.priority === 'Medium' ? 'Medium' : 'Easy'
          mappedPlan.themeColor = data.priority === 'High' ? 'purple' : data.priority === 'Medium' ? 'blue' : 'teal'
          mappedPlan.documents = Math.max(selectedDocNames.length, mappedPlan.documents || 0, docIds.length > 0 ? 1 : 0)
          mappedPlan.linkedDocs = selectedDocNames.length > 0 ? selectedDocNames : (mappedPlan.linkedDocs || [])
          onCreate(mappedPlan)
        }
        toast.success(language === 'vi' ? 'Đã tạo kế hoạch học tập mới thành công!' : 'Study plan created successfully!')
      }
    } catch (err) {
      console.error('Failed to save study plan:', err)
      toast.error(language === 'vi' ? 'Lỗi khi lưu kế hoạch học tập' : 'Failed to save study plan')
    } finally {
      reset()
      setGeneratedPlanId(null)
      onClose()
    }
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

  const getSubjectTranslation = (sub: string) => {
    const found = ALL_SUBJECTS.find(s => s.code === sub)
    return found ? found.title : sub
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

        {/* ── Major, Semester & Subject Selection ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Major Select */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {language === 'vi' ? 'Chuyên ngành' : language === 'ja' ? '専攻' : language === 'ko' ? '전공' : 'Major'}
            </label>
            <Select {...register('major')}>
              {MAJORS.map(m => (
                <option key={m.key} value={m.key}>
                  {language === 'vi' ? m.labelVI : m.labelEN}
                </option>
              ))}
            </Select>
          </div>

          {/* Semester Select */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {language === 'vi' ? 'Học kỳ' : language === 'ja' ? '学期' : language === 'ko' ? '학기' : 'Semester'}
            </label>
            <Select
              value={selectedSemester}
              onChange={(e) => {
                const newSem = e.target.value as SemesterKey
                setSelectedSemester(newSem)
                const available = newSem === 'ALL' ? ALL_SUBJECTS : ALL_SUBJECTS.filter(s => s.semester === newSem)
                if (available.length > 0) {
                  setValue('subject', available[0].code, { shouldValidate: true })
                }
              }}
            >
              {SEMESTERS.map(s => (
                <option key={s.key} value={s.key}>
                  {language === 'vi' ? s.labelVI : s.labelEN}
                </option>
              ))}
            </Select>
          </div>

          {/* Subject Select */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {language === 'vi' ? 'Môn học' : language === 'ja' ? '科目' : language === 'ko' ? '과목' : 'Subject'} <span className="text-red-500">*</span>
            </label>
            <Select {...register('subject')} error={errors.subject?.message}>
              {filteredSubjects.map(s => (
                <option key={s.code} value={s.code}>
                  {s.title}
                </option>
              ))}
            </Select>
          </div>
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

        {/* ── Linked Documents ── */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {language === 'vi' ? 'Liên kết tài liệu học tập' : language === 'ja' ? '関連ドキュメントのリンク' : language === 'ko' ? '관련 문서 링크' : 'Link Reference Documents'} <span className="text-red-500">*</span>
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {language === 'vi' ? 'Chọn ít nhất 1 tài liệu trong thư viện để AI có dữ liệu tạo kế hoạch học tập.' : 'Select at least 1 document from your library for AI to build the plan on.'}
          </p>
          <Controller
            control={control}
            name="selectedDocIds"
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-slate-250/60 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/30 scrollbar-thin">
                {loadingDocs ? (
                  <div className="col-span-2 flex items-center justify-center py-4 text-xs font-semibold text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {language === 'vi' ? 'Đang tải tài liệu...' : 'Loading documents...'}
                  </div>
                ) : userDocuments.length === 0 ? (
                  <div className="col-span-2 text-center py-4 text-xs font-semibold text-slate-450 dark:text-slate-500">
                    {language === 'vi' ? 'Không có tài liệu nào trong thư viện' : 'No documents in library'}
                  </div>
                ) : (
                  userDocuments.map((doc) => {
                    const isChecked = (field.value || []).includes(doc.id)
                    return (
                      <label
                        key={doc.id}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all select-none',
                          isChecked
                            ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const currentValues = field.value || []
                            if (e.target.checked) {
                              field.onChange([...currentValues, doc.id])
                            } else {
                              field.onChange(currentValues.filter((id: string) => id !== doc.id))
                            }
                          }}
                          className="rounded border-slate-350 text-indigo-650 focus:ring-indigo-550 dark:border-slate-700 dark:bg-slate-900"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-slate-800 dark:text-slate-200 leading-none">{doc.name}</p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{doc.size}</span>
                        </div>
                      </label>
                    )
                  })
                )}
              </div>
            )}
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
                ? (language === 'vi' ? `Đang tạo kế hoạch thông minh cho môn ${getSubjectTranslation(currentSubject)}...` : language === 'ja' ? `科目のスマートな計画を生成中...` : language === 'ko' ? `과목에 대한 스마트 계획 생성 중...` : `Generating a smart plan for ${getSubjectTranslation(currentSubject)}...`)
                : (language === 'vi' ? 'Hãy để AI giúp bạn thiết lập thời gian học tập thông minh dựa trên hạn chót và môn học.' : language === 'ja' ? '期限や科目に基づいて、AIがスマートな学習スケジュールを作成することをサポートします。' : language === 'ko' ? '마감일과 과목을 기반으로 AI가 스마트한 학습 일정을 수립하도록 도와드립니다.' : 'Let AI help you create a smart study schedule based on your deadline and subject.')}
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
