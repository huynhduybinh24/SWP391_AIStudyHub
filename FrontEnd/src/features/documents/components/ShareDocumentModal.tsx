import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share2, FolderOpen, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'
import { apiClient } from '@/lib/axios'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'

interface ShareDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  documentTitle: string
}

export function ShareDocumentModal({ isOpen, onClose, documentId, documentTitle }: ShareDocumentModalProps) {
  const { language } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const addToast = useToastStore((s) => s.addToast)

  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (isOpen && user?.id && documentId) {
      setSelectedWorkspaceId('')
      setWorkspaces([])
      
      const fetchWorkspaces = async () => {
        setLoading(true)
        try {
          const res = await apiClient.get(`/workspaces?userId=${user.id}`)
          const list = res.data?.data || res.data || []
          
          // Filter to workspaces where user is Owner or Collaborator/accepted member
          // If the backend DTO has details, or we can just list them all and let the API check
          setWorkspaces(list)
          if (list.length > 0) {
            setSelectedWorkspaceId(list[0].id.toString())
          }
        } catch (err) {
          console.error('Failed to fetch workspaces:', err)
          addToast(language === 'vi' ? 'Không thể tải danh sách nhóm học tập' : 'Failed to load workspaces', 'error')
        } finally {
          setLoading(false)
        }
      }
      fetchWorkspaces()
    }
  }, [isOpen, user?.id, documentId])

  // ESC Close listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleShare = async () => {
    if (!selectedWorkspaceId || !documentId || !user?.id) return

    setSharing(true)
    try {
      await apiClient.post(
        `/workspaces/${selectedWorkspaceId}/documents/${documentId}?userId=${user.id}`
      )

      addToast(
        language === 'vi'
          ? `Đã chia sẻ tài liệu "${documentTitle}" vào nhóm học tập thành công!`
          : `Shared document "${documentTitle}" to study group successfully!`,
        'success'
      )
      onClose()
    } catch (err: any) {
      console.error('Failed to share document to workspace:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to share document'
      addToast(errorMsg, 'error')
    } finally {
      setSharing(false)
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
            className="relative z-10 w-full max-w-[440px] overflow-visible rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-left"
            role="dialog"
            aria-modal="true"
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
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-955/20 text-[#3155F6] dark:text-blue-400 shrink-0">
                <Share2 className="size-5.5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {language === 'vi' ? 'Chia sẻ vào nhóm học tập' : 'Share to study group'}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5 max-w-[280px] truncate">
                  {documentTitle}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <Loader2 className="size-8 text-blue-500 animate-spin" />
                <span className="text-xs font-semibold text-slate-400">
                  {language === 'vi' ? 'Đang tải danh sách nhóm...' : 'Loading groups...'}
                </span>
              </div>
            ) : workspaces.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {language === 'vi'
                    ? 'Bạn chưa có hoặc chưa tham gia nhóm học tập nào.'
                    : 'You have not joined or created any study groups yet.'}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  className="rounded-xl text-xs"
                >
                  {language === 'vi' ? 'Đóng' : 'Close'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {language === 'vi' ? 'Chọn nhóm học tập' : 'Select study group'}
                  </label>
                  
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
                    {workspaces.map((ws) => {
                      const isSelected = selectedWorkspaceId === ws.id.toString()
                      return (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => setSelectedWorkspaceId(ws.id.toString())}
                          className={cn(
                            "w-full flex items-center justify-between p-3.5 rounded-2xl border text-left cursor-pointer transition-all",
                            isSelected
                              ? "border-blue-500 bg-blue-50/20 dark:bg-blue-950/10"
                              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <FolderOpen className={cn("size-5", isSelected ? "text-blue-500" : "text-slate-400")} />
                            <div>
                              <span className="block text-xs font-bold text-slate-900 dark:text-white">
                                {ws.name}
                              </span>
                              {ws.description && (
                                <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[240px]">
                                  {ws.description}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && <Check className="size-4 text-blue-500" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6 shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={sharing}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-550 hover:bg-slate-50 dark:text-slate-355 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <Button
                    onClick={handleShare}
                    disabled={sharing || !selectedWorkspaceId}
                    className="bg-[#3155F6] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-500/10"
                  >
                    {sharing ? '...' : (language === 'vi' ? 'Chia sẻ' : 'Share')}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
