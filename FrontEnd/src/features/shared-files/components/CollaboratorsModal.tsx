import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Mail, Plus, Lock } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'

export interface Collaborator {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Editor' | 'View Only'
  avatarUrl?: string
}

interface CollaboratorsModalProps {
  isOpen: boolean
  onClose: () => void
  collaborators: Collaborator[]
  onUpdateRole: (id: string, newRole: 'Owner' | 'Editor' | 'View Only') => void
  canManage: boolean
  onOpenAddCollaborator: () => void
}

export function CollaboratorsModal({
  isOpen,
  onClose,
  collaborators,
  onUpdateRole,
  canManage,
  onOpenAddCollaborator
}: CollaboratorsModalProps) {
  const { language } = useTranslation()
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    )
    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && focusableElements) {
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer"
          />

          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="relative z-10 w-full max-w-[500px] overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby="collaborators-title"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400 shrink-0">
                <Users className="size-5.5" />
              </div>
              <div className="text-left">
                <h3 id="collaborators-title" className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'vi' ? `Thành viên hoạt động (${collaborators.length})` : `Active Collaborators (${collaborators.length})`}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {language === 'vi' ? 'Những người đang cộng tác trên các tệp không gian làm việc chia sẻ' : 'People collaborating on your shared workspace files'}
                </p>
              </div>
            </div>

            {/* Add Collaborator Trigger */}
            {!canManage ? (
              <div className="w-full mb-4 py-2.5 px-4 rounded-xl text-center bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-550 flex items-center justify-center gap-1.5 select-none">
                <Lock className="size-3.5 text-slate-400 dark:text-slate-500" />
                {language === 'vi' ? 'Chỉ chủ sở hữu và quản trị viên mới có thể thêm thành viên' : 'Only owners and admins can add collaborators'}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAddCollaborator}
                className="w-full mb-4 flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-955/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-dashed border-blue-200 dark:border-blue-800/80 transition-all py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Plus className="size-4" />
                {language === 'vi' ? 'Thêm thành viên' : 'Add Collaborator'}
              </button>
            )}

            <div className="max-h-[280px] overflow-y-auto pr-1 space-y-3 scrollbar-thin">
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100/50 dark:border-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700/80 transition-all duration-200 animate-fadeIn gap-2"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="size-9 rounded-full bg-blue-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-blue-600 text-sm">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt={c.name} className="h-full w-full object-cover" />
                      ) : (
                        c.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate leading-snug">
                        {c.name}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 truncate mt-0.5">
                        <Mail className="size-3 shrink-0" />
                        {c.email}
                      </p>
                    </div>
                  </div>

                  {c.role === 'Owner' ? (
                    <div className="shrink-0">
                      <span className="px-3 py-1 rounded-xl text-[11px] font-bold bg-blue-600 text-white shadow-xs inline-block">
                        {language === 'vi' ? 'Chủ sở hữu' : 'Owner'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-1 shrink-0 bg-slate-150/40 dark:bg-slate-800/60 p-0.5 rounded-xl border border-slate-200/40 dark:border-slate-800/30 w-fit">
                      {(['Editor', 'View Only'] as const).map((r) => {
                        const isActive = c.role === r
                        return (
                          <button
                            key={r}
                            type="button"
                            disabled={!canManage}
                            onClick={() => onUpdateRole(c.id, r)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                              isActive
                                ? r === 'Editor'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-600 text-white shadow-sm'
                                : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250 hover:bg-slate-200/40 dark:hover:bg-slate-700/40'
                            } ${!canManage ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {r === 'Editor' 
                              ? (language === 'vi' ? 'Chỉnh sửa' : 'Editor')
                              : (language === 'vi' ? 'Chỉ xem' : 'View Only')}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-5 border-t border-slate-100 dark:border-slate-800/60 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="bg-[#3155F6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-[#3155F6]/10 active:scale-[0.98]"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
export default CollaboratorsModal
