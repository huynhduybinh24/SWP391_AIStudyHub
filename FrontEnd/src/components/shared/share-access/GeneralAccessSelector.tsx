import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Lock, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PermissionDropdown, type ShareRole } from './PermissionDropdown'

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

  const options: { value: GeneralAccessType; label: string; desc: string; icon: any }[] = [
    {
      value: 'restricted',
      label: 'Bị hạn chế',
      desc: 'Chỉ những người được thêm mới có thể mở bằng đường liên kết',
      icon: Lock
    },
    {
      value: 'public',
      label: 'Bất kỳ ai có đường liên kết',
      desc: 'Bất kỳ ai có đường liên kết đều có thể xem',
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
    if (type === 'restricted') {
      showToast('General access updated')
    } else {
      showToast('General access updated')
    }
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
    <div className="space-y-3.5 shrink-0 select-none text-left">
      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
        QUYỀN TRUY CẬP CHUNG
      </h3>

      <div className="flex items-center justify-between gap-3" ref={dropdownRef}>
        <div className="flex items-start gap-3.5 min-w-0">
          {/* Status Badge */}
          <div className={cn(
            "w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 border select-none transition-all duration-300 shadow-inner",
            value === 'public'
              ? "bg-blue-950/30 border-blue-900/50 text-blue-400"
              : "bg-slate-800 border-slate-700 text-slate-400"
          )}>
            <selectedOption.icon className="h-4.5 w-4.5" />
          </div>

          <div className="min-w-0 flex flex-col">
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-extrabold text-slate-200 hover:bg-slate-800 rounded-lg select-none text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              >
                <span>{selectedOption.label}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-450 shrink-0" />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-1 bg-slate-900 border border-slate-800 shadow-xl rounded-2xl z-50 py-1.5 w-56 focus:outline-none"
                  >
                    {options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer",
                          value === opt.value ? "text-blue-400 bg-blue-950/20" : "text-slate-300"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <opt.icon className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{opt.label}</span>
                        </span>
                        {value === opt.value && <Check className="h-4 w-4 text-blue-400" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-[10px] text-slate-500 font-medium pl-1.5 mt-0.5 leading-relaxed">
              {value === 'public'
                ? 'Bất kỳ ai có đường liên kết đều có thể xem'
                : 'Chỉ những người được thêm mới có thể mở bằng đường liên kết'}
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
                showToast(`Permission updated`)
              }}
              ariaLabel="Public link permission level"
            />
          </div>
        )}
      </div>
    </div>
  )
}
