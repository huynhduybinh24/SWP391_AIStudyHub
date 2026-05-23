import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Edit2, Shield, Trash2, Download, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [openUpward, setOpenUpward] = useState(false)

  // ESC and Click Outside Listeners
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
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, buttonRef])

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
            "absolute right-0 w-[240px] rounded-2xl bg-white p-1.5 shadow-xl border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800 z-[9999] text-left",
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
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-slate-750 dark:text-slate-200 hover:bg-[#F4F7FE] dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            role="menuitem"
          >
            <ExternalLink className="size-4 text-slate-400 dark:text-slate-500" />
            <span>Open</span>
          </button>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDownload()
              onClose()
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-slate-750 dark:text-slate-200 hover:bg-[#F4F7FE] dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            role="menuitem"
          >
            <Download className="size-4 text-slate-400 dark:text-slate-500" />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onShareAccess()
              onClose()
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-slate-750 dark:text-slate-200 hover:bg-[#F4F7FE] dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            role="menuitem"
          >
            <Share2 className="size-4 text-slate-400 dark:text-slate-500" />
            <span>Share Access</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRename()
              onClose()
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-slate-750 dark:text-slate-200 hover:bg-[#F4F7FE] dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            role="menuitem"
          >
            <Edit2 className="size-4 text-slate-400 dark:text-slate-500" />
            <span>Rename</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChangePermission()
              onClose()
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-slate-750 dark:text-slate-200 hover:bg-[#F4F7FE] dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            role="menuitem"
          >
            <Shield className="size-4 text-slate-455 dark:text-slate-500" />
            <span>Change Permission</span>
          </button>
          
          <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-1" />
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemoveAccess()
              onClose()
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-red-600 dark:text-red-405 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
            role="menuitem"
          >
            <Trash2 className="size-4 text-red-500 dark:text-red-400" />
            <span>Remove Access</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FileActionsDropdown
