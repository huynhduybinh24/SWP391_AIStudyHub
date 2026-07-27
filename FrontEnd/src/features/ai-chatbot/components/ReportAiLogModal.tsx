import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { AlertTriangle, Flag, Send } from 'lucide-react'
import { promptApi } from '@/features/prompt-management/api/promptApi'
import { toast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'

interface ReportAiLogModalProps {
  isOpen: boolean
  onClose: () => void
  logId?: number | string
}

export function ReportAiLogModal({ isOpen, onClose, logId }: ReportAiLogModalProps) {
  const { language } = useTranslation()
  const isVi = language === 'vi'

  const PREDEFINED_REASONS = isVi
    ? [
        'Thông tin sai lệch hoặc không chính xác',
        'Vi phạm quy định thi / quy chế môn học',
        'Câu trả lời chưa đủ ý / gây hiểu nhầm',
        'Khác (nhập thông tin bên dưới)',
      ]
    : [
        'Inaccurate or misleading information',
        'Violation of exam rules / academic policy',
        'Incomplete or confusing response',
        'Other (specify details below)',
      ]

  const [selectedReason, setSelectedReason] = useState(PREDEFINED_REASONS[0])
  const [customText, setCustomText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logId) {
      toast.error(isVi ? 'Không tìm thấy thông tin lượt phản hồi để báo cáo.' : 'Report log information not found.')
      return
    }

    const isOther = selectedReason.startsWith('Khác') || selectedReason.startsWith('Other')
    const finalReason = isOther
      ? customText.trim()
      : selectedReason + (customText.trim() ? `: ${customText.trim()}` : '')

    if (!finalReason) {
      toast.error(isVi ? 'Vui lòng chọn hoặc nhập lý do báo cáo!' : 'Please select or enter a report reason!')
      return
    }

    try {
      setIsSubmitting(true)
      await promptApi.reportAiExecutionLog(logId, finalReason)
      toast.success(
        isVi
          ? 'Gửi báo cáo thành công! Đội ngũ Admin sẽ xem xét và điều chỉnh Prompt.'
          : 'Report submitted successfully! Admin team will review and adjust the Prompt.'
      )
      onClose()
      setCustomText('')
    } catch (err: any) {
      console.error('Report error:', err)
      toast.error(err.response?.data?.message || (isVi ? 'Có lỗi khi gửi báo cáo.' : 'Error submitting report.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isVi ? 'Báo cáo câu trả lời AI 🚩' : 'Report AI Response 🚩'}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{isVi ? 'Giúp chúng tôi cải thiện chất lượng AI!' : 'Help us improve AI quality!'}</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              {isVi
                ? 'Báo cáo của bạn sẽ được gửi thẳng đến trang Quản trị Admin để điều chỉnh lại bộ quy tắc (Prompt) của AI.'
                : 'Your report will be sent directly to the Admin dashboard to adjust system prompt rules.'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {isVi ? 'Lý do báo cáo:' : 'Report Reason:'}
          </label>
          <div className="space-y-1.5">
            {PREDEFINED_REASONS.map((r) => (
              <label
                key={r}
                className="flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="reason"
                  checked={selectedReason === r}
                  onChange={() => setSelectedReason(r)}
                  className="accent-blue-600 w-4 h-4"
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">{r}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {isVi ? 'Ghi chú chi tiết (Không bắt buộc):' : 'Detailed notes (Optional):'}
          </label>
          <textarea
            rows={3}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder={
              isVi
                ? 'Ví dụ: AI bảo Practical Exam được dùng AI trong khi quy định cấm...'
                : 'E.g., AI stated Practical Exam allows AI usage while rules forbid it...'
            }
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium dark:text-white"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {isVi ? 'Hủy' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? (isVi ? 'Đang gửi...' : 'Submitting...') : (isVi ? 'Gửi báo cáo' : 'Submit Report')}</span>
          </button>
        </div>
      </form>
    </Modal>
  )
}
