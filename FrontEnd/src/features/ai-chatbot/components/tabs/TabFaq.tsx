import { useState, useMemo } from 'react'
import {
  HelpCircle, ChevronRight, Copy, RefreshCw, Loader2, BookOpen, Check,
  Search, Sparkles, AlertTriangle, ShieldCheck, ChevronsUpDown
} from 'lucide-react'
import { useStudioFaqMutation, getSortedDocIdsKey } from '@/hooks/useAiStudioQueries'
import { useAiWorkspaceStore } from '@/stores/aiWorkspaceStore'
import { useToast } from '@/components/ui/Toast'
import { mapAiErrorCodeToMessage } from '@/utils/aiErrorMapper'
import { StudioFaqResponse } from '@/services/aiService'

export function TabFaq() {
  const toast = useToast()
  const { selectedDocumentIds, language } = useAiWorkspaceStore()

  const [faqData, setFaqData] = useState<StudioFaqResponse[]>([])
  const [faqDocIdsKey, setFaqDocIdsKey] = useState<string>('')
  const [openIndexes, setOpenIndexes] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [copied, setCopied] = useState(false)

  const faqMutation = useStudioFaqMutation()

  const currentDocIdsKey = useMemo(() => getSortedDocIdsKey(selectedDocumentIds), [selectedDocumentIds])

  const isStale = useMemo(() => {
    return faqData.length > 0 && faqDocIdsKey !== '' && faqDocIdsKey !== currentDocIdsKey
  }, [faqData.length, faqDocIdsKey, currentDocIdsKey])

  const handleGenerate = (forceRegenerate = false) => {
    if (selectedDocumentIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 tài liệu.')
      return
    }

    faqMutation.mutate(
      { documentIds: selectedDocumentIds, language, forceRegenerate },
      {
        onSuccess: (res) => {
          setFaqData(res || [])
          setFaqDocIdsKey(currentDocIdsKey)
          setOpenIndexes([0]) // open first item by default
          toast.success(forceRegenerate ? 'Đã tạo lại FAQ!' : 'Đã tạo danh sách FAQ thành công!')
        },
        onError: (err) => {
          toast.error(mapAiErrorCodeToMessage(err))
        },
      }
    )
  }

  const toggleItem = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    )
  }

  const handleToggleExpandAll = () => {
    if (openIndexes.length === faqData.length) {
      setOpenIndexes([])
    } else {
      setOpenIndexes(faqData.map((_, i) => i))
    }
  }

  const handleCopyAll = () => {
    if (faqData.length === 0) return
    const text = faqData.map((f, i) => `Q${i + 1}: ${f.question}\nA: ${f.answer}`).join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Đã sao chép tất cả câu hỏi FAQ!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopySingle = (faq: StudioFaqResponse) => {
    navigator.clipboard.writeText(`Q: ${faq.question}\nA: ${faq.answer}`)
    toast.success('Đã sao chép câu hỏi!')
  }

  const filteredFaq = useMemo(() => {
    if (!searchQuery.trim()) return faqData
    const q = searchQuery.toLowerCase()
    return faqData.filter(
      (item) =>
        item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
    )
  }, [faqData, searchQuery])

  if (selectedDocumentIds.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="size-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900/30">
          <BookOpen className="size-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
          Chưa chọn tài liệu
        </h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Vui lòng chọn ít nhất 1 tài liệu ở danh sách bên trái để tổng hợp câu hỏi FAQ.
        </p>
      </div>
    )
  }

  if (faqMutation.isPending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="size-8 text-indigo-600 animate-spin mb-3" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          AI đang phân tích & tạo câu hỏi thường gặp...
        </h3>
        <p className="text-xs text-slate-400 mt-1">Vui lòng chờ trong giây lát.</p>
      </div>
    )
  }

  if (faqData.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl text-indigo-600 dark:text-indigo-400 mb-3 border border-indigo-100/50 dark:border-indigo-900/30">
          <Sparkles className="size-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
          Tạo danh sách FAQ AI
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Hệ thống sẽ tổng hợp các câu hỏi thắc mắc phổ biến và lời giải đáp ngắn gọn từ các tài liệu đã chọn.
        </p>
        <button
          id="generate-faq-btn"
          onClick={() => handleGenerate(false)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="size-4" />
          <span>Tạo FAQ ngay</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 text-left max-w-3xl mx-auto w-full scrollbar-thin">
      {/* ── Stale Context Warning Banner ── */}
      {isStale && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <span>Danh sách tài liệu đã thay đổi. Danh sách FAQ này thuộc ngữ cảnh trước đó.</span>
          </div>
          <button
            id="regenerate-stale-faq-btn"
            onClick={() => handleGenerate(true)}
            className="px-3 py-1 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            Cập nhật lại
          </button>
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <HelpCircle className="size-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Câu hỏi thường gặp ({faqData.length})
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="toggle-expand-all-faq-btn"
            onClick={handleToggleExpandAll}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 cursor-pointer"
          >
            <ChevronsUpDown className="size-3.5 text-indigo-500" />
            <span>{openIndexes.length === faqData.length ? 'Thu gọn' : 'Mở tất cả'}</span>
          </button>

          <button
            id="copy-all-faq-btn"
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            <span>{copied ? 'Đã chép' : 'Sao chép tất cả'}</span>
          </button>

          <button
            id="force-regenerate-faq-btn"
            onClick={() => handleGenerate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            <RefreshCw className="size-3.5" />
            <span>Tạo lại</span>
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input
          id="faq-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm nội dung câu hỏi FAQ..."
          className="w-full h-10 pl-10 pr-4 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* ── Accordion List ── */}
      <div className="flex flex-col gap-3">
        {filteredFaq.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            Không tìm thấy câu hỏi FAQ phù hợp với từ khóa.
          </div>
        ) : (
          filteredFaq.map((faq, idx) => {
            const isOpen = openIndexes.includes(idx)
            return (
              <div
                key={idx}
                id={`faq-item-${idx}`}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  id={`faq-accordion-toggle-${idx}`}
                  onClick={() => toggleItem(idx)}
                  className="flex items-center justify-between gap-4 p-4 w-full text-left font-bold text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                >
                  <span className="flex items-start gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-black mt-0.5">
                      ?
                    </span>
                    <span>{faq.question}</span>
                  </span>
                  <ChevronRight
                    className={`size-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300 pl-11 flex flex-col gap-2">
                    <p>{faq.answer}</p>
                    <div className="flex justify-end pt-1">
                      <button
                        id={`copy-single-faq-${idx}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopySingle(faq)
                        }}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="size-3" />
                        <span>Sao chép câu này</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
