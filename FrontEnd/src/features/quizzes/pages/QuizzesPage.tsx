import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Send,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Database,
  RotateCcw,
  Sliders,
  Cpu,
  Brain,
  ChevronRight,
  Check,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToastStore } from '@/stores/toastStore'
import { useTranslation } from '@/context/LanguageContext'
import { aiService } from '@/services/aiService'

interface DocumentItem {
  id: string
  title: string
  fileName: string
  subject: string
  type: string
}

interface Question {
  id: string
  q: string
  options: string[]
  answer: number
  explain: string
}

const DEFAULT_DOCUMENTS: DocumentItem[] = [
  { id: 'doc-3', title: 'Introduction to Quantum Mechanics', fileName: 'Intro_to_Quantum_Mechanics.txt', subject: 'PHYSICS', type: 'text' },
  { id: 'doc-design-patterns', title: 'Design Patterns Java Guide', fileName: 'Design_Patterns_Java_Guide.pdf', subject: 'COMPSCI', type: 'pdf' },
  { id: 'doc-5', title: 'Philosophy 101 Lecture Notes', fileName: 'Philosophy_101_Notes.pdf', subject: 'PHILOSOPHY', type: 'pdf' },
  { id: 'doc-1', title: 'Mathematics Cheat Sheet', fileName: 'Mathematics_Cheat_Sheet.pdf', subject: 'MATHEMATICS', type: 'pdf' }
]

const INITIAL_QUESTION_BANK: Record<string, Question[]> = {
  'doc-3': [
    {
      id: 'q-q1',
      q: 'Lưỡng tính sóng hạt được chứng minh thực nghiệm rõ nhất qua hiện tượng nào?',
      options: ['Hiện tượng quang điện', 'Hiện tượng khúc xạ ánh sáng', 'Hiện tượng tán sắc cầu vồng', 'Hiện tượng phản xạ gương'],
      answer: 0,
      explain: 'Hiện tượng quang điện ngoài chứng minh ánh sáng có bản chất hạt (các hạt gọi là photons), giải phóng electron khỏi bề mặt kim loại.'
    },
    {
      id: 'q-q2',
      q: 'Phương trình Schrödinger độc lập thời gian có công thức tổng quát là gì?',
      options: ['Ĥψ = Eψ', 'F = m.a', 'E = mc²', 'pV = nRT'],
      answer: 0,
      explain: 'Ĥψ = Eψ trong đó Ĥ là toán tử Hamiltonian, ψ là hàm sóng, và E là năng lượng của hệ lượng tử.'
    },
    {
      id: 'q-q3',
      q: 'Hiện tượng một hạt vượt qua rào thế năng cao hơn động năng của nó gọi là gì?',
      options: ['Chồng chập lượng tử', 'Đường hầm lượng tử (Quantum Tunneling)', 'Vướng víu lượng tử', 'Dịch chuyển lượng tử'],
      answer: 1,
      explain: 'Đường hầm lượng tử cho phép hạt vượt qua rào cản thế năng nhờ tính chất sóng của cơ học lượng tử.'
    }
  ],
  'doc-design-patterns': [
    {
      id: 'q-d1',
      q: 'Mẫu thiết kế nào đảm bảo một lớp chỉ có duy nhất một instance và cung cấp cổng truy cập toàn cục?',
      options: ['Factory Method', 'Observer Pattern', 'Singleton Pattern', 'Adapter Pattern'],
      answer: 2,
      explain: 'Singleton Pattern giới hạn việc khởi tạo của một Class ở duy nhất một instance trong suốt vòng đời ứng dụng.'
    },
    {
      id: 'q-d2',
      q: 'Mẫu thiết kế nào được dùng để kết nối hai giao diện không tương thích hoạt động cùng nhau?',
      options: ['Facade Pattern', 'Adapter Pattern', 'Proxy Pattern', 'Decorator Pattern'],
      answer: 1,
      explain: 'Adapter Pattern hoạt động như một bộ chuyển đổi giao diện, giúp lớp cũ tương thích với mã nguồn mới.'
    }
  ]
}

