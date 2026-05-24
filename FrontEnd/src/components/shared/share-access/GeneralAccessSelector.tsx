import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Lock, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PermissionDropdown, type ShareRole } from './PermissionDropdown'
import { useTranslation } from '@/context/LanguageContext'

export type GeneralAccessType = 'restricted' | 'public'

interface GeneralAccessSelectorProps {
  value: GeneralAccessType
  onChange: (type: GeneralAccessType) => void
  publicRole?: ShareRole
  onPublicRoleChange?: (role: ShareRole) => void
  showToast: (msg: string) => void
}

export function GeneralAccessSelector({
  value,
  onChange,
  publicRole = 'viewer',
  onPublicRoleChange,
  showToast
}: GeneralAccessSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const { t } = useTranslation()

  const options: { value: GeneralAccessType; label: string; desc: string; icon: any }[] = [
    {
      value: 'restricted',
      label: t.shareModal.restricted,
      desc: t.shareModal.restrictedSub,
      icon: Lock
    },
    {
      value: 'public',
      label: t.shareModal.publicLink || t.shareModal.publicLabel || 'Anyone with the link',
      desc: t.shareModal.publicLinkSub || t.shareModal.publicDesc,
      icon: Globe
    }
  ]

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (type: GeneralAccessType) => {
    onChange(type)
    setIsOpen(false)
    showToast(t.shareModal.generalAccessUpdated || 'General access updated')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
        setFocusedIndex(0)
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) => (prev + 1) % options.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => (prev - 1 + options.length) % options.length)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          handleSelect(options[focusedIndex].value)
        }
        break
      default:
        break
    }
  }

  const selectedOption = options.find((o) => o.value === value) || options[0]

  return (
    <div className="space-y-2.5 shrink-0 select-none text-left">
      <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        {t.shareModal.generalAccessLabel}
      </h3>

      <div 
        className={cn(
          "rounded-2xl border p-4 flex items-center justify-between gap-3",
          "bg-slate-50/60 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800"
        )} 
        ref={dropdownRef}
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Status Badge */}
          <div className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center shrink-0 border select-none transition-all duration-300 shadow-xs",
            value === 'public'
              ? "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400"
              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
          )}>
            <selectedOption.icon className="h-4.5 w-4.5" />
          </div>

          <div className="min-w-0 flex flex-col flex-1 relative">
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 px-1 py-0.5 rounded-lg select-none text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              >
                <span>{selectedOption.label}</span>
                <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "absolute left-0 mt-1 shadow-xl rounded-2xl z-50 py-1.5 w-64 focus:outline-none border",
                      "bg-white text-slate-900 border-slate-200",
                      "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800"
                    )}
                  >
                    {options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer border-none bg-transparent focus:outline-none",
                          value === opt.value 
                            ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20" 
                            : "text-slate-700 dark:text-slate-350"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <opt.icon className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{opt.label}</span>
                        </span>
                        {value === opt.value && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-1 mt-0.5 leading-relaxed">
              {value === 'public'
                ? t.shareModal.publicLinkSub || t.shareModal.publicDesc
                : t.shareModal.restrictedSub || t.shareModal.restrictedDesc}
            </p>
          </div>
        </div>

        {/* Public Visitor Permission dropdown if general access is public */}
        {value === 'public' && onPublicRoleChange && (
          <div className="shrink-0 animate-fade-in">
            <PermissionDropdown
              value={publicRole}
              onChange={(role) => {
                onPublicRoleChange(role)
                showToast(t.shareModal.permissionUpdated || 'Permission updated')
              }}
              className="h-[36px] px-3 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold"
              ariaLabel="Public link permission level"
            />
          </div>
        )}
      </div>
    </div>
  )
}

