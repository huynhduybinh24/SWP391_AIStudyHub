import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, ChevronDown, Check, FolderPlus, HelpCircle, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'
import { apiClient } from '@/lib/axios'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  onInviteSubmit: (email: string, role: 'Viewer' | 'Editor', workspaceId: string) => void
  defaultWorkspaceId?: string
}

export function InviteModal({ isOpen, onClose, onInviteSubmit, defaultWorkspaceId }: InviteModalProps) {
  const { t, language } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const addToast = useToastStore((s) => s.addToast)

  // Invite states
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'Viewer' | 'Editor'>('Viewer')
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)

  // Workspace selection states
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('')
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false)
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false)

  // Inline workspace creation states
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
  const [wsName, setWsName] = useState('')
  const [wsDesc, setWsDesc] = useState('')
  const [wsAccessType, setWsAccessType] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE')
  const [creatingWs, setCreatingWs] = useState(false)

  // Fetch workspaces when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      setEmail('')
      setRole('Viewer')
      setIsRoleDropdownOpen(false)
      setIsWorkspaceDropdownOpen(false)
      setIsCreatingWorkspace(false)
      setWsName('')
      setWsDesc('')
      setWsAccessType('PRIVATE')
      
      const fetchWorkspaces = async () => {
        setLoadingWorkspaces(true)
        try {
          const res = await apiClient.get(`/workspaces?userId=${user.id}`)
          const list = res.data?.data || res.data || []
          setWorkspaces(list)
          if (defaultWorkspaceId && defaultWorkspaceId !== 'all') {
            setSelectedWorkspaceId(defaultWorkspaceId)
          } else if (list.length > 0) {
            setSelectedWorkspaceId(list[0].id.toString())
          } else {
            setSelectedWorkspaceId('')
          }
        } catch (err) {
          console.error('Failed to fetch workspaces:', err)
        } finally {
          setLoadingWorkspaces(false)
        }
      }
      fetchWorkspaces()
    }
  }, [isOpen, user?.id, defaultWorkspaceId])

  // ESC Close listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleCreateWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wsName.trim() || !user?.id) return

    setCreatingWs(true)
    try {
      const response = await apiClient.post('/workspaces', {
        name: wsName.trim(),
        description: wsDesc.trim(),
        accessType: wsAccessType,
        userId: user.id
      })

      const newWs = response.data?.data || response.data
      addToast(
        language === 'vi'
          ? 'Tạo nhóm học tập thành công!'
          : 'Workspace created successfully!',
        'success'
      )
      
      // Update lists
      setWorkspaces((prev) => [newWs, ...prev])
      setSelectedWorkspaceId(newWs.id.toString())
      setIsCreatingWorkspace(false)
    } catch (err: any) {
      console.error('Failed to create workspace:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create workspace'
      addToast(errorMsg, 'error')
    } finally {
      setCreatingWs(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      alert(t.validation.invalidEmail)
      return
    }

    if (!selectedWorkspaceId) {
      addToast(
        language === 'vi'
          ? 'Vui lòng chọn hoặc tạo một nhóm học tập trước khi mời!'
          : 'Please select or create a study group first!',
        'error'
      )
      return
    }

    onInviteSubmit(email.trim(), role, selectedWorkspaceId)
  }

  const selectedWorkspace = workspaces.find((w) => w.id.toString() === selectedWorkspaceId)

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
              className="absolute right-6 top-6 text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            {isCreatingWorkspace ? (
              // Inline Workspace Creation View
              <div>
                {/* Header */}
                <div className="flex gap-3.5 items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FolderPlus className="size-5.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {language === 'vi' ? 'Tạo Nhóm Học Tập Mới' : 'Create New Study Group'}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      {language === 'vi' ? 'Tạo nhanh nhóm học tập để mời thành viên.' : 'Create a quick study group to invite members.'}
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleCreateWorkspaceSubmit} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {language === 'vi' ? 'Tên Nhóm Học Tập' : 'Workspace Name'} *
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'vi' ? 'Ví dụ: Nhóm Học Toán' : 'e.g. Math Study Group'}
                      value={wsName}
                      onChange={(e) => setWsName(e.target.value)}
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
                      placeholder={language === 'vi' ? 'Mô tả ngắn...' : 'Brief description...'}
                      value={wsDesc}
                      onChange={(e) => setWsDesc(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-xs font-semibold placeholder-slate-400 text-slate-800 dark:text-slate-100 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Access Type */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {language === 'vi' ? 'Chế độ truy cập' : 'Access Level'}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setWsAccessType('PRIVATE')}
                        className={cn(
                          "flex flex-col items-start p-3 rounded-2xl border text-left cursor-pointer transition-all",
                          wsAccessType === 'PRIVATE'
                            ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {language === 'vi' ? 'Riêng tư' : 'Private'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWsAccessType('PUBLIC')}
                        className={cn(
                          "flex flex-col items-start p-3 rounded-2xl border text-left cursor-pointer transition-all",
                          wsAccessType === 'PUBLIC'
                            ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {language === 'vi' ? 'Công khai' : 'Public'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsCreatingWorkspace(false)}
                      disabled={creatingWs}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
                    >
                      {language === 'vi' ? 'Quay lại' : 'Back'}
                    </button>
                    <Button
                      type="submit"
                      disabled={creatingWs || !wsName.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                    >
                      {creatingWs ? '...' : (language === 'vi' ? 'Tạo nhóm học tập' : 'Create')}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              // Standard Invite View
              <div>
                {/* Header */}
                <div className="flex gap-3.5 items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-955 text-[#3155F6] dark:text-blue-400 shrink-0">
                    <Mail className="size-5.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {t.sharedFiles.invite}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      {t.sharedFiles.inviteDesc}
                    </p>
                  </div>
                </div>

                {workspaces.length === 0 && !loadingWorkspaces ? (
                  // Warning state: No Workspaces
                  <div className="text-center py-6 px-4 bg-amber-50/20 dark:bg-amber-950/10 rounded-2xl border border-dashed border-amber-200 dark:border-amber-900/50 space-y-4">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {language === 'vi'
                        ? 'Bạn chưa có nhóm học tập nào để chia sẻ tài liệu và mời thành viên.'
                        : 'You do not have any study groups yet.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCreatingWorkspace(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                    >
                      <FolderPlus className="size-4" />
                      <span>{language === 'vi' ? 'Tạo Nhóm Học Tập Mới' : 'Create New Group'}</span>
                    </button>
                  </div>
                ) : (
                  // Form
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Workspace Selector */}
                    <div className="space-y-1.5 relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                        <span>{language === 'vi' ? 'Chọn nhóm học tập' : 'Select study group'}</span>
                        <button
                          type="button"
                          onClick={() => setIsCreatingWorkspace(true)}
                          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 text-[9.5px] font-black uppercase tracking-wider"
                        >
                          + {language === 'vi' ? 'Tạo nhóm mới' : 'Create new'}
                        </button>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FolderOpen className="size-4 text-blue-500" />
                          <span>{selectedWorkspace ? selectedWorkspace.name : (loadingWorkspaces ? '...' : 'Select group...')}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </button>

                      {isWorkspaceDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsWorkspaceDropdownOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl z-50 py-1.5 max-h-48 overflow-y-auto animate-fade-in">
                            {workspaces.map((ws) => (
                              <button
                                key={ws.id}
                                type="button"
                                onClick={() => {
                                  setSelectedWorkspaceId(ws.id.toString())
                                  setIsWorkspaceDropdownOpen(false)
                                }}
                                className={cn(
                                  "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer",
                                  selectedWorkspaceId === ws.id.toString()
                                    ? "text-blue-600 bg-blue-50/40 dark:text-blue-400 dark:bg-blue-955/20"
                                    : "text-slate-700 dark:text-slate-300"
                                )}
                              >
                                <span>{ws.name}</span>
                                {selectedWorkspaceId === ws.id.toString() && (
                                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {t.sharedFiles.emailLabel}
                      </label>
                      <input
                        type="text"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-xs font-semibold placeholder-slate-400 text-slate-800 dark:text-slate-100 focus:outline-none"
                        required
                      />
                    </div>

                    {/* Role Selector */}
                    <div className="space-y-1.5 relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {t.sharedFiles.roleLabel}
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <span>{role === 'Editor' ? t.sharedFiles.roleEditor : t.sharedFiles.roleViewer}</span>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </button>

                      {isRoleDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsRoleDropdownOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl z-50 py-1.5 animate-fade-in">
                            {(['Viewer', 'Editor'] as const).map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => {
                                  setRole(r)
                                  setIsRoleDropdownOpen(false)
                                }}
                                className={cn(
                                  "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer",
                                  role === r ? "text-blue-600 bg-blue-50/40 dark:text-blue-400 dark:bg-blue-955/20" : "text-slate-700 dark:text-slate-300"
                                )}
                              >
                                <span>{r === 'Editor' ? t.sharedFiles.roleEditor : t.sharedFiles.roleViewer}</span>
                                {role === r && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6 shrink-0">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
                      >
                        {t.common.cancel}
                      </button>
                      <Button
                        type="submit"
                        disabled={!email.trim() || !selectedWorkspaceId}
                        className="bg-[#3155F6] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-500/10"
                      >
                        {t.sharedFiles.sendInvite}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default InviteModal
