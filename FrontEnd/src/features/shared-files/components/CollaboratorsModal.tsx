import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Mail, Plus } from 'lucide-react'

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
  onAddCollaborator: (name: string, email: string, role: 'Owner' | 'Editor' | 'View Only') => void
}

export function CollaboratorsModal({
  isOpen,
  onClose,
  collaborators,
  onUpdateRole,
  onAddCollaborator
}: CollaboratorsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'Owner' | 'Editor' | 'View Only'>('View Only')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setShowAddForm(false)
      setNewName('')
      setNewEmail('')
      setNewRole('View Only')
      setFormError('')
      return
    }

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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    const trimmedName = newName.trim()
    const trimmedEmail = newEmail.trim().toLowerCase()

    if (!trimmedName || !trimmedEmail) {
      setFormError('Please fill out all fields.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.')
      return
    }

    if (collaborators.some((c) => c.email.toLowerCase() === trimmedEmail)) {
      setFormError('A collaborator with this email already exists.')
      return
    }

    onAddCollaborator(trimmedName, trimmedEmail, newRole)

    setNewName('')
    setNewEmail('')
    setNewRole('View Only')
    setShowAddForm(false)
  }

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
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-55 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                <Users className="size-5.5" />
              </div>
              <div className="text-left">
                <h3 id="collaborators-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Active Collaborators ({collaborators.length})
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  People collaborating on your shared workspace files
                </p>
              </div>
            </div>

            {/* Add Collaborator Trigger/Form */}
            {!showAddForm ? (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="w-full mb-4 flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-dashed border-blue-200 dark:border-blue-800/80 transition-all py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Plus className="size-4" />
                Add Collaborator
              </button>
            ) : (
              <form
                onSubmit={handleAddSubmit}
                className="mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 space-y-3 text-left animate-fadeIn"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    New Collaborator
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setFormError('')
                    }}
                    className="text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {formError && (
                  <p className="text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded-lg border border-red-100/50 dark:border-red-950/30">
                    {formError}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700/80 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="email@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700/80 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'Owner' | 'Editor' | 'View Only')}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700/80 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white transition-colors cursor-pointer"
                  >
                    <option value="View Only">View Only</option>
                    <option value="Editor">Editor</option>
                    <option value="Owner">Owner</option>
                  </select>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="bg-[#3155F6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#3155F6]/10 active:scale-[0.98]"
                  >
                    Add
                  </button>
                </div>
              </form>
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

                  <div className="flex gap-1 shrink-0 bg-slate-150/40 dark:bg-slate-800/60 p-0.5 rounded-xl border border-slate-200/40 dark:border-slate-800/30 w-fit">
                    {(['Owner', 'Editor', 'View Only'] as const).map((r) => {
                      const isActive = c.role === r
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => onUpdateRole(c.id, r)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                            isActive
                              ? r === 'Owner'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : r === 'Editor'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-655 bg-slate-600 text-white shadow-sm'
                              : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250 hover:bg-slate-200/40 dark:hover:bg-slate-700/40'
                          }`}
                        >
                          {r}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-5 border-t border-slate-100 dark:border-slate-800/60 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="bg-[#3155F6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-[#3155F6]/10 active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
export default CollaboratorsModal
