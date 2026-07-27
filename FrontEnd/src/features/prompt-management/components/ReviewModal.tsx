import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { AlertTriangle, CheckCircle, Send, XCircle } from 'lucide-react'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'submit' | 'approve' | 'reject'
  versionNumber: string
  onSubmit: (comment?: string) => Promise<void>
  isLoading?: boolean
}

export function ReviewModal({
  isOpen,
  onClose,
  type,
  versionNumber,
  onSubmit,
  isLoading = false,
}: ReviewModalProps) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (type === 'reject' && !comment.trim()) {
      setError('Review comment is required when rejecting a version.')
      return
    }
    setError('')
    try {
      await onSubmit(comment.trim())
      setComment('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Operation failed')
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'submit':
        return `Submit Version ${versionNumber} for Review`
      case 'approve':
        return `Approve Version ${versionNumber}`
      case 'reject':
        return `Reject Version ${versionNumber}`
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'submit':
        return <Send className="w-5 h-5 text-blue-500" />
      case 'approve':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case 'reject':
        return <XCircle className="w-5 h-5 text-rose-500" />
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          {getIcon()}
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {type === 'submit' &&
              'Once submitted, this version will lock for review and cannot be edited directly.'}
            {type === 'approve' &&
              'Approving this version will mark it ready for production deployment.'}
            {type === 'reject' &&
              'Rejecting this version returns it to the creator with feedback for revisions.'}
          </p>
        </div>

        {type !== 'submit' && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Review Feedback / Comment {type === 'reject' && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                type === 'reject'
                  ? 'Please describe why this version was rejected and required changes...'
                  : 'Optional approval notes or recommendations...'
              }
              className="w-full text-xs p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-slate-200"
            />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors ${
              type === 'reject'
                ? 'bg-rose-600 hover:bg-rose-500'
                : type === 'approve'
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {isLoading ? 'Processing...' : 'Confirm Action'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
