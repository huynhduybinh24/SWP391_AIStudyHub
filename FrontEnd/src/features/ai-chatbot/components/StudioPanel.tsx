import { useState } from 'react'
import {
  FileText, BrainCircuit, BarChart2, Layers, HelpCircle,
  HelpCircle as FaqIcon, Loader2, Sparkles, RefreshCw,
  ChevronRight, ChevronLeft, Award, CheckCircle2, XCircle,
  ArrowLeft
} from 'lucide-react'
import {
  aiService,
  StudioSummaryResponse,
  StudioMindmapResponse,
  StudioInfographicResponse,
  StudioFlashcardResponse,
  StudioQuizResponse,
  StudioFaqResponse
} from '@/services/aiService'
import { MindMapViewer } from './MindMapViewer'
import { cn } from '@/lib/utils'

interface StudioPanelProps {
  documentIds: number[]
  language?: string
}

type TabType = 'summary' | 'mindmap' | 'infographic' | 'flashcards' | 'quiz' | 'faq'

export function StudioPanel({ documentIds, language = 'vi' }: StudioPanelProps) {
  const [activeDetail, setActiveDetail] = useState<TabType | null>(null)

  // Loading States
  const [loading, setLoading] = useState<Record<TabType, boolean>>({
    summary: false,
    mindmap: false,
    infographic: false,
    flashcards: false,
    quiz: false,
    faq: false,
  })

  // Data States
  const [summaryData, setSummaryData] = useState<StudioSummaryResponse | null>(null)
  const [mindmapData, setMindmapData] = useState<StudioMindmapResponse | null>(null)
  const [infographicData, setInfographicData] = useState<StudioInfographicResponse | null>(null)
  const [flashcardsData, setFlashcardsData] = useState<StudioFlashcardResponse[] | null>(null)
  const [quizData, setQuizData] = useState<StudioQuizResponse[] | null>(null)
  const [faqData, setFaqData] = useState<StudioFaqResponse[] | null>(null)

  // Interactive Quiz States
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)

  // Interactive Flashcards States
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  // Interactive FAQ States
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  // Handlers for generation
  const handleGenerate = async (tab: TabType) => {
    if (documentIds.length === 0) return

    setLoading(prev => ({ ...prev, [tab]: true }))

    try {
      switch (tab) {
        case 'summary':
          const summary = await aiService.generateStudioSummary(documentIds, language)
          setSummaryData(summary)
          break
        case 'mindmap':
          const mm = await aiService.generateStudioMindmap(documentIds, language)
          setMindmapData(mm)
          break
        case 'infographic':
          const info = await aiService.generateStudioInfographic(documentIds, language)
          setInfographicData(info)
          break
        case 'flashcards':
          const fc = await aiService.generateStudioFlashcards(documentIds, language)
          setFlashcardsData(fc)
          setCurrentCardIndex(0)
          setIsFlipped(false)
          break
        case 'quiz':
          const qz = await aiService.generateStudioQuiz(documentIds, 'medium', 5, language)
          setQuizData(qz)
          setCurrentQuizIndex(0)
          setSelectedAnswers({})
          setQuizSubmitted(false)
          setQuizScore(0)
          break
        case 'faq':
          const fq = await aiService.generateStudioFaq(documentIds, language)
          setFaqData(fq)
          setOpenFaqIndex(null)
          break
      }
    } catch (err) {
      console.error(`Error generating ${tab}:`, err)
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }))
    }
  }

  // Flashcards flipping action
  const handleFlashcardClick = () => {
    setIsFlipped(!isFlipped)
  }

  const handleNextCard = () => {
    if (!flashcardsData) return
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % flashcardsData.length)
    }, 150)
  }

  const handlePrevCard = () => {
    if (!flashcardsData) return
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev - 1 + flashcardsData.length) % flashcardsData.length)
    }, 150)
  }

  // Quiz submission & check answers
  const handleSelectQuizAnswer = (optionIdx: number) => {
    if (quizSubmitted) return
    setSelectedAnswers(prev => ({ ...prev, [currentQuizIndex]: optionIdx }))
  }

  const handleNextQuestion = () => {
    if (!quizData) return
    if (currentQuizIndex < quizData.length - 1) {
      setCurrentQuizIndex(prev => prev + 1)
    } else {
      // Calculate final score
      let score = 0
      quizData.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.answerIndex) {
          score++
        }
      })
      setQuizScore(score)
      setQuizSubmitted(true)
    }
  }

  const handleRestartQuiz = () => {
    setCurrentQuizIndex(0)
    setSelectedAnswers({})
    setQuizSubmitted(false)
    setQuizScore(0)
  }

  const handleCardClick = (tab: TabType) => {
    setActiveDetail(tab)
    // Auto-generate if no data exists yet
    if (tab === 'summary' && !summaryData) handleGenerate('summary')
    else if (tab === 'mindmap' && !mindmapData) handleGenerate('mindmap')
    else if (tab === 'infographic' && !infographicData) handleGenerate('infographic')
    else if (tab === 'flashcards' && !flashcardsData) handleGenerate('flashcards')
    else if (tab === 'quiz' && !quizData) handleGenerate('quiz')
    else if (tab === 'faq' && !faqData) handleGenerate('faq')
  }

  // Render content depending on active tab
  const renderDetailContent = (tab: TabType) => {
    const isTabLoading = loading[tab]

    if (isTabLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
          <Loader2 className="size-10 text-[#2563eb] animate-spin mb-4" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">AI đang phân tích tài liệu...</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px]">Quá trình này có thể mất vài giây để tổng hợp dữ liệu học tập.</p>
        </div>
      )
    }

    switch (tab) {
      case 'summary':
        if (!summaryData) return renderGeneratePlaceholder('summary', 'Tạo Tóm Tắt')
        return (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Tóm tắt tổng quan</h4>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{summaryData.summaryText}</p>
            </div>
            
            {summaryData.keyBullets && summaryData.keyBullets.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left pl-1">Điểm cốt lõi cần nhớ</h4>
                {summaryData.keyBullets.map((bullet, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/30 dark:border-blue-900/10 rounded-xl text-left items-start">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white text-[10px] font-bold mt-0.5">{idx + 1}</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{bullet}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'mindmap':
        if (!mindmapData) return renderGeneratePlaceholder('mindmap', 'Vẽ Sơ Đồ Tư Duy')
        return (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <MindMapViewer code={mindmapData.mermaidCode} />
          </div>
        )

      case 'infographic':
        if (!infographicData) return renderGeneratePlaceholder('infographic', 'Tạo Đồ Họa Thông Tin')

        const infoPalettes = [
          { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200/60 dark:border-blue-800/40', text: 'text-blue-600 dark:text-blue-400', accent: 'bg-blue-500' },
          { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200/60 dark:border-violet-800/40', text: 'text-violet-600 dark:text-violet-400', accent: 'bg-violet-500' },
          { bg: 'from-rose-500 to-pink-600', light: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200/60 dark:border-rose-800/40', text: 'text-rose-600 dark:text-rose-400', accent: 'bg-rose-500' },
          { bg: 'from-amber-500 to-orange-500', light: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200/60 dark:border-amber-800/40', text: 'text-amber-600 dark:text-amber-400', accent: 'bg-amber-500' },
          { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200/60 dark:border-emerald-800/40', text: 'text-emerald-600 dark:text-emerald-400', accent: 'bg-emerald-500' },
        ]

        const getInfoIcon = (iconType: string) => {
          switch (iconType) {
            case 'brain': return '🧠'
            case 'lightbulb': return '💡'
            case 'chart': return '📊'
            case 'star': return '⭐'
            case 'rocket': return '🚀'
            case 'target': return '🎯'
            case 'book': return '📖'
            case 'check': return '✅'
            default: return '📌'
          }
        }

        return (
          <div className="flex flex-col gap-0 animate-in fade-in duration-200 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-lg">
            {/* ── Hero Header ── */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 px-5 py-6 text-white overflow-hidden">
              {/* decorative circles */}
              <div className="absolute -top-6 -right-6 size-28 rounded-full bg-white/10 blur-xl" />
              <div className="absolute bottom-0 left-0 size-20 rounded-full bg-white/5 blur-lg" />

              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-white/70 mb-2">
                  <span className="size-1.5 rounded-full bg-white/80 animate-pulse" />
                  ĐỒ HỌA THÔNG TIN · AI STUDIO
                </span>
                <h2 className="text-base font-extrabold leading-snug text-white drop-shadow-sm">{infographicData.title}</h2>
                <p className="text-xs text-white/75 mt-1.5 leading-relaxed font-medium">{infographicData.subtitle}</p>
              </div>
            </div>

            {/* ── Items ── */}
            <div className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              {infographicData.items.map((item, idx) => {
                const palette = infoPalettes[idx % infoPalettes.length]
                const totalItems = infographicData.items.length
                const progressPct = Math.round(((idx + 1) / totalItems) * 100)

                return (
                  <div key={idx} className="p-4 flex gap-3.5 items-start group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Left: Number badge */}
                    <div className={`flex flex-col items-center gap-1.5 shrink-0`}>
                      <div className={`size-10 rounded-xl bg-gradient-to-br ${palette.bg} flex items-center justify-center text-white font-black text-sm shadow-md`}>
                        {getInfoIcon(item.iconType)}
                      </div>
                      {/* connector line */}
                      {idx < infographicData.items.length - 1 && (
                        <div className={`w-0.5 h-4 ${palette.accent} opacity-25 rounded-full`} />
                      )}
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate">{item.label}</h4>
                        <span className={`shrink-0 text-xs font-black ${palette.text} tabular-nums`}>{item.value}</span>
                      </div>
                      <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">{item.description}</p>
                      {/* Progress bar */}
                      <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${palette.accent} rounded-full transition-all duration-700`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Footer tag ── */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LumiEdu AI Studio</span>
              <span className="text-[10px] font-semibold text-slate-400">{infographicData.items.length} điểm nổi bật</span>
            </div>
          </div>
        )


      case 'flashcards':
        if (!flashcardsData || flashcardsData.length === 0) return renderGeneratePlaceholder('flashcards', 'Tạo Thẻ Ghi Nhớ')
        const activeCard = flashcardsData[currentCardIndex]
        return (
          <div className="flex flex-col items-center gap-6 animate-in fade-in duration-200">
            {/* Flippable Card Container */}
            <div 
              onClick={handleFlashcardClick}
              className="w-full h-56 relative cursor-pointer perspective-1000 group"
            >
              <div className={cn(
                "w-full h-full rounded-2xl border transition-all duration-500 transform-style-3d relative flex items-center justify-center p-6 shadow-md select-none bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800",
                isFlipped ? "rotate-y-180" : ""
              )}>
                {/* Front Side */}
                <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-6 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4 select-none">MẶT TRƯỚC (CÂU HỎI)</span>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-normal max-w-xs">{activeCard.front}</p>
                  <span className="text-[11px] text-[#2563eb] font-semibold mt-6 group-hover:underline">Bấm để lật xem đáp án</span>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-4 select-none">MẶT SAU (ĐÁP ÁN)</span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed max-w-xs">{activeCard.back}</p>
                  <span className="text-[11px] text-slate-400 mt-6">Bấm để lật lại</span>
                </div>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between w-full max-w-xs bg-slate-100/50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800">
              <button 
                onClick={handlePrevCard}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-850 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <ChevronLeft className="size-4.5" />
              </button>
              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                Thẻ {currentCardIndex + 1} / {flashcardsData.length}
              </span>
              <button 
                onClick={handleNextCard}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-850 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <ChevronRight className="size-4.5" />
              </button>
            </div>
          </div>
        )

      case 'quiz':
        if (!quizData || quizData.length === 0) return renderGeneratePlaceholder('quiz', 'Tạo Bài Kiểm Tra')
        
        if (quizSubmitted) {
          const scorePercent = Math.round((quizScore / quizData.length) * 100)
          return (
            <div className="flex flex-col items-center gap-6 p-6 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl shadow-sm text-center animate-in zoom-in-95 duration-200">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-2xl">
                <Award className="size-12 text-[#2563eb]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-150">Kết quả bài trắc nghiệm</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Dựa trên nội dung tài liệu ôn tập</p>
              </div>

              <div className="flex items-baseline justify-center gap-1 mt-2">
                <span className="text-4xl font-mono font-black text-[#2563eb]">{quizScore}</span>
                <span className="text-slate-400 text-sm">/ {quizData.length} câu đúng</span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-[#2563eb] h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${scorePercent}%` }}
                />
              </div>

              <p className="text-sm font-medium text-slate-600 dark:text-slate-350">
                {scorePercent >= 80 ? 'Xuất sắc! Bạn nắm rất vững kiến thức.' : (scorePercent >= 60 ? 'Tốt! Hãy xem lại các câu chưa chính xác.' : 'Hãy đọc kỹ lại tài liệu và thử lại.')}
              </p>

              <button 
                onClick={handleRestartQuiz}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer active:scale-98 transition-all"
              >
                Làm lại Quiz
              </button>
            </div>
          )
        }

        const activeQ = quizData[currentQuizIndex]
        const hasAnswered = selectedAnswers[currentQuizIndex] !== undefined
        const userAnswer = selectedAnswers[currentQuizIndex]

        return (
          <div className="flex flex-col gap-5 text-left animate-in fade-in duration-200">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-[#2563eb]">CÂU HỎI {currentQuizIndex + 1} / {quizData.length}</span>
              <span className="text-[11px] font-semibold text-slate-400">Trắc nghiệm</span>
            </div>

            {/* Question Text */}
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-normal">{activeQ.questionText}</h4>

            {/* Options List */}
            <div className="flex flex-col gap-2.5">
              {activeQ.options.map((opt, idx) => {
                let buttonStyle = "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                let icon = null

                if (hasAnswered) {
                  if (idx === activeQ.answerIndex) {
                    buttonStyle = "border-emerald-500 bg-emerald-50/30 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                    icon = <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  } else if (idx === userAnswer) {
                    buttonStyle = "border-rose-500 bg-rose-50/30 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400"
                    icon = <XCircle className="size-4 text-rose-500 shrink-0" />
                  } else {
                    buttonStyle = "border-slate-100 dark:border-slate-850 opacity-50"
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectQuizAnswer(idx)}
                    disabled={hasAnswered}
                    className={cn(
                      "flex items-center gap-3 p-3 text-sm rounded-xl border font-semibold w-full text-left transition-all",
                      !hasAnswered && "cursor-pointer active:scale-99",
                      buttonStyle
                    )}
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-[10.5px] font-black">{String.fromCharCode(65 + idx)}</span>
                    <span className="flex-1 truncate">{opt}</span>
                    {icon}
                  </button>
                )
              })}
            </div>

            {/* Explanation box */}
            {hasAnswered && (
              <div className="p-4 bg-blue-50/30 dark:bg-blue-950/15 border border-blue-100/30 dark:border-blue-900/10 rounded-2xl animate-in slide-in-from-bottom-3 duration-250">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">GIẢI THÍCH</span>
                <p className="text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-350">{activeQ.explanation}</p>
              </div>
            )}

            {/* Next Button */}
            {hasAnswered && (
              <button 
                onClick={handleNextQuestion}
                className="w-full h-11 bg-slate-900 hover:bg-slate-850 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-black font-bold rounded-xl cursor-pointer shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>{currentQuizIndex < quizData.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành bài Quiz'}</span>
                <ChevronRight className="size-4" />
              </button>
            )}
          </div>
        )

      case 'faq':
        if (!faqData || faqData.length === 0) return renderGeneratePlaceholder('faq', 'Tạo Câu Hỏi Thường Gặp')
        return (
          <div className="flex flex-col gap-2.5 animate-in fade-in duration-200 text-left">
            {faqData.map((faq, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div 
                  key={idx} 
                  className="rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="flex items-center justify-between gap-4 p-3.5 w-full text-left font-bold text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronRight className={cn("size-4 opacity-50 shrink-0 transition-transform", isOpen && "rotate-90")} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1.5 border-t border-slate-50 dark:border-slate-800 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400 animate-in slide-in-from-top-1 duration-150">
                      {faq.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
    }
  }

  // Placeholder shown when no data exists for a tool
  const renderGeneratePlaceholder = (tab: TabType, label: string) => {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100/30 dark:border-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm mb-4">
          <Sparkles className="size-6 animate-pulse" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Sẵn sàng phân tích với AI</h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[220px]">Nhấp vào nút bên dưới để tạo tài liệu học tập thông minh dựa trên tài liệu nguồn đã chọn.</p>
        
        <button
          onClick={() => handleGenerate(tab)}
          disabled={documentIds.length === 0}
          className="mt-6 flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-white font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Sparkles className="size-3.5" />
          <span>{label}</span>
        </button>
      </div>
    )
  }

  const studioTools = [
    {
      id: 'summary' as TabType,
      title: 'Tổng quan bằng văn bản',
      desc: 'Tóm tắt chi tiết và các ý cốt lõi',
      icon: FileText,
      iconColor: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border border-blue-100/10',
      hoverBg: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/10',
    },
    {
      id: 'mindmap' as TabType,
      title: 'Bản đồ tư duy',
      desc: 'Sơ đồ hóa kiến thức trực quan',
      icon: BrainCircuit,
      iconColor: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border border-purple-100/10',
      hoverBg: 'hover:bg-purple-50/50 dark:hover:bg-purple-950/10',
    },
    {
      id: 'infographic' as TabType,
      title: 'Bản đồ họa thông tin',
      desc: 'Quy trình, số liệu & điểm lưu ý',
      icon: BarChart2,
      iconColor: 'text-pink-500 bg-pink-50 dark:bg-pink-950/40 border border-pink-100/10',
      hoverBg: 'hover:bg-pink-50/50 dark:hover:bg-pink-950/10',
    },
    {
      id: 'flashcards' as TabType,
      title: 'Thẻ ghi nhớ',
      desc: 'Học nhanh với thẻ lật 3D',
      icon: Layers,
      iconColor: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border border-orange-100/10',
      hoverBg: 'hover:bg-orange-50/50 dark:hover:bg-orange-950/10',
    },
    {
      id: 'quiz' as TabType,
      title: 'Bài kiểm tra',
      desc: 'Quiz trắc nghiệm tự đánh giá',
      icon: HelpCircle,
      iconColor: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/10',
      hoverBg: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10',
    },
    {
      id: 'faq' as TabType,
      title: 'Câu hỏi thường gặp',
      desc: 'FAQ giải đáp thắc mắc bài học',
      icon: FaqIcon,
      iconColor: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/10',
      hoverBg: 'hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10',
    }
  ]

  return (
    <div className="w-[380px] border-l border-slate-200/80 dark:border-slate-800 bg-[#f8fafc]/90 dark:bg-slate-950/90 backdrop-blur-md flex flex-col h-full overflow-hidden transition-all duration-300">
      {activeDetail === null ? (
        // Grid View
        <>
          {/* Header */}
          <div className="p-4 px-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/20">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">AI Studio</h3>
                <span className="text-[10px] text-slate-400 font-semibold uppercase font-mono tracking-wider block mt-0.5">Vở ôn tập thông minh</span>
              </div>
            </div>
          </div>

          {/* Banner */}
          <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100/10 dark:border-blue-900/10 rounded-2xl flex items-start justify-between gap-3 text-left shadow-2xs">
            <div className="flex gap-2.5">
              <span className="text-base">✨</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Tùy chỉnh bản đồ học tập</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">
                  Chọn một trong các chế độ dưới đây để tự động phân tích và tạo nội dung học từ tài liệu.
                </span>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-850 [&::-webkit-scrollbar-thumb]:rounded-full">
            {studioTools.map((tool) => {
              const Icon = tool.icon
              const hasData = (tool.id === 'summary' && summaryData) ||
                              (tool.id === 'mindmap' && mindmapData) ||
                              (tool.id === 'infographic' && infographicData) ||
                              (tool.id === 'flashcards' && flashcardsData) ||
                              (tool.id === 'quiz' && quizData) ||
                              (tool.id === 'faq' && faqData)

              return (
                <button
                  key={tool.id}
                  onClick={() => handleCardClick(tool.id)}
                  className={cn(
                    "group relative flex flex-col justify-between p-4 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer h-[125px] overflow-hidden",
                    tool.hoverBg
                  )}
                >
                  {/* Top: Icon and Status Badge */}
                  <div className="flex items-start justify-between w-full">
                    <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105", tool.iconColor)}>
                      <Icon className="size-4.5" />
                    </div>
                    {hasData && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full border border-emerald-100/30 dark:border-emerald-900/20">
                        <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                        Đã tạo
                      </span>
                    )}
                  </div>
                  
                  {/* Bottom: Text Info */}
                  <div className="mt-2">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#2563eb] dark:group-hover:text-blue-450 transition-colors leading-tight">{tool.title}</h4>
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 block font-medium leading-tight truncate">{tool.desc}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="p-4 px-5 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 text-left">
            <p className="text-[10px] font-semibold leading-relaxed text-slate-450 dark:text-slate-500">
              Đầu ra của Studio sẽ được hiển thị tại đây. Sau khi đính kèm nguồn, hãy chọn công cụ để tạo Tóm tắt, Bản đồ tư duy, Quiz và nhiều thông tin khác!
            </p>
          </div>
        </>
      ) : (
        // Detail View
        <>
          {/* Detail Header */}
          <div className="p-4 px-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
            <button
              onClick={() => setActiveDetail(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Quay lại Studio</span>
            </button>

            {/* Regenerate Button */}
            {((activeDetail === 'summary' && summaryData) ||
              (activeDetail === 'mindmap' && mindmapData) ||
              (activeDetail === 'infographic' && infographicData) ||
              (activeDetail === 'flashcards' && flashcardsData) ||
              (activeDetail === 'quiz' && quizData) ||
              (activeDetail === 'faq' && faqData)) && !loading[activeDetail] && (
              <button
                onClick={() => handleGenerate(activeDetail)}
                className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-350 dark:hover:text-white transition-all cursor-pointer border border-slate-205 dark:border-slate-850"
                title="Tạo lại dữ liệu mới"
              >
                <RefreshCw className="size-3 animate-hover-spin" />
                <span>Tạo lại</span>
              </button>
            )}
          </div>

          {/* Detail Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            {renderDetailContent(activeDetail)}
          </div>
        </>
      )}
    </div>
  )
}
