import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderPlus, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'
import { apiClient } from '@/lib/axios'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'

interface CreateWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newWorkspace: any) => void
}

export function CreateWorkspaceModal({ isOpen, onClose, onSuccess }: CreateWorkspaceModalProps) {
  const { language } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const addToast = useToastStore((s) => s.addToast)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [accessType, setAccessType] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName('')
      setDescription('')
      setAccessType('PRIVATE')
    }
  }, [isOpen])

  // ESC Close listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const response = await apiClient.post('/workspaces', {
        name: name.trim(),
        description: description.trim(),
        accessType,
        userId: user?.id
      })

      const data = response.data?.data || response.data
      addToast(
        language === 'vi'
          ? 'Tạo nhóm học tập thành công!'
          : 'Workspace created successfully!',
        'success'
      )
      onSuccess(data)
      onClose()
    } catch (err: any) {
      console.error('Failed to create workspace:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create workspace'
      addToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative z-10 w-full max-w-[460px] overflow-visible rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-left"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-workspace-title"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            {/* Header */}
            <div className="flex gap-3.5 items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                <FolderPlus className="size-5.5" />
              </div>
              <div>
                <h3 id="create-workspace-title" className="text-base font-extrabold text-slate-900 dark:text-white">
                  {language === 'vi' ? 'Tạo Nhóm Học Tập Mới' : 'Create New Study Group'}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  {language === 'vi'
                    ? 'Tạo không gian để cùng chia sẻ tài liệu và thảo luận.'
                    : 'Create a workspace to share files and collaborate.'}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {language === 'vi' ? 'Tên Nhóm Học Tập' : 'Workspace Name'} *
                </label>
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Ví dụ: Nhóm học môn Toán Giải Tích' : 'e.g. Calculus Study Group'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-xs font-semibold placeholder-slate-400 text-slate-800 dark:text-slate-100 focus:outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {language === 'vi' ? 'Mô Tả' : 'Description'}
                </label>
                <textarea
                  placeholder={language === 'vi' ? 'Nhập mô tả ngắn về nhóm học tập này...' : 'Enter a brief description...'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-xs font-semibold placeholder-slate-400 text-slate-800 dark:text-slate-100 focus:outline-none resize-none"
                />
              </div>

              {/* Access Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <span>{language === 'vi' ? 'Chế độ truy cập' : 'Access Level'}</span>
                  <HelpCircle className="size-3 text-slate-400" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccessType('PRIVATE')}
                    className={cn(
                      "flex flex-col items-start p-3 rounded-2xl border text-left cursor-pointer transition-all",
                      accessType === 'PRIVATE'
                        ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {language === 'vi' ? 'Riêng tư (Private)' : 'Private'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">
                      {language === 'vi' ? 'Chỉ thành viên được mời mới có thể tham gia.' : 'Only invited members can access.'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccessType('PUBLIC')}
                    className={cn(
                      "flex flex-col items-start p-3 rounded-2xl border text-left cursor-pointer transition-all",
                      accessType === 'PUBLIC'
                        ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {language === 'vi' ? 'Công khai (Public)' : 'Public'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">
                      {language === 'vi' ? 'Bất kỳ ai cũng có thể tìm và xem.' : 'Anyone can search and view.'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <Button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  {loading
                    ? (language === 'vi' ? 'Đang tạo...' : 'Creating...')
                    : (language === 'vi' ? 'Tạo Nhóm Học Tập' : 'Create Workspace')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
