import { useState, useMemo } from 'react'
import { FileText, Loader2, Sparkles, Copy, RefreshCw, Check, BookOpen, Download, AlertTriangle, ShieldCheck } from 'lucide-react'
import { useStudioSummaryMutation, getSortedDocIdsKey } from '@/hooks/useAiStudioQueries'
import { useAiWorkspaceStore } from '@/stores/aiWorkspaceStore'
import { useToast } from '@/components/ui/Toast'
import { mapAiErrorCodeToMessage } from '@/utils/aiErrorMapper'
import { StudioSummaryResponse } from '@/services/aiService'
import { SourceCitationsView } from '../SourceCitationsView'

export function TabSummary() {
  const toast = useToast()
  const { selectedDocumentIds, language } = useAiWorkspaceStore()
  
  const [summaryData, setSummaryData] = useState<StudioSummaryResponse | null>(null)
  const [summaryDocIdsKey, setSummaryDocIdsKey] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const summaryMutation = useStudioSummaryMutation()

  const currentDocIdsKey = useMemo(() => getSortedDocIdsKey(selectedDocumentIds), [selectedDocumentIds])

  const isStale = useMemo(() => {
    return !!summaryData && summaryDocIdsKey !== '' && summaryDocIdsKey !== currentDocIdsKey
  }, [summaryData, summaryDocIdsKey, currentDocIdsKey])

  const handleGenerate = (forceRegenerate = false) => {
    if (selectedDocumentIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 tài liệu.')
      return
    }

    summaryMutation.mutate(
      { documentIds: selectedDocumentIds, language, forceRegenerate },
      {
        onSuccess: (res) => {
          setSummaryData(res)
          setSummaryDocIdsKey(currentDocIdsKey)
          toast.success(forceRegenerate ? 'Đã tạo lại bản tóm tắt!' : 'Đã tạo bản tóm tắt thành công!')
        },
        onError: (err) => {
          toast.error(mapAiErrorCodeToMessage(err))
        },
      }
    )
  }

  const handleCopy = () => {
    if (!summaryData) return
    const text = `${summaryData.summaryText}\n\nCác điểm cốt lõi:\n` + summaryData.keyBullets.map((b) => `- ${b}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Đã sao chép tổng quan!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportPdf = () => {
    if (!summaryData) return
    
    // Create print window for PDF export
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Không thể mở cửa sổ in PDF. Vui lòng cho phép popup.')
      return
    }

    const bulletsHtml = summaryData.keyBullets.map((b) => `<li style="margin-bottom:8px;">${b}</li>`).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tóm tắt học tập - LumiEdu AI Studio</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            h1 { font-size: 24px; color: #0f172a; margin-bottom: 8px; }
            .subtitle { font-size: 13px; color: #64748b; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; pb: 16px; }
            .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #2563eb; margin-top: 24px; margin-bottom: 12px; }
            .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; font-size: 14px; white-space: pre-wrap; }
            ul { padding-left: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>Tóm Tắt Tổng Quan Học Tập</h1>
          <div class="subtitle">Xuất từ LumiEdu AI Studio - ${new Date().toLocaleDateString('vi-VN')}</div>
          
          <div class="section-title">1. Nội dung tóm tắt</div>
          <div class="summary-box">${summaryData.summaryText}</div>

          <div class="section-title">2. Các điểm cốt lõi cần ghi nhớ</div>
          <ul>${bulletsHtml}</ul>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (selectedDocumentIds.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="size-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-900/30">
          <BookOpen className="size-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
          Chưa chọn tài liệu
        </h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Vui lòng chọn ít nhất 1 tài liệu ở danh sách bên trái để xem bản tóm tắt tổng quan.
        </p>
      </div>
    )
  }

  if (summaryMutation.isPending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="size-8 text-blue-600 animate-spin mb-3" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          AI đang phân tích & tổng hợp tài liệu...
        </h3>
        <p className="text-xs text-slate-400 mt-1">Vui lòng chờ trong giây lát.</p>
      </div>
    )
  }

  if (!summaryData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-blue-600 dark:text-blue-400 mb-3 border border-blue-100/50 dark:border-blue-900/30">
          <Sparkles className="size-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
          Tạo tóm tắt AI từ tài liệu
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          AI sẽ tổng hợp các ý chính và các điểm cốt lõi từ {selectedDocumentIds.length} tài liệu bạn đã chọn.
        </p>
        <button
          id="generate-summary-btn"
          onClick={() => handleGenerate(false)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="size-4" />
          <span>Tạo tóm tắt ngay</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 text-left max-w-4xl mx-auto w-full scrollbar-thin">
      {/* ── Stale Warning Banner ── */}
      {isStale && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <span>Danh sách tài liệu đã thay đổi. Kết quả tóm tắt này thuộc ngữ cảnh trước đó.</span>
          </div>
          <button
            id="regenerate-stale-summary-btn"
            onClick={() => handleGenerate(true)}
            className="px-3 py-1 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            Cập nhật lại
          </button>
        </div>
      )}

      {/* ── Action Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Tổng quan nội dung học tập
          </h2>
          {summaryData.cached && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
              <ShieldCheck className="size-3" />
              Đã lưu bộ nhớ đệm
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            id="copy-summary-btn"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>

          <button
            id="export-pdf-summary-btn"
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <Download className="size-3.5 text-blue-500" />
            <span>Xuất PDF</span>
          </button>

          <button
            id="force-regenerate-summary-btn"
            onClick={() => handleGenerate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer shadow-xs"
          >
            <RefreshCw className="size-3.5" />
            <span>Tạo lại</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Summary Text Box */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Tóm tắt tổng quan
          </h3>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-medium whitespace-pre-wrap">
            {summaryData.summaryText}
          </p>

          {/* Source Citations */}
          {summaryData.sources && summaryData.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <SourceCitationsView sources={summaryData.sources} />
            </div>
          )}
        </div>

        {/* Key Bullets List */}
        {summaryData.keyBullets && summaryData.keyBullets.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">
              Các điểm cốt lõi cần ghi nhớ ({summaryData.keyBullets.length})
            </h3>
            {summaryData.keyBullets.map((bullet, idx) => (
              <div
                key={idx}
                id={`summary-bullet-${idx}`}
                className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/60 dark:border-blue-900/30"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-extrabold text-xs">
                  {idx + 1}
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed pt-0.5">
                  {bullet}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
