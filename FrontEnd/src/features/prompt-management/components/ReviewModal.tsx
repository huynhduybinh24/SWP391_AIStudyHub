import { useState } from 'react'
import { Send, CheckCircle, XCircle } from 'lucide-react'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'submit' | 'approve' | 'reject'
  versionNumber: string
  onSubmit: (comment: string) => void
  isLoading: boolean
}

export function ReviewModal({
  isOpen,
  onClose,
  type,
  versionNumber,
  onSubmit,
  isLoading,
}: ReviewModalProps) {
  const [comment, setComment] = useState('')

  if (!isOpen) return null

  const titles = {
    submit: `Submit Version ${versionNumber} for Review`,
    approve: `Approve Version ${versionNumber}`,
    reject: `Reject Version ${versionNumber}`,
  }

  const icons = {
    submit: <Send className="w-5 h-5 text-blue-500" />,
    approve: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    reject: <XCircle className="w-5 h-5 text-rose-500" />,
  }

  const buttonColors = {
    submit: 'bg-blue-600 hover:bg-blue-500 text-white',
    approve: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    reject: 'bg-rose-600 hover:bg-rose-500 text-white',
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(comment)
    setComment('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
            {icons[type]}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {titles[type]}
            </h3>
            <p className="text-xs text-slate-500">
              Provide feedback or comments for this review action.
            </p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Comment / Notes {type === 'reject' && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              required={type === 'reject'}
              placeholder="Add your review comments here..."
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-slate-200"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 ${buttonColors[type]}`}
            >
              {isLoading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
