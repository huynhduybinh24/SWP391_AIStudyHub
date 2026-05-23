import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ShareRole = 'editor' | 'commenter' | 'viewer'

interface PermissionDropdownProps {
  value: ShareRole
  onChange: (role: ShareRole) => void
  onRemove?: () => void
  showRemove?: boolean
  align?: 'left' | 'right'
  ariaLabel?: string
}

export function PermissionDropdown({
  value,
  onChange,
  onRemove,
  showRemove = false,
  align = 'right',
  ariaLabel = 'Select permission level'
}: PermissionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const roles: { value: ShareRole; label: string }[] = [
    { value: 'viewer', label: 'Người xem' },
    { value: 'commenter', label: 'Người nhận xét' },
    { value: 'editor', label: 'Người chỉnh sửa' }
  ]

  const totalOptions = showRemove ? roles.length + 1 : roles.length

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

  // Handle keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
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
        buttonRef.current?.focus()
        break
      case 'Tab':
        setIsOpen(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) => (prev + 1) % totalOptions)
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => (prev - 1 + totalOptions) % totalOptions)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < roles.length) {
          onChange(roles[focusedIndex].value)
          setIsOpen(false)
          buttonRef.current?.focus()
        } else if (focusedIndex === roles.length && showRemove && onRemove) {
          onRemove()
          setIsOpen(false)
          buttonRef.current?.focus()
        }
        break
      default:
        break
    }
  }

  // Focus the active option when index changes
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listboxRef.current) {
      const items = listboxRef.current.querySelectorAll('[role="option"], [role="button"]')
      if (items[focusedIndex]) {
        (items[focusedIndex] as HTMLElement).focus()
      }
    }
  }, [focusedIndex, isOpen])

  const currentRoleLabel = roles.find((r) => r.value === value)?.label || 'Người xem'

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          setFocusedIndex(0)
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 bg-slate-900 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all select-none shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        <span className="truncate max-w-[120px]">{currentRoleLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={listboxRef}
            role="listbox"
            aria-label="Roles list"
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute mt-1.5 bg-slate-900 border border-slate-800 shadow-xl rounded-2xl z-50 py-1.5 w-44 focus:outline-none",
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            {roles.map((r, index) => (
              <div
                key={r.value}
                role="option"
                aria-selected={value === r.value}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onClick={() => {
                  onChange(r.value)
                  setIsOpen(false)
                  buttonRef.current?.focus()
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer focus:outline-none focus:bg-slate-800 select-none",
                  value === r.value 
                    ? "text-blue-400 bg-blue-950/20" 
                    : "text-slate-350 hover:bg-slate-800 hover:text-white"
                )}
              >
                <span>{r.label}</span>
                {value === r.value && <Check className="h-3.5 w-3.5 text-blue-400" />}
              </div>
            ))}

            {showRemove && onRemove && (
              <>
                <div className="my-1 border-t border-slate-800" />
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={handleKeyDown}
                  onClick={() => {
                    onRemove()
                    setIsOpen(false)
                    buttonRef.current?.focus()
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer focus:outline-none focus:bg-rose-950/30 select-none"
                >
                  Xóa quyền truy cập
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