const mapBackendQuestionToFrontend = (item: any): Question => {
  let opts: string[] = []
  if (typeof item.options === 'string') {
    try {
      opts = JSON.parse(item.options)
    } catch (e) {
      opts = [item.options]
    }
  } else if (Array.isArray(item.options)) {
    opts = item.options
  }

  return {
    id: String(item.id || Date.now() + Math.random()),
    q: item.questionText || item.q || '',
    options: opts,
    answer: typeof item.answerIndex === 'number' ? item.answerIndex : (typeof item.answer === 'number' ? item.answer : 0),
    explain: item.explanation || item.explain || ''
  }
}

export function QuizzesPage() {
  const { language } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)

  const lessonId = searchParams.get('lessonId') || undefined
  const planId = searchParams.get('planId') || undefined

  const { user } = useAuthStore()
  const currentUserId = user?.id ? Number(user.id) : undefined

  // 1. Documents loading from backend
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [selectedDocId, setSelectedDocId] = useState<string>('')

  useEffect(() => {
    if (!currentUserId) return

    const fetchDocs = async () => {
      try {
        const response = await documentService.getAllDocuments(currentUserId)
        const mapped: DocumentItem[] = response.map((d: any) => ({
          id: String(d.id),
          title: d.title || d.originalFileName || 'Tài liệu không tên',
          fileName: d.originalFileName || '',
          subject: d.subject || 'GENERAL',
          type: d.fileType?.toLowerCase() || 'pdf'
        }))
        setDocuments(mapped)

        const docQuery = searchParams.get('doc')
        if (docQuery) {
          setSelectedDocId(docQuery)
        } else if (mapped.length > 0) {
          setSelectedDocId(String(mapped[0].id))
        }
      } catch (err) {
        console.error('Failed to load user documents:', err)
      }
    }
    fetchDocs()
  }, [currentUserId, searchParams])

  // 2. Active selection and config states
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [questionCount, setQuestionCount] = useState<number>(3)
  const [promptModifier, setPromptModifier] = useState<string>('')

  // 3. Quiz State
  const [questions, setQuestions] = useState<Question[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [genStep, setGenStep] = useState('')
  const [activeQuiz, setActiveQuiz] = useState(false)
  
  // 4. Taking Quiz States
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSavedToBank, setIsSavedToBank] = useState(false)
  const [aiAssistantPrompt, setAiAssistantPrompt] = useState('')
  const [isModifyingWithAi, setIsModifyingWithAi] = useState(false)

  // 5. Question Bank persistence
  const [questionBank, setQuestionBank] = useState<Record<string, Question[]>>(() => {
    const saved = localStorage.getItem('ai_study_hub_question_bank')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        // Fallback
      }
    }
    return INITIAL_QUESTION_BANK
  })

  // Auto-detect query param changes
  useEffect(() => {
    const docQuery = searchParams.get('doc')
    if (docQuery && documents.some(d => d.id === docQuery)) {
      setSelectedDocId(docQuery)
    }
  }, [searchParams, documents])

  // Load existing quiz for the selected document if available
  useEffect(() => {
    if (!selectedDocId) return

    const loadExistingQuiz = async () => {
      try {
        const raw = await aiService.getQuiz(selectedDocId)
        if (raw && raw.length > 0) {
          const mapped = raw.map(mapBackendQuestionToFrontend)
          setQuestions(mapped)
          setActiveQuiz(true)
          setCurrentIdx(0)
          setSelectedAnswers({})
          setIsSubmitted(false)
          setIsSavedToBank(true)
        } else {
          setQuestions([])
          setActiveQuiz(false)
        }
      } catch (err) {
        console.log('No existing quiz found or failed to load:', err)
        setQuestions([])
        setActiveQuiz(false)
      }
    }
    loadExistingQuiz()
  }, [selectedDocId])

  // Get active document details
  const activeDoc = documents.find(d => d.id === selectedDocId)

  // Real AI Quiz Generation
  const handleGenerateQuiz = async (customPrompt?: string) => {
    if (!selectedDocId) {
      addToast(
        language === 'vi' ? 'Vui lòng chọn một tài liệu trước!' : 'Please select a document first!',
        'error'
      )
      return
    }

    setIsGenerating(true)
    setGenStep(language === 'vi' ? 'Đang phân tích cấu trúc tài liệu...' : 'Analyzing document structure...')
    
    try {
      const rawQuestions = await aiService.generateQuiz(
        selectedDocId,
        difficulty,
        questionCount,
        customPrompt || promptModifier || ''
      )

      const mapped = rawQuestions.map(mapBackendQuestionToFrontend)
      
      setQuestions(mapped)
      setActiveQuiz(true)
      setCurrentIdx(0)
      setSelectedAnswers({})
      setIsSubmitted(false)
      setIsSavedToBank(false)
      
      addToast(
        language === 'vi' ? 'Đã tạo bộ đề trắc nghiệm AI thành công!' : 'AI Quiz generated successfully!',
        'success'
      )
    } catch (err: any) {
      console.error('Failed to generate quiz:', err)
      addToast(
        language === 'vi' ? 'Tạo đề trắc nghiệm thất bại. Vui lòng thử lại!' : 'Failed to generate quiz. Please try again!',
        'error'
      )
    } finally {
      setIsGenerating(false)
      setGenStep('')
    }
  }

  // Handle AI Prompt Editing on active Quiz
  const handleModifyQuizWithAi = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiAssistantPrompt.trim() || !selectedDocId) return

    setIsModifyingWithAi(true)
    addToast(
      language === 'vi' ? 'AI đang hiệu chỉnh bộ đề câu hỏi...' : 'AI is modifying the quiz questions...',
      'info'
    )

    try {
      const rawQuestions = await aiService.modifyQuizWithAi(
        selectedDocId,
        aiAssistantPrompt
      )

      const mapped = rawQuestions.map(mapBackendQuestionToFrontend)
      
      setQuestions(mapped)
      setAiAssistantPrompt('')
      addToast(
        language === 'vi' ? 'Đã hiệu chỉnh bộ đề thành công bằng AI Prompt!' : 'Quiz updated via AI Prompt successfully!',
        'success'
      )
    } catch (err: any) {
      console.error('Failed to modify quiz:', err)
      addToast(
        language === 'vi' ? 'Hiệu chỉnh đề trắc nghiệm thất bại. Vui lòng thử lại!' : 'Failed to modify quiz. Please try again!',
        'error'
      )
    } finally {
      setIsModifyingWithAi(false)
    }
  }

  // Score Calculation
  const correctCount = questions.filter((q, idx) => selectedAnswers[idx] === q.answer).length
  const scorePercentage = questions.length === 0 ? 0 : Math.round((correctCount / questions.length) * 100)

  // Save to Question Bank
  const handleSaveToQuestionBank = () => {
    setIsSavedToBank(true)
    
    // Add current questions to local questionBank registry
    const newBank = {
      ...questionBank,
      [selectedDocId]: [
        ...(questionBank[selectedDocId] || []),
        ...questions.filter(q => !(questionBank[selectedDocId] || []).some(bq => bq.q === q.q))
      ]
    }
    
    setQuestionBank(newBank)
    localStorage.setItem('ai_study_hub_question_bank', JSON.stringify(newBank))

    addToast(
      language === 'vi' 
        ? 'Đã lưu bộ đề trắc nghiệm thành công vào Question Bank để chia sẻ!' 
        : 'Quiz successfully added to the document Question Bank for sharing!',
      'success'
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
            <Brain className="size-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {language === 'vi' ? 'Hệ thống Trắc nghiệm AI' : 'AI Quizzes System'}
            </h1>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
              {language === 'vi' 
                ? 'Tự động tạo bộ câu hỏi từ giáo trình, tinh chỉnh bằng AI Prompt và lưu vào Question Bank.' 
                : 'Auto-generate quizzes from docs, modify with AI Prompts, and save to the Question Bank.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/study-plans')}
            className="text-xs font-bold flex items-center gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            {language === 'vi' ? 'Quay lại Study Plan' : 'Back to Study Plans'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Control Panel: Document Selection & Generation */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="p-5 border border-slate-250/60 dark:border-slate-800 bg-white dark:bg-slate-900/60 backdrop-blur-md">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
              <Sliders className="size-4 text-indigo-500" />
              {language === 'vi' ? 'Cấu hình Bộ đề AI' : 'AI Quiz Configuration'}
            </h3>

            <div className="space-y-4">
              {/* Document selection dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  {language === 'vi' ? '1. Chọn tài liệu nguồn' : '1. Choose Source Document'}
                </label>
                <div className="relative">
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    disabled={isGenerating || activeQuiz}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 dark:border-slate-800 dark:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer disabled:opacity-60"
                  >
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id} className="dark:bg-slate-900">
                        {doc.title || doc.fileName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Difficulty level */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  {language === 'vi' ? '2. Độ khó mong muốn' : '2. Target Difficulty'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      disabled={isGenerating || activeQuiz}
                      onClick={() => setDifficulty(level)}
                      className={`py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        difficulty === level
                          ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-450 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850'
                      } disabled:opacity-50`}
                    >
                      {level === 'easy' ? (language === 'vi' ? 'Dễ' : 'Easy') : level === 'medium' ? (language === 'vi' ? 'Vừa' : 'Medium') : (language === 'vi' ? 'Khó' : 'Hard')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of questions slider */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  <span>{language === 'vi' ? '3. Số lượng câu hỏi' : '3. Number of Questions'}</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{questionCount}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  disabled={isGenerating || activeQuiz}
                  className="w-full accent-indigo-600 cursor-pointer disabled:opacity-50"
                />
              </div>

              {/* Custom Prompt modifier */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  {language === 'vi' ? '4. Yêu cầu đặc biệt cho AI (Tùy chọn)' : '4. Custom AI Instructions (Optional)'}
                </label>
                <textarea
                  value={promptModifier}
                  onChange={(e) => setPromptModifier(e.target.value)}
                  disabled={isGenerating || activeQuiz}
                  placeholder={language === 'vi' ? 'Ví dụ: Tập trung vào chương 3, tạo đề dạng tiếng Anh...' : 'Example: Focus on Chapter 3, translate to English...'}
                  className="w-full h-16 text-xs rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400"
                />
              </div>

              {/* Generate Trigger */}
              {!activeQuiz ? (
                <Button
                  onClick={() => handleGenerateQuiz()}
                  disabled={isGenerating}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 hover:shadow-lg transition-all"
                >
                  <Sparkles className="size-4 animate-spin-slow" />
                  {language === 'vi' ? 'TẠO BỘ ĐỀ VỚI AI' : 'GENERATE AI QUIZ'}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setActiveQuiz(false)
                    setQuestions([])
                  }}
                  variant="secondary"
                  className="w-full py-3 rounded-xl font-bold text-xs"
                >
                  {language === 'vi' ? 'Cấu hình lại bộ đề' : 'Reconfigure Quiz'}
                </Button>
              )}
            </div>
          </Card>

          {/* Question Bank status card */}
          {activeDoc && (
            <Card className="p-4 border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center shrink-0">
                  <Database className="size-4.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[12px] font-bold text-slate-850 dark:text-slate-250 truncate">
                    Question Bank: {activeDoc.title || activeDoc.fileName}
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                    {language === 'vi' 
                      ? `Đang có sẵn ${questionBank[selectedDocId]?.length || 0} câu hỏi được lưu trữ trong ngân hàng.`
                      : `${questionBank[selectedDocId]?.length || 0} pre-saved quiz questions stored in bank.`}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Active Quiz Workspace */}
        <div className="lg:col-span-8">
          {isGenerating ? (
            /* Loading State */
            <Card className="p-16 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-center flex flex-col items-center justify-center gap-5 min-h-[400px]">
              <div className="w-16 h-16 rounded-full border-4 border-t-indigo-600 border-indigo-100 dark:border-indigo-950 animate-spin flex items-center justify-center">
                <Cpu className="size-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-250">
                  {language === 'vi' ? 'AI Đang sinh bộ đề trắc nghiệm...' : 'AI is generating quiz questions...'}
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold mt-1">
                  {genStep}
                </p>
              </div>
            </Card>
          ) : !activeQuiz ? (
            /* Empty State */
            <Card className="p-16 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 dark:text-slate-600 mb-4 border-2 border-dashed border-slate-200 dark:border-slate-850">
                <HelpCircle className="size-8 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">
                {language === 'vi' ? 'Chưa có bộ đề nào đang chạy' : 'No Active Quiz'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-550 max-w-sm mt-1.5 leading-relaxed font-semibold">
                {language === 'vi' 
                  ? 'Hãy chọn tài liệu của bạn ở bảng bên trái và bấm nút "Tạo bộ đề với AI" để bắt đầu ôn tập.' 
                  : 'Select your source textbook from the left panel and click "Generate AI Quiz" to start studying.'}
              </p>
            </Card>
          ) : (
            /* Active Quiz Screen */
            <div className="space-y-5">
              {/* Active Quiz Content Card */}
              <Card className="p-6 border border-slate-250/60 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-lg relative overflow-hidden">
                {/* Header status */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <FileText className="size-3 text-indigo-500" />
                    {activeDoc?.title || activeDoc?.fileName}
                  </span>
                  
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                    {language === 'vi' ? `Câu ${currentIdx + 1} / ${questions.length}` : `Question ${currentIdx + 1} of ${questions.length}`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mb-6 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                  />
                </div>

                {/* Question panel */}
                {!isSubmitted ? (
                  /* Quiz taking view */
                  <div className="space-y-6">
                    <h3 className="text-[15px] font-extrabold text-slate-850 dark:text-slate-150 leading-relaxed">
                      {questions[currentIdx]?.q}
                    </h3>

                    <div className="flex flex-col gap-3">
                      {questions[currentIdx]?.options.map((opt, oIdx) => {
                        const isSelected = selectedAnswers[currentIdx] === oIdx
                        return (
                          <button
                            key={oIdx}
                            onClick={() => setSelectedAnswers(prev => ({ ...prev, [currentIdx]: oIdx }))}
                            className={`w-full flex items-center gap-3.5 p-4 rounded-xl border text-xs font-bold text-left cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-50/20 text-indigo-650 dark:text-indigo-400'
                                : 'border-slate-200 hover:border-slate-350 dark:border-slate-800 dark:hover:border-slate-700 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="flex-1">{opt}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Navigation footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 mt-5">
                      <Button
                        variant="secondary"
                        disabled={currentIdx === 0}
                        onClick={() => setCurrentIdx(prev => prev - 1)}
                        className="text-xs py-2 px-4 rounded-xl font-bold"
                      >
                        {language === 'vi' ? 'Quay lại' : 'Previous'}
                      </Button>

                      {currentIdx < questions.length - 1 ? (
                        <Button
                          onClick={() => setCurrentIdx(prev => prev + 1)}
                          className="bg-slate-850 dark:bg-slate-800 hover:bg-slate-900 text-white text-xs py-2 px-4 rounded-xl font-bold flex items-center gap-1.5"
                        >
                          {language === 'vi' ? 'Tiếp theo' : 'Next'}
                          <ChevronRight className="size-4" />
                        </Button>
                      ) : (
                        <Button
                          onClick={async () => {
                            setIsSubmitted(true)
                            const correctCount = questions.filter((q, idx) => selectedAnswers[idx] === q.answer).length
                            const scorePercentage = questions.length === 0 ? 0 : Math.round((correctCount / questions.length) * 100)
                            
                            if (scorePercentage >= 50 && planId && lessonId) {
                              try {
                                const localKey = `study_plan_completed_lessons_${planId}`
                                const raw = localStorage.getItem(localKey)
                                const completedLocal: string[] = raw ? JSON.parse(raw) : []
                                const merged = Array.from(new Set([...completedLocal, lessonId]))
                                localStorage.setItem(localKey, JSON.stringify(merged))
                                // Sync to DB
                                const planIdNum = Number(planId)
                                if (!isNaN(planIdNum) && planIdNum > 0) {
                                  await aiService.updateCompletedLessons(planIdNum, merged)
                                }
                                addToast(
                                  language === 'vi'
                                    ? 'Chúc mừng! Bạn đã vượt qua bài kiểm tra và hoàn thành bài học này trong Kế hoạch học tập.'
                                    : 'Congratulations! You passed the quiz and completed this lesson in your Study Plan.',
                                  'success'
                                )
                              } catch (e) {
                                console.error('Failed to sync quiz completion to Study Plan:', e)
                              }
                            }
                          }}
                          disabled={Object.keys(selectedAnswers).length < questions.length}
                          className="bg-indigo-650 hover:bg-indigo-750 text-white text-xs py-2 px-5 rounded-xl font-extrabold tracking-wider shadow-md shadow-indigo-600/10"
                        >
                          {language === 'vi' ? 'NỘP BÀI CHẤM ĐIỂM' : 'SUBMIT QUIZ'}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Quiz Score & Explanations review view */
                  <div className="space-y-6">
                    {/* Score summary panel */}
                    <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/40 text-center flex flex-col items-center justify-center gap-3">
                      <div className="w-20 h-20 rounded-full border-4 border-indigo-600 flex items-center justify-center font-black text-xl text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-md">
                        {scorePercentage}%
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-200">
                          {language === 'vi' 
                            ? `Kết quả: Đúng ${correctCount} trên ${questions.length} câu`
                            : `Results: Correct ${correctCount} of ${questions.length} questions`}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 font-semibold">
                          {scorePercentage >= 80 
                            ? (language === 'vi' ? 'Xuất sắc! Bạn đã nắm rất vững kiến thức tài liệu.' : 'Excellent! You mastered the document content.')
                            : (language === 'vi' ? 'Hãy đọc lại các bài học giải thích bên dưới để củng cố.' : 'Review explanations below to improve.')}
                        </p>
                      </div>

                      <div className="flex gap-3 mt-1.5">
                        {!isSavedToBank ? (
                          <Button
                            onClick={handleSaveToQuestionBank}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5"
                          >
                            <Database className="size-3.5" />
                            {language === 'vi' ? 'Lưu vào Question Bank' : 'Save to Question Bank'}
                          </Button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-extrabold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150">
                            <Check className="size-3.5" />
                            {language === 'vi' ? 'Đã lưu Question Bank' : 'Saved to Question Bank'}
                          </div>
                        )}
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setIsSubmitted(false)
                            setSelectedAnswers({})
                            setCurrentIdx(0)
                          }}
                          className="text-xs py-2 px-4 rounded-xl font-semibold"
                        >
                          {language === 'vi' ? 'Làm lại đề' : 'Retake Quiz'}
                        </Button>
                      </div>
                    </div>

                    {/* Explanations List */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                        {language === 'vi' ? 'Xem lại đáp án & giải thích AI' : 'Answers & AI Explanations'}
                      </h4>

                      <div className="space-y-3">
                        {questions.map((q, idx) => {
                          const isCorrect = selectedAnswers[idx] === q.answer
                          return (
                            <div key={q.id} className="p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-white dark:bg-slate-900/40">
                              <div className="flex gap-2 items-start">
                                {isCorrect ? (
                                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                                ) : (
                                  <XCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                                )}
                                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                                  {language === 'vi' ? `Câu ${idx + 1}:` : `Q${idx + 1}:`} {q.q}
                                </span>
                              </div>

                              <div className="pl-6 mt-3 space-y-1.5 text-[11px] font-bold text-slate-500">
                                <p>
                                  {language === 'vi' ? 'Câu trả lời của bạn:' : 'Your Answer:'}{' '}
                                  <span className={isCorrect ? 'text-emerald-600' : 'text-rose-600'}>
                                    {q.options[selectedAnswers[idx]] || (language === 'vi' ? 'Chưa trả lời' : 'Unanswered')}
                                  </span>
                                </p>
                                {!isCorrect && (
                                  <p className="text-slate-700 dark:text-slate-400">
                                    {language === 'vi' ? 'Đáp án đúng:' : 'Correct Answer:'}{' '}
                                    <span className="text-emerald-600">{q.options[q.answer]}</span>
                                  </p>
                                )}
                              </div>

                              <div className="pl-6 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-start gap-2 bg-slate-50/50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-150">
                                <Sparkles className="size-3 text-indigo-500 mt-0.5 shrink-0" />
                                <p className="text-[10px] font-semibold text-indigo-650 dark:text-indigo-400 leading-normal">
                                  <strong>AI Explanation:</strong> {q.explain}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* AI Assistant Edit Panel: Change difficulty, translate or regenerate via prompt */}
              <Card className="p-5 border border-indigo-150/60 dark:border-indigo-950/60 bg-[#f4f7ff] dark:bg-indigo-955/10 backdrop-blur-md">
                <div className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
                    <Sparkles className="size-4.5 text-indigo-600 dark:text-indigo-400 animate-spin-slow" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-extrabold text-slate-800 dark:text-slate-200">
                      {language === 'vi' ? 'Trợ lý Hiệu chỉnh Bộ đề AI (AI Prompt Edit)' : 'AI Quiz Refinement Assistant'}
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      {language === 'vi'
                        ? 'Bạn cảm thấy bộ đề không phù hợp? Hãy viết prompt để AI tinh chỉnh hoặc dịch thuật theo ý bạn.'
                        : 'Feel the quiz is not fitting? Prompt the AI to modify, add questions, or translate.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleModifyQuizWithAi} className="flex gap-2.5 mt-4">
                  <input
                    type="text"
                    value={aiAssistantPrompt}
                    onChange={(e) => setAiAssistantPrompt(e.target.value)}
                    disabled={isModifyingWithAi}
                    placeholder={
                      language === 'vi'
                        ? 'Nhập prompt... (Ví dụ: "Làm đề khó hơn", "Thêm 3 câu trắc nghiệm bằng tiếng Anh")'
                        : 'Type prompt... (e.g. "Make questions harder", "Translate to English")'
                    }
                    className="flex-1 rounded-xl border border-slate-250 bg-white px-3.5 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 dark:border-slate-850 dark:bg-slate-900 dark:text-white"
                  />
                  <Button
                    type="submit"
                    disabled={isModifyingWithAi || !aiAssistantPrompt.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-1.5"
                  >
                    <Send className="size-3.5" />
                    {language === 'vi' ? 'Gửi AI' : 'Send'}
                  </Button>
                </form>

                {/* Prompt examples chips */}
                <div className="flex flex-wrap gap-2 mt-3 pl-1">
                  {[
                    { label: language === 'vi' ? '🔥 Làm đề khó hơn' : '🔥 Make questions harder', prompt: 'Làm đề khó nâng cao hơn' },
                    { label: language === 'vi' ? '🌱 Làm đề dễ hơn' : '🌱 Make questions easier', prompt: 'Làm đề dễ hơn' },
                    { label: language === 'vi' ? '🇬🇧 Dịch sang Tiếng Anh' : '🇬🇧 Translate to English', prompt: 'Translate this quiz to English' }
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      disabled={isModifyingWithAi}
                      onClick={() => {
                        setAiAssistantPrompt(chip.prompt)
                      }}
                      className="text-[9.5px] font-bold text-indigo-650 dark:text-indigo-400 bg-indigo-50/50 hover:bg-indigo-100/50 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/40 border border-indigo-100/30 rounded-full px-2.5 py-0.5 cursor-pointer transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
