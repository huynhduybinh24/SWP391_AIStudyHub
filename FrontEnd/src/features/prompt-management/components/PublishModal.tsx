import { Modal } from '@/components/ui/Modal'
import { Rocket, AlertTriangle } from 'lucide-react'

interface PublishModalProps {
  isOpen: boolean
  onClose: () => void
  promptCode: string
  newVersionNumber: string
  currentPublishedVersionNumber?: string
  onConfirm: () => Promise<void>
  isLoading?: boolean
}

export function PublishModal({
  isOpen,
  onClose,
  promptCode,
  newVersionNumber,
  currentPublishedVersionNumber,
  onConfirm,
  isLoading = false,
}: PublishModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Publish Version ${newVersionNumber}`}>
      <div className="space-y-4 pt-2">
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-900 dark:text-amber-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Publish Warning</span>
            <p>
              Publishing version <strong className="font-mono">{newVersionNumber}</strong> will immediately deploy it to production for prompt code <strong className="font-mono">{promptCode}</strong>.
            </p>
            {currentPublishedVersionNumber && (
              <p className="text-amber-700 dark:text-amber-300">
                The current published version <strong className="font-mono">{currentPublishedVersionNumber}</strong> will be archived.
              </p>
            )}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Prompt Code:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{promptCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Target Publish Version:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{newVersionNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Currently Active Version:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {currentPublishedVersionNumber || 'None (First Publish)'}
            </span>
          </div>
        </div>

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
            onClick={async () => {
              await onConfirm()
              onClose()
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-colors"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Publishing...' : 'Publish to Production'}</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}
