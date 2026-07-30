import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Check, XCircle, Users, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/context/LanguageContext'
import { apiClient } from '@/lib/axios'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'

interface PendingInvitationsModalProps {
  isOpen: boolean
  onClose: () => void
  onInviteResponded: () => void
}

export function PendingInvitationsModal({
  isOpen,
  onClose,
  onInviteResponded
}: PendingInvitationsModalProps) {
  const { language } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const addToast = useToastStore((s) => s.addToast)

  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null)

  const fetchInvitations = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await apiClient.get(`/workspaces/invitations?userId=${user.id}`)
      const list = res.data?.data || res.data || []
      setInvitations(list)
    } catch (err) {
      console.error('Failed to fetch pending invitations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchInvitations()
    }
  }, [isOpen, user?.id])

  const handleRespond = async (workspaceId: number | string, workspaceName: string, action: 'ACCEPT' | 'REJECT') => {
    if (!user?.id) return
    setActionLoadingId(workspaceId)
    try {
      await apiClient.post(`/workspaces/${workspaceId}/respond?userId=${user.id}&action=${action}`)
      
      if (action === 'ACCEPT') {
        addToast(
          language === 'vi'
            ? `Đã chấp nhận lời mời tham gia nhóm "${workspaceName}" thành công!`
            : `Accepted invitation to workspace "${workspaceName}" successfully!`,
          'success'
        )
      } else {
        addToast(
          language === 'vi'
            ? `Đã từ chối lời mời tham gia nhóm "${workspaceName}".`
            : `Rejected invitation to workspace "${workspaceName}".`,
          'info'
        )
      }

      // Refresh lists
      setInvitations(prev => prev.filter(w => w.id !== workspaceId))
      onInviteResponded()
    } catch (err: any) {
      console.error('Failed to respond to invitation:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Lỗi khi phản hồi lời mời'
      addToast(errorMsg, 'error')
    } finally {
      setActionLoadingId(null)
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
            className="relative z-10 w-full max-w-[500px] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-left"
            role="dialog"
            aria-modal="true"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            {/* Header */}
            <div className="flex gap-3.5 items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-955/40 text-amber-600 dark:text-amber-400 shrink-0">
                <Mail className="size-5.5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {language === 'vi' ? 'Lời mời nhóm học tập' : 'Workspace Invitations'}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  {language === 'vi'
                    ? 'Danh sách các nhóm học tập đang mời bạn tham gia'
                    : 'List of study group invitations pending your response'}
                </p>
              </div>
            </div>

            {/* Content Body */}
            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
              {loading ? (
                <div className="py-12 text-center text-xs font-semibold text-slate-400">
                  {language === 'vi' ? 'Đang tải danh sách lời mời...' : 'Loading invitations...'}
                </div>
              ) : invitations.length === 0 ? (
                <div className="py-10 text-center bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
                  <ShieldAlert className="size-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {language === 'vi' ? 'Không có lời mời nào' : 'No pending invitations'}
                  </p>
                  <p className="text-[11px] text-slate-450 mt-1">
                    {language === 'vi'
                      ? 'Bạn hiện chưa nhận được lời mời tham gia nhóm học tập mới nào.'
                      : 'You do not have any pending study group invitations right now.'}
                  </p>
                </div>
              ) : (
                invitations.map((ws) => {
                  const isLoading = actionLoadingId === ws.id
                  return (
                    <div
                      key={ws.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 text-left max-w-[280px]">
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <Users className="size-4 text-blue-500 shrink-0" />
                          <span className="truncate">{ws.name}</span>
                        </h4>
                        <p className="text-xs text-slate-500 font-medium line-clamp-1">
                          {ws.description || (language === 'vi' ? 'Không gian học tập nhóm' : 'Study group workspace')}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400">
                          {language === 'vi' ? 'Tạo bởi: ' : 'Owner: '}
                          <span className="text-slate-600 dark:text-slate-300">{ws.ownerName || 'Chủ nhóm'}</span>
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRespond(ws.id, ws.name, 'REJECT')}
                          disabled={isLoading}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-rose-50 dark:hover:bg-rose-955/30 hover:text-rose-600 hover:border-rose-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="size-3.5" />
                          <span>{language === 'vi' ? 'Từ chối' : 'Reject'}</span>
                        </button>

                        <Button
                          type="button"
                          onClick={() => handleRespond(ws.id, ws.name, 'ACCEPT')}
                          disabled={isLoading}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-emerald-500/10 disabled:opacity-50"
                        >
                          <Check className="size-3.5" />
                          <span>{isLoading ? '...' : (language === 'vi' ? 'Chấp nhận' : 'Accept')}</span>
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default PendingInvitationsModal
