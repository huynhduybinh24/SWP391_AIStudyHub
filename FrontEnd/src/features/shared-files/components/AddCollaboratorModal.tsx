import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, Mail, Shield, User } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'

interface AddCollaboratorModalProps {
  isOpen: boolean
  onClose: () => void
  onAddCollaborator: (name: string, email: string, role: 'Owner' | 'Editor' | 'View Only') => void
  collaborators: Array<{ email: string }>
}

export function AddCollaboratorModal({
  isOpen,
  onClose,
  onAddCollaborator,
  collaborators
}: AddCollaboratorModalProps) {
  const { language } = useTranslation()
  const modalRef = useRef<HTMLDivElement>(null)
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'Owner' | 'Editor' | 'View Only'>('View Only')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setName('')
      setEmail('')
      setRole('View Only')
      setError('')
      
      // Focus on first input
      setTimeout(() => {
        const inputEl = modalRef.current?.querySelector('input')
        inputEl?.focus()
      }, 100)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    )
    
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedName || !trimmedEmail) {
      setError(language === 'vi' ? 'Vui lòng điền đầy đủ các trường.' : 'Please fill out all fields.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError(language === 'vi' ? 'Email không hợp lệ.' : 'Please enter a valid email address.')
      return
    }

    if (collaborators.some((c) => c.email.toLowerCase() === trimmedEmail)) {
      setError(language === 'vi' ? 'Thành viên với email này đã tồn tại.' : 'A collaborator with this email already exists.')
      return
    }

    onAddCollaborator(trimmedName, trimmedEmail, role)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0b1c30]/50 dark:bg-black/70 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Card */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="relative z-10 w-full max-w-[460px] overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800 text-left"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-collab-title"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                <UserPlus className="size-5.5" />
              </div>
              <div>
                <h3 id="add-collab-title" className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'vi' ? 'Thêm thành viên' : 'Add Collaborator'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {language === 'vi' ? 'Mời thành viên mới tham gia vào không gian làm việc này' : 'Invite a new member to collaborate in this workspace'}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-xl border border-red-100/50 dark:border-red-950/30 animate-fadeIn">
                  {error}
                </p>
              )}

              {/* Name field */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  {language === 'vi' ? 'TÊN THÀNH VIÊN' : 'COLLABORATOR NAME'}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-2.5 size-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder={language === 'vi' ? 'Nhập tên...' : 'Enter name...'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl text-xs focus:outline-none text-slate-900 dark:text-white transition-colors"
                  />
                </div>
              </div>

              {/* Email field */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  {language === 'vi' ? 'ĐỊA CHỈ EMAIL' : 'EMAIL ADDRESS'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 size-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl text-xs focus:outline-none text-slate-900 dark:text-white transition-colors"
                  />
                </div>
              </div>

              {/* Role select */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  {language === 'vi' ? 'VAI TRÒ TRUY CẬP' : 'ACCESS ROLE'}
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-2.5 size-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'Owner' | 'Editor' | 'View Only')}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl text-xs focus:outline-none text-slate-900 dark:text-white transition-colors cursor-pointer appearance-none"
                  >
                    <option value="View Only">{language === 'vi' ? 'Người xem (View Only)' : 'View Only'}</option>
                    <option value="Editor">{language === 'vi' ? 'Người chỉnh sửa (Editor)' : 'Editor'}</option>
                    <option value="Owner">{language === 'vi' ? 'Chủ sở hữu (Owner)' : 'Owner'}</option>
                  </select>
                  <div className="absolute right-4 top-3.5 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-400 dark:border-t-slate-500 size-0" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-[#3155F6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#3155F6]/10 active:scale-[0.98]"
                >
                  {language === 'vi' ? 'Thêm' : 'Add'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AddCollaboratorModal
