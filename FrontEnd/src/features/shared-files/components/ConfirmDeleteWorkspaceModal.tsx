import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'

interface ConfirmDeleteWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  workspaceName: string
}

export function ConfirmDeleteWorkspaceModal({
  isOpen,
  onClose,
  onConfirm,
  workspaceName
}: ConfirmDeleteWorkspaceModalProps) {
  const { language } = useTranslation()
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
          >
            <X className="size-5" />
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {language === 'vi' ? 'Xác Nhận Xóa Nhóm' : 'Delete Workspace'}
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                {language === 'vi' ? 'Hành động này không thể hoàn tác' : 'This action cannot be undone'}
              </p>
            </div>
          </div>

          <div className="my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-left">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {language === 'vi'
                ? `Bạn có chắc chắn muốn xóa nhóm học tập `
                : `Are you sure you want to delete the workspace `}
              <strong className="text-slate-900 dark:text-white font-bold">{workspaceName}</strong>?
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {language === 'vi'
                ? 'Tất cả tài liệu được chia sẻ và danh sách thành viên trong nhóm này sẽ bị xóa khỏi nhóm.'
                : 'All shared documents and member access for this group will be permanently removed.'}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              <span>
                {isDeleting
                  ? (language === 'vi' ? 'Đang xóa...' : 'Deleting...')
                  : (language === 'vi' ? 'Xóa Nhóm' : 'Delete Workspace')}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ConfirmDeleteWorkspaceModal
