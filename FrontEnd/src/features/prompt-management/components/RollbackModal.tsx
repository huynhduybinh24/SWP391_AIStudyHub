import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { RotateCcw, AlertCircle } from 'lucide-react'
import type { ChangeType } from '../types/prompt'

interface RollbackModalProps {
  isOpen: boolean
  onClose: () => void
  promptCode: string
  targetVersionId: number
  targetVersionNumber: string
  currentPublishedVersionNumber?: string
  onConfirm: (reason: string, changeType: ChangeType) => Promise<void>
  isLoading?: boolean
}

export function RollbackModal({
  isOpen,
  onClose,
  promptCode,
  targetVersionNumber,
  currentPublishedVersionNumber,
  onConfirm,
  isLoading = false,
}: RollbackModalProps) {
  const [reason, setReason] = useState('')
  const [changeType, setChangeType] = useState<ChangeType>('PATCH')
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Rollback reason is required.')
      return
    }
    setError('')
    try {
      await onConfirm(reason.trim(), changeType)
      setReason('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Rollback failed')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Rollback to Version ${targetVersionNumber}`}>
      <div className="space-y-4 pt-2">
        <div className="flex items-start gap-3 p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl text-blue-900 dark:text-blue-200 text-xs">
          <RotateCcw className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Rollback Process</span>
            <p>
              Rolling back will create a <strong>new DRAFT version</strong> copied from historical version <strong className="font-mono">{targetVersionNumber}</strong>.
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              The current active version (<strong className="font-mono">{currentPublishedVersionNumber || 'None'}</strong>) will remain active until the new draft is reviewed and published.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Rollback Change Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={changeType}
              onChange={(e) => setChangeType(e.target.value as ChangeType)}
              className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
            >
              <option value="PATCH">PATCH - Small fix or correction</option>
              <option value="MINOR">MINOR - Feature addition or update</option>
              <option value="MAJOR">MAJOR - Breaking change or complete rewrite</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Rollback Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you are rolling back to this version..."
              className="w-full text-xs p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-slate-200"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
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
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Creating Draft...' : 'Create Rollback Draft'}</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}
