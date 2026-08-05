import { useState, useMemo, useEffect } from 'react'
import {
  Layers, ChevronLeft, ChevronRight, RotateCw, Loader2, BookOpen,
  RefreshCw, Shuffle, CheckCircle2, HelpCircle, Grid, LayoutList,
  Sparkles, AlertTriangle, ShieldCheck, Eye, EyeOff
} from 'lucide-react'
import { useStudioFlashcardsMutation, getSortedDocIdsKey } from '@/hooks/useAiStudioQueries'
import { useAiWorkspaceStore } from '@/stores/aiWorkspaceStore'
import { useToast } from '@/components/ui/Toast'
import { mapAiErrorCodeToMessage } from '@/utils/aiErrorMapper'
import { StudioFlashcardResponse } from '@/services/aiService'
import { cn } from '@/lib/utils'

type FlashcardViewMode = 'card' | 'grid' | 'list'

export function TabFlashcards() {
  const toast = useToast()
  const { selectedDocumentIds, language } = useAiWorkspaceStore()

  const [cards, setCards] = useState<StudioFlashcardResponse[]>([])
  const [cardsDocIdsKey, setCardsDocIdsKey] = useState<string>('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [viewMode, setViewMode] = useState<FlashcardViewMode>('card')
  const [rememberedMap, setRememberedMap] = useState<Record<number, boolean>>({})

  const flashcardsMutation = useStudioFlashcardsMutation()

  const currentDocIdsKey = useMemo(() => getSortedDocIdsKey(selectedDocumentIds), [selectedDocumentIds])

  const isStale = useMemo(() => {
    return cards.length > 0 && cardsDocIdsKey !== '' && cardsDocIdsKey !== currentDocIdsKey
  }, [cards.length, cardsDocIdsKey, currentDocIdsKey])

  // Load local progress when context changes
  useEffect(() => {
    if (cardsDocIdsKey) {
      const saved = localStorage.getItem(`flashcards_progress_${cardsDocIdsKey}`)
      if (saved) {
        try {
          setRememberedMap(JSON.parse(saved))
        } catch {
          setRememberedMap({})
        }
      }
    }
  }, [cardsDocIdsKey])

  const saveRememberedMap = (updated: Record<number, boolean>) => {
    setRememberedMap(updated)
    if (cardsDocIdsKey) {
      localStorage.setItem(`flashcards_progress_${cardsDocIdsKey}`, JSON.stringify(updated))
    }
  }

  const handleGenerate = (forceRegenerate = false) => {
    if (selectedDocumentIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 tài liệu.')
      return
    }

    flashcardsMutation.mutate(
      { documentIds: selectedDocumentIds, language, forceRegenerate },
      {
        onSuccess: (res) => {
          setCards(res || [])
          setCardsDocIdsKey(currentDocIdsKey)
          setCurrentIndex(0)
          setIsFlipped(false)
          setRememberedMap({})
          toast.success(forceRegenerate ? 'Đã tạo lại bộ thẻ!' : 'Đã tạo bộ thẻ ghi nhớ thành công!')
        },
        onError: (err) => {
          toast.error(mapAiErrorCodeToMessage(err))
        },
      }
    )
  }

  const handlePrev = () => {
    if (cards.length === 0) return
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
  }

  const handleNext = () => {
    if (cards.length === 0) return
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % cards.length)
  }

  const handleShuffle = () => {
    if (cards.length === 0) return
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
    toast.success('Đã xáo trộn thứ tự thẻ!')
  }

  const toggleRemembered = (idx: number) => {
    const nextState = !rememberedMap[idx]
    const updated = { ...rememberedMap, [idx]: nextState }
    saveRememberedMap(updated)
  }

  const handleResetProgress = () => {
    setRememberedMap({})
    if (cardsDocIdsKey) {
      localStorage.removeItem(`flashcards_progress_${cardsDocIdsKey}`)
    }
    toast.success('Đã đặt lại tiến trình học!')
  }

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'card' || cards.length === 0) return
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.key === ' ') {
        e.preventDefault()
        setIsFlipped((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewMode, cards.length, currentIndex])

  const rememberedCount = useMemo(() => {
    return Object.values(rememberedMap).filter(Boolean).length
  }, [rememberedMap])

  if (selectedDocumentIds.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="size-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center mb-4 border border-orange-100 dark:border-orange-900/30">
          <BookOpen className="size-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
          Chưa chọn tài liệu
        </h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Vui lòng chọn ít nhất 1 tài liệu ở danh sách bên trái để tạo thẻ ghi nhớ.
        </p>
      </div>
    )
  }

  if (flashcardsMutation.isPending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="size-8 text-orange-600 animate-spin mb-3" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          AI đang trích xuất thẻ ghi nhớ từ tài liệu...
        </h3>
        <p className="text-xs text-slate-400 mt-1">Vui lòng chờ trong giây lát.</p>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="p-3.5 bg-orange-50 dark:bg-orange-950/40 rounded-2xl text-orange-600 dark:text-orange-400 mb-3 border border-orange-100/50 dark:border-orange-900/30">
          <Sparkles className="size-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
          Tạo thẻ ghi nhớ Flashcard
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Hệ thống sẽ tự động tổng hợp các cặp Câu hỏi & Đáp án ngắn gọn giúp bạn ôn luyện hiệu quả.
        </p>
        <button
          id="generate-flashcards-btn"
          onClick={() => handleGenerate(false)}
          className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="size-4" />
          <span>Tạo thẻ ghi nhớ ngay</span>
        </button>
      </div>
    )
  }

  const activeCard = cards[currentIndex]

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 text-left max-w-4xl mx-auto w-full flex flex-col justify-between scrollbar-thin">
      <div>
        {/* ── Stale Context Warning Banner ── */}
        {isStale && (
          <div className="mb-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="size-4 text-amber-600 shrink-0" />
              <span>Danh sách tài liệu đã thay đổi. Kết quả bộ thẻ này thuộc ngữ cảnh trước đó.</span>
            </div>
            <button
              id="regenerate-stale-flashcards-btn"
              onClick={() => handleGenerate(true)}
              className="px-3 py-1 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              Cập nhật lại
            </button>
          </div>
        )}

        {/* ── Top Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-orange-500" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Thẻ ghi nhớ ({cards.length})
            </h2>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
              Đã thuộc: {rememberedCount} / {cards.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                id="view-card-mode-btn"
                onClick={() => setViewMode('card')}
                className={cn(
                  'px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1',
                  viewMode === 'card'
                    ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                )}
                title="Học thẻ 3D"
              >
                <Layers className="size-3.5" />
                <span className="hidden sm:inline">Học thẻ</span>
              </button>
              <button
                id="view-grid-mode-btn"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1',
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                )}
                title="Xem lưới"
              >
                <Grid className="size-3.5" />
                <span className="hidden sm:inline">Lưới</span>
              </button>
              <button
                id="view-list-mode-btn"
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1',
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                )}
                title="Danh sách"
              >
                <LayoutList className="size-3.5" />
                <span className="hidden sm:inline">Danh sách</span>
              </button>
            </div>

            <button
              id="shuffle-flashcards-btn"
              onClick={handleShuffle}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              title="Xáo trộn thẻ"
            >
              <Shuffle className="size-4 text-orange-500" />
            </button>

            <button
              id="force-regenerate-flashcards-btn"
              onClick={() => handleGenerate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              <RefreshCw className="size-3.5" />
              <span>Tạo lại</span>
            </button>
          </div>
        </div>

        {/* ── CARD MODE ── */}
        {viewMode === 'card' && activeCard && (
          <div className="my-6 flex flex-col items-center">
            <div
              id="flashcard-3d-wrapper"
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full max-w-lg h-72 cursor-pointer perspective-1000 select-none"
            >
              <div
                className={`w-full h-full rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-8 flex flex-col items-center justify-center text-center transition-all duration-500 transform-style-3d relative ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* Front side (Question) */}
                <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Mặt trước (Câu hỏi)
                  </span>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                    {activeCard.front}
                  </p>
                  <span className="text-xs font-semibold text-orange-500 mt-6 flex items-center gap-1">
                    <RotateCw className="size-3.5" /> Bấm hoặc phím Space để lật đáp án
                  </span>
                </div>

                {/* Back side (Answer) */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-4">
                    Mặt sau (Đáp án)
                  </span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                    {activeCard.back}
                  </p>
                  <span className="text-xs text-slate-400 mt-6">Bấm để lật lại</span>
                </div>
              </div>
            </div>

            {/* Remembered Status Toggle */}
            <div className="mt-4 flex items-center gap-3">
              <button
                id="toggle-remembered-btn"
                onClick={() => toggleRemembered(currentIndex)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border',
                  rememberedMap[currentIndex]
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300'
                )}
              >
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>{rememberedMap[currentIndex] ? 'Đã thuộc thẻ này' : 'Đánh dấu đã thuộc'}</span>
              </button>
            </div>

            {/* Navigation Controls Bar */}
            <div className="flex items-center justify-between w-full max-w-lg mt-5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <button
                id="prev-flashcard-btn"
                onClick={handlePrev}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                title="Thẻ trước (Phím Mũi tên trái)"
              >
                <ChevronLeft className="size-5 text-slate-700 dark:text-slate-200" />
              </button>

              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                Thẻ {currentIndex + 1} / {cards.length}
              </span>

              <button
                id="next-flashcard-btn"
                onClick={handleNext}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                title="Thẻ tiếp theo (Phím Mũi tên phải)"
              >
                <ChevronRight className="size-5 text-slate-700 dark:text-slate-200" />
              </button>
            </div>
          </div>
        )}

        {/* ── GRID MODE ── */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            {cards.map((card, idx) => {
              const isRem = rememberedMap[idx]
              return (
                <div
                  key={idx}
                  id={`flashcard-grid-item-${idx}`}
                  className={cn(
                    'p-4 rounded-2xl border transition-all bg-white dark:bg-slate-900 flex flex-col justify-between text-left',
                    isRem ? 'border-emerald-300 dark:border-emerald-800/60' : 'border-slate-200/80 dark:border-slate-800'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded">
                        Thẻ #{idx + 1}
                      </span>
                      <button
                        onClick={() => toggleRemembered(idx)}
                        className="text-xs font-semibold text-slate-400 hover:text-emerald-600 cursor-pointer"
                      >
                        {isRem ? <CheckCircle2 className="size-4 text-emerald-500" /> : <HelpCircle className="size-4" />}
                      </button>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-2">
                      {card.front}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-2 leading-relaxed">
                      {card.back}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── LIST MODE ── */}
        {viewMode === 'list' && (
          <div className="flex flex-col gap-3 my-4">
            {cards.map((card, idx) => (
              <div
                key={idx}
                id={`flashcard-list-item-${idx}`}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-4 text-left"
              >
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">
                    CÂU HỎI #{idx + 1}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                    {card.front}
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-600 block mb-0.5">ĐÁP ÁN:</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {card.back}
                  </p>
                </div>
                <button
                  onClick={() => toggleRemembered(idx)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer"
                >
                  <CheckCircle2 className={cn('size-4', rememberedMap[idx] ? 'text-emerald-500' : 'text-slate-300')} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset Progress Footer */}
      {Object.keys(rememberedMap).length > 0 && (
        <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 flex justify-end">
          <button
            id="reset-flashcards-progress-btn"
            onClick={handleResetProgress}
            className="text-xs text-rose-500 hover:underline font-semibold cursor-pointer"
          >
            Đặt lại tiến trình học
          </button>
        </div>
      )}
    </div>
  )
}
