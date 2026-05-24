import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Edit2, Shield, Trash2, Download, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

interface FileActionsDropdownProps {
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
  onDownload: () => void
  onShareAccess: () => void
  onRename: () => void
  onChangePermission: () => void
  onRemoveAccess: () => void
  buttonRef: React.RefObject<HTMLButtonElement | null>
}

export function FileActionsDropdown({
  isOpen,
  onClose,
  onOpen,
  onDownload,
  onShareAccess,
  onRename,
  onChangePermission,
  onRemoveAccess,
  buttonRef
}: FileActionsDropdownProps) {
  const { t } = useTranslation()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [openUpward, setOpenUpward] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  // ESC and Click Outside Listeners + Keyboard arrow navigation
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if clicking the trigger button itself
      if (buttonRef.current && buttonRef.current.contains(e.target as Node)) {
        return
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        buttonRef.current?.focus()
        return
      }

      const items = dropdownRef.current?.querySelectorAll('[role="menuitem"]')
      if (!items || items.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex((prev) => {
          const next = (prev + 1) % items.length
          ;(items[next] as HTMLElement).focus()
          return next
        })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex((prev) => {
          const next = prev <= 0 ? items.length - 1 : prev - 1
          ;(items[next] as HTMLElement).focus()
          return next
        })
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, buttonRef])

  // Reset focus index when menu opens
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(-1)
    }
  }, [isOpen])

  // Detect bottom boundaries to flip upward if near screen bottom
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return

    const checkPosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect()
      const dropdownHeight = 270 // Approximate height of menu
      if (rect.bottom + dropdownHeight > window.innerHeight) {
        setOpenUpward(true)
      } else {
        setOpenUpward(false)
      }
    }

    checkPosition()
    window.addEventListener('resize', checkPosition)
    window.addEventListener('scroll', checkPosition)
    return () => {
      window.removeEventListener('resize', checkPosition)
      window.removeEventListener('scroll', checkPosition)
    }
  }, [isOpen, buttonRef])

  const itemClass = "flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:bg-slate-100 dark:focus-visible:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "absolute right-0 w-[240px] rounded-2xl p-1.5 shadow-xl border z-[9999] text-left",
            "bg-white text-slate-900 border-slate-200",
            "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800",
            openUpward ? "bottom-full mb-2" : "top-full mt-2"
          )}
          role="menu"
          aria-orientation="vertical"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpen()
              onClose()
            }}
            className={itemClass}
            role="menuitem"
          >
            <ExternalLink className="size-4 text-slate-400 dark:text-slate-500" />
            <span>{t.actionMenu.open}</span>
          </button>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDownload()
              onClose()
            }}
            className={itemClass}
            role="menuitem"
          >
            <Download className="size-4 text-slate-400 dark:text-slate-500" />
            <span>{t.sharedFiles.download}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onShareAccess()
              onClose()
            }}
            className={itemClass}
            role="menuitem"
          >
            <Share2 className="size-4 text-slate-400 dark:text-slate-500" />
            <span>{t.actionMenu.share}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRename()
              onClose()
            }}
            className={itemClass}
            role="menuitem"
          >
            <Edit2 className="size-4 text-slate-400 dark:text-slate-500" />
            <span>{t.sharedFiles.rename}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChangePermission()
              onClose()
            }}
            className={itemClass}
            role="menuitem"
          >
            <Shield className="size-4 text-slate-400 dark:text-slate-500" />
            <span>{t.sharedFiles.changePermission}</span>
          </button>
          
          <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-1" />
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemoveAccess()
              onClose()
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 focus-visible:bg-red-50 dark:focus-visible:bg-red-950/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            role="menuitem"
          >
            <Trash2 className="size-4 text-red-500 dark:text-red-400" />
            <span>{t.sharedFiles.removeAccess}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FileActionsDropdown

