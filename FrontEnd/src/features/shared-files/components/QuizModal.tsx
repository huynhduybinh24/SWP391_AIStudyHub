import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, HelpCircle, CheckCircle, AlertCircle, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SharedFile } from './SharedFilesTable'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

interface QuizModalProps {
  isOpen: boolean
  onClose: () => void
  file: SharedFile | null
}

interface Question {
  id: number
  text: string
  options: string[]
  answerIndex: number
  explanation: string
}

export function QuizModal({ isOpen, onClose, file }: QuizModalProps) {
  const { language } = useTranslation()
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({})
  const [showResults, setShowResults] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Initial mock questions based on file name
  const getInitialQuestions = (): Question[] => {
    if (!file) return []
    if (file.name.includes('Biology')) {
      return [
        {
          id: 1,
          text: 'What are the main products generated during the Krebs Cycle (citric acid cycle)?',
          options: [
            'Glucose and O2',
            'ATP, NADH, FADH2, and CO2',
            'Lactic Acid and NAD+',
            'Pyruvate and Water'
          ],
          answerIndex: 1,
          explanation: 'The Krebs Cycle processes acetyl-CoA to yield ATP/GTP, electron carriers (NADH, FADH2), and carbon dioxide as waste.'
        },
        {
          id: 2,
          text: 'Where in the eukaryotic cell does Glycolysis take place?',
          options: [
            'Inside the mitochondrial matrix',
            'In the nucleus',
            'Within the rough endoplasmic reticulum',
            'In the cytoplasm'
          ],
          answerIndex: 3,
          explanation: 'Glycolysis is the anaerobic breakdown of glucose that occurs in the cytosol/cytoplasm of the cell.'
        },
        {
          id: 3,
          text: 'Which mitotic phase is characterized by chromosomes aligning along the equatorial plane of the cell?',
          options: [
            'Prophase',
            'Anaphase',
            'Metaphase',
            'Telophase'
          ],
          answerIndex: 2,
          explanation: 'During Metaphase, spindle fibers align the sister chromatids along the metaphase plate in the center of the cell.'
        }
      ]
    }

    if (file.name.includes('Physics')) {
      return [
        {
          id: 1,
          text: 'What does Ohm\'s Law state regarding current, voltage, and resistance?',
          options: [
            'V = I / R',
            'I = V * R',
            'V = I * R',
            'R = V * I'
          ],
          answerIndex: 2,
          explanation: 'Ohm\'s Law defines the relationship: Voltage (V) equals Current (I) multiplied by Resistance (R).'
        },
        {
          id: 2,
          text: 'In an electromagnetism lab, what does a voltage sweep typically verify?',
          options: [
            'Nuclear magnetic resonance rates',
            'Linear relationship between potential difference and electric current in ohmic resistors',
            'Speed of light in dense optical fiber cables',
            'The thermal capacity of surrounding glass insulators'
          ],
          answerIndex: 1,
          explanation: 'Sweeping voltage across a resistor helps plot current vs. voltage to determine resistance and confirm linear ohmic behavior.'
        }
      ]
    }

    // Default questions
    return [
      {
        id: 1,
        text: 'What is the primary action required for this shared document?',
        options: [
          'Review the contents and collaborate with teammates as requested',
          'Export and delete the original copies immediately',
          'Restrict all other users from seeing modifications',
          'Ignore the summary recommendations'
        ],
        answerIndex: 0,
        explanation: 'Workspace items are intended for collaborative reading, review, and AI synthesis.'
      },
      {
        id: 2,
        text: 'How can you ask the AI helper to analyze specific areas of this file?',
        options: [
          'Submit comments directly on the right panel or use "Ask AI anything" dialogs',
          'Send a physical printed request to the server rooms',
          'Rename the file to "ai_please_help"',
          'Press the Escape key multiple times'
        ],
        answerIndex: 0,
        explanation: 'The right panel contains actions like "Ask AI anything" and comments to request interactive document insights.'
      }
    ]
  }

  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen && file) {
      window.addEventListener('keydown', handleKeyDown)
      setQuestions(getInitialQuestions())
      setSelectedAnswers({})
      setShowResults(false)
      setCustomPrompt('')
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, file, onClose])

  const handleRegenerateQuiz = () => {
    if (!customPrompt.trim()) return
    setIsRegenerating(true)
    
    // Simulate API delay for AI generation
    setTimeout(() => {
      const lowerPrompt = customPrompt.toLowerCase()
      const isVi = lowerPrompt.includes('vi') || lowerPrompt.includes('dịch') || lowerPrompt.includes('tiếng')
      
      if (file?.name.includes('Biology')) {
        if (isVi) {
          setQuestions([
            {
              id: 1,
              text: 'Sản phẩm chính nào được sinh ra trong Chu trình Krebs (chu trình citric acid)?',
              options: [
                'Glucose và O2',
                'ATP, NADH, FADH2, và CO2',
                'Lactic Acid và NAD+',
                'Pyruvate và Nước'
              ],
              answerIndex: 1,
              explanation: 'Chu trình Krebs xử lý axetyl-CoA để tạo ra ATP/GTP, chất mang điện tử (NADH, FADH2) và khí CO2.'
            },
            {
              id: 2,
              text: 'Quá trình Đường phân (Glycolysis) diễn ra ở đâu trong tế bào nhân thực?',
              options: [
                'Bên trong chất nền ti thể',
                'Trong nhân tế bào',
                'Trong lưới nội chất hạt',
                'Trong bào tương (cytoplasm)'
              ],
              answerIndex: 3,
              explanation: 'Đường phân là quá trình phân giải kị khí glucose xảy ra trong bào tương của tế bào.'
            }
          ])
        } else {
          setQuestions([
            {
              id: 1,
              text: '[Advanced] Calculate the net ATP yield from one glucose molecule under aerobic conditions.',
              options: ['2 ATP', '4 ATP', '30-32 ATP', '36-38 ATP'],
              answerIndex: 2,
              explanation: 'Aerobic respiration yields around 30 to 32 net ATP molecules per glucose molecule in eukaryotic cells.'
            }
          ])
        }
      } else if (file?.name.includes('Physics')) {
        if (isVi) {
          setQuestions([
            {
              id: 1,
              text: 'Định luật Ohm phát biểu mối quan hệ giữa cường độ dòng điện, hiệu điện thế và điện trở như thế nào?',
              options: [
                'V = I / R',
                'I = V * R',
                'V = I * R',
                'R = V * I'
              ],
              answerIndex: 2,
              explanation: 'Định luật Ohm xác định hệ thức: Hiệu điện thế (V) bằng Cường độ dòng điện (I) nhân với Điện trở (R).'
            }
          ])
        } else {
          setQuestions([
            {
              id: 1,
              text: '[Advanced] Explain the physical significance of the Maxwell-Ampere equation.',
              options: [
                'Defines static electric fields',
                'Connects magnetic field circulation to both conduction current and displacement current',
                'Specifies magnetic monopole existence',
                'Describes thermal conduction in metals'
              ],
              answerIndex: 1,
              explanation: 'The Maxwell-Ampere law states that magnetic fields can be generated by electrical currents and changing electric fields.'
            }
          ])
        }
      } else {
        // Default
        if (isVi) {
          setQuestions([
            {
              id: 1,
              text: 'Hành động chính được khuyến nghị cho tài liệu được chia sẻ này là gì?',
              options: [
                'Đọc nội dung và thảo luận với đồng nghiệp',
                'Xuất và xóa các bản sao gốc ngay lập tức',
                'Ngăn chặn người dùng khác sửa đổi',
                'Bỏ qua các đề xuất tóm tắt'
              ],
              answerIndex: 0,
              explanation: 'Các tài nguyên dùng chung phục vụ đọc hiểu, nghiên cứu và thảo luận nhóm.'
            }
          ])
        } else {
          setQuestions([
            {
              id: 1,
              text: '[Refined] What is the primary collaboration standard for shared files?',
              options: ['Read, tag, and discuss insights', 'Delete immediately', 'Encrypt locally only', 'Archive offline'],
              answerIndex: 0,
              explanation: 'Files are meant to be reviewed and discussed collaboratively.'
            }
          ])
        }
      }
      
      setSelectedAnswers({})
      setShowResults(false)
      setIsRegenerating(false)
    }, 1500)
  }

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (showResults) return
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }))
  }

  const handleSubmitQuiz = () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      alert('Vui lòng trả lời toàn bộ các câu hỏi trước khi nộp bài!')
      return
    }
    setShowResults(true)
  }

  const handleReset = () => {
    setSelectedAnswers({})
    setShowResults(false)
  }

  // Calculate score
  const correctCount = questions.reduce((count, q) => {
    return selectedAnswers[q.id] === q.answerIndex ? count + 1 : count
  }, 0)

  const scorePercentage = Math.round((correctCount / questions.length) * 100)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative z-10 w-full max-w-[580px] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-left flex flex-col max-h-[85vh]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quiz-title"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            {/* Header */}
            <div className="flex gap-3.5 items-center mb-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                <HelpCircle className="size-5.5" />
              </div>
              <div>
                <h3 id="quiz-title" className="text-base font-extrabold text-slate-900 dark:text-white truncate max-w-[380px]">
                  AI Generated Quiz
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold mt-0.5 truncate max-w-[380px]">
                  Test your understanding of "{file.name}"
                </p>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-6 scrollbar-thin">
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4.5 rounded-2xl border flex items-center justify-between gap-4 mb-2 select-none",
                    scorePercentage >= 70 
                      ? "bg-emerald-50/40 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                      : "bg-amber-50/40 border-amber-100 dark:bg-amber-955/20 dark:border-amber-900/30 text-amber-800 dark:text-amber-405"
                  )}
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-black leading-none">
                      Quiz Completed!
                    </h4>
                    <p className="text-xs font-semibold opacity-90">
                      You answered {correctCount} of {questions.length} questions correctly.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black">{scorePercentage}%</span>
                  </div>
                </motion.div>
              )}

              {questions.map((q, idx) => {
                const selected = selectedAnswers[q.id];
                const isCorrect = selected === q.answerIndex;

                return (
                  <div key={q.id} className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-start gap-2">
                      <span className="flex size-5 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black shrink-0 text-slate-500">
                        {idx + 1}
                      </span>
                      <span className="leading-snug pt-0.5">{q.text}</span>
                    </h4>

                    <div className="grid grid-cols-1 gap-2 pl-7">
                      {q.options.map((opt, optIdx) => {
                        const isOptSelected = selected === optIdx;
                        const isCorrectOpt = q.answerIndex === optIdx;

                        let buttonClass = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800";
                        
                        if (showResults) {
                          if (isCorrectOpt) {
                            buttonClass = "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400";
                          } else if (isOptSelected && !isCorrect) {
                            buttonClass = "border-red-500 bg-red-50/20 dark:bg-red-955/20 text-red-750 dark:text-red-400";
                          } else {
                            buttonClass = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600 opacity-60";
                          }
                        } else if (isOptSelected) {
                          buttonClass = "border-[#3155F6] bg-blue-50/20 dark:bg-blue-955/20 text-[#3155F6] dark:text-blue-400 font-extrabold ring-1 ring-blue-500";
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            disabled={showResults}
                            className={cn(
                              "w-full text-left px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between select-none",
                              !showResults && "cursor-pointer active:scale-[0.99]",
                              buttonClass
                            )}
                          >
                            <span className="flex-1 pr-3">{opt}</span>
                            {showResults && isCorrectOpt && (
                              <CheckCircle className="size-4 text-emerald-500 shrink-0" />
                            )}
                            {showResults && isOptSelected && !isCorrect && (
                              <AlertCircle className="size-4 text-red-500 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {showResults && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pl-7 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850/30 p-3 rounded-xl border border-slate-100 dark:border-slate-850 leading-relaxed"
                      >
                        <strong className="text-slate-700 dark:text-slate-300">Explanation:</strong> {q.explanation}
                      </motion.div>
                    )}
                  </div>
                );
              })}

              {/* AI Customization Prompt */}
              <div className="mt-4 p-4.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/60 rounded-2xl space-y-2.5 select-none shrink-0">
                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-indigo-500" />
                  {language === 'vi' ? 'Tinh chỉnh Quiz bằng AI' : 'Refine Quiz with AI'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={language === 'vi' ? 'Ví dụ: Dịch câu hỏi sang tiếng Việt, nâng độ khó...' : 'e.g. Translate to Vietnamese, make it harder...'}
                    className="flex-1 px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-200"
                    disabled={isRegenerating}
                  />
                  <Button
                    type="button"
                    onClick={handleRegenerateQuiz}
                    disabled={isRegenerating || !customPrompt.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs px-3.5 font-bold flex items-center gap-1.5 shrink-0 h-8 cursor-pointer select-none"
                  >
                    {isRegenerating ? (
                      <RefreshCw className="size-3.5 animate-spin" />
                    ) : (
                      <span>{language === 'vi' ? 'Gửi' : 'Send'}</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800/80 mt-6 shrink-0">
              <div>
                {showResults ? (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 dark:text-slate-350 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
                  >
                    <RefreshCw className="size-3.5" />
                    <span>Try Again</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    {Object.keys(selectedAnswers).length} of {questions.length} answered
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-550 hover:bg-slate-50 dark:text-slate-355 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                {!showResults ? (
                  <Button
                    type="button"
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(selectedAnswers).length < questions.length}
                    className="bg-[#3155F6] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-500/10 disabled:opacity-50"
                  >
                    Submit Answers
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={onClose}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                  >
                    Done
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default QuizModal;
