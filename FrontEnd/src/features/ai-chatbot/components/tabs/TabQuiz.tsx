import { useState, useMemo } from 'react'
import {
  HelpCircle, CheckCircle2, XCircle, Award, Loader2, RefreshCw,
  BookOpen, ChevronRight, RotateCcw, Sparkles, AlertTriangle, ShieldCheck
} from 'lucide-react'
import { useStudioQuizMutation, getSortedDocIdsKey } from '@/hooks/useAiStudioQueries'
import { useAiWorkspaceStore } from '@/stores/aiWorkspaceStore'
import { useToast } from '@/components/ui/Toast'
import { mapAiErrorCodeToMessage } from '@/utils/aiErrorMapper'
import { StudioQuizResponse } from '@/services/aiService'

export function TabQuiz() {
  const toast = useToast()
  const { selectedDocumentIds, language } = useAiWorkspaceStore()

  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [count, setCount] = useState<number>(5)

  const [quizData, setQuizData] = useState<StudioQuizResponse[]>([])
  const [quizDocIdsKey, setQuizDocIdsKey] = useState<string>('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)

  const quizMutation = useStudioQuizMutation()

  const currentDocIdsKey = useMemo(() => getSortedDocIdsKey(selectedDocumentIds), [selectedDocumentIds])

  const isStale = useMemo(() => {
    return quizData.length > 0 && quizDocIdsKey !== '' && quizDocIdsKey !== currentDocIdsKey
  }, [quizData.length, quizDocIdsKey, currentDocIdsKey])

  const handleGenerate = (forceRegenerate = false) => {
    if (selectedDocumentIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 tài liệu.')
      return
    }

    quizMutation.mutate(
      {
        documentIds: selectedDocumentIds,
        difficulty,
        count,
        language,
        forceRegenerate,
      },
      {
        onSuccess: (res) => {
          setQuizData(res || [])
          setQuizDocIdsKey(currentDocIdsKey)
          setCurrentIndex(0)
          setSelectedAnswers({})
          setIsSubmitted(false)
          toast.success(forceRegenerate ? 'Đã tạo lại bài Quiz!' : 'Đã tạo bài Quiz thành công!')
        },
        onError: (err) => {
          toast.error(mapAiErrorCodeToMessage(err))
        },
      }
    )
  }

  const handleSelectAnswer = (optionIdx: number) => {
    if (isSubmitted) return
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optionIdx }))
  }

  const handleNextQuestion = () => {
    if (currentIndex < quizData.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setIsSubmitted(true)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setSelectedAnswers({})
    setIsSubmitted(false)
  }

  const calculateScore = () => {
    let score = 0
    quizData.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answerIndex) score++
    })
    return score
  }

  if (selectedDocumentIds.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="size-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-900/30">
          <BookOpen className="size-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
          Chưa chọn tài liệu
        </h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Vui lòng chọn ít nhất 1 tài liệu ở danh sách bên trái để tạo bài kiểm tra.
        </p>
      </div>
    )
  }

  if (quizMutation.isPending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="size-8 text-emerald-600 animate-spin mb-3" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          AI đang biên soạn câu hỏi trắc nghiệm...
        </h3>
        <p className="text-xs text-slate-400 mt-1">Vui lòng chờ trong giây lát.</p>
      </div>
    )
  }

  if (quizData.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-600 dark:text-emerald-400 mb-3 border border-emerald-100/50 dark:border-emerald-900/30">
          <Sparkles className="size-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
          Tạo bài kiểm tra Quiz AI
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          AI sẽ tự động sinh câu hỏi trắc nghiệm từ nội dung các tài liệu bạn đã chọn.
        </p>
        <button
          id="generate-quiz-btn"
          onClick={() => handleGenerate(false)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="size-4" />
          <span>Tạo bài Quiz ngay</span>
        </button>
      </div>
    )
  }

  const activeQuestion = quizData[currentIndex]
  const hasAnswered = selectedAnswers[currentIndex] !== undefined
  const userAnswer = selectedAnswers[currentIndex]

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 text-left max-w-3xl mx-auto w-full scrollbar-thin">
      {/* ── Stale Warning Banner ── */}
      {isStale && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <span>Danh sách tài liệu đã thay đổi. Bài Quiz này thuộc ngữ cảnh trước đó.</span>
          </div>
          <button
            id="regenerate-stale-quiz-btn"
            onClick={() => handleGenerate(true)}
            className="px-3 py-1 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            Cập nhật lại
          </button>
        </div>
      )}

      {/* ── Top Bar Controls ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <HelpCircle className="size-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Bài kiểm tra (Quiz)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Difficulty selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            {(['easy', 'medium', 'hard'] as const).map((diff) => (
              <button
                key={diff}
                id={`diff-btn-${diff}`}
                onClick={() => setDifficulty(diff)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  difficulty === diff
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {diff === 'easy' ? 'Dễ' : diff === 'medium' ? 'Vừa' : 'Khó'}
              </button>
            ))}
          </div>

          {/* Count selector */}
          <select
            id="quiz-count-select"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="h-8 px-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200"
          >
            <option value={5}>5 câu</option>
            <option value={10}>10 câu</option>
            <option value={15}>15 câu</option>
          </select>

          <button
            id="force-regenerate-quiz-btn"
            onClick={() => handleGenerate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            <RefreshCw className="size-3.5" />
            <span>Tạo lại</span>
          </button>
        </div>
      </div>

      {/* ── Result Screen ── */}
      {isSubmitted ? (
        <div className="flex flex-col items-center gap-5 p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl text-center shadow-md my-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-600">
            <Award className="size-12" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Kết quả bài kiểm tra
            </h3>
            <p className="text-xs text-slate-400 mt-1">Đánh giá dựa trên các tài liệu đã chọn</p>
          </div>

          <div className="flex items-baseline gap-1 my-2">
            <span className="text-4xl font-black font-mono text-emerald-600">
              {calculateScore()}
            </span>
            <span className="text-sm font-bold text-slate-400">/ {quizData.length} câu đúng</span>
          </div>

          <button
            id="restart-quiz-btn"
            onClick={handleRestart}
            className="w-full max-w-xs h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
          >
            <RotateCcw className="size-4" />
            <span>Làm lại Quiz</span>
          </button>
        </div>
      ) : activeQuestion ? (
        /* ── Active Question Card ── */
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span>CÂU HỎI {currentIndex + 1} / {quizData.length}</span>
            <span className="text-emerald-600 uppercase font-mono">{difficulty}</span>
          </div>

          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
            {activeQuestion.questionText}
          </h3>

          {/* Options */}
          <div className="flex flex-col gap-2.5 my-2">
            {activeQuestion.options.map((opt, idx) => {
              let style =
                'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              let icon = null

              if (hasAnswered) {
                if (idx === activeQuestion.answerIndex) {
                  style =
                    'border-emerald-500 bg-emerald-50/50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
                  icon = <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                } else if (idx === userAnswer) {
                  style =
                    'border-rose-500 bg-rose-50/50 text-rose-900 dark:bg-rose-950/30 dark:text-rose-300'
                  icon = <XCircle className="size-5 text-rose-500 shrink-0" />
                } else {
                  style = 'border-slate-100 dark:border-slate-850 opacity-50'
                }
              }

              return (
                <button
                  key={idx}
                  id={`quiz-option-${currentIndex}-${idx}`}
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={hasAnswered}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border font-semibold text-sm w-full text-left transition-all ${
                    !hasAnswered ? 'cursor-pointer active:scale-98' : ''
                  } ${style}`}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-300">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 leading-snug">{opt}</span>
                  {icon}
                </button>
              )
            })}
          </div>

          {/* Explanation reveal */}
          {hasAnswered && (
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-slate-850 border border-blue-100 dark:border-slate-800 text-xs leading-relaxed animate-in fade-in">
              <span className="font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider block mb-1">
                Giải thích chi tiết:
              </span>
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                {activeQuestion.explanation}
              </p>
            </div>
          )}

          {/* Next Button */}
          {hasAnswered && (
            <button
              id="next-quiz-question-btn"
              onClick={handleNextQuestion}
              className="w-full h-11 mt-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <span>
                {currentIndex < quizData.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành bài Quiz'}
              </span>
              <ChevronRight className="size-4" />
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
