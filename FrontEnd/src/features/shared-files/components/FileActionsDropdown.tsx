import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Edit2, Shield, Trash2, Download, Share2 } from 'lucide-react'

interface FileActionsDropdownProps {
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
  onDownload: () => void
  onShareAccess: () => void
  onRename: () => void
  onChangePermission: () => void
  onRemoveAccess: () => void
  buttonRef: React.RefObject<HTMLButtonElement>
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
  const [coords, setCoords] = useState({ top: 0, left: 0, isBelow: true })

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
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

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return

    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect()
      const dropdownWidth = 192 // w-48 is 192px
      const dropdownHeight = 260 // approx height of menu items

      let top = rect.bottom + window.scrollY + 8
      let left = rect.right + window.scrollX - dropdownWidth
      let isBelow = true

      // If opening below would overflow screen height, open above
      if (rect.bottom + dropdownHeight + 8 > window.innerHeight) {
        top = rect.top + window.scrollY - dropdownHeight - 8
        isBelow = false
      }

      // Safeguard left bounds
      if (left < 10) {
        left = 10
      }

      setCoords({ top, left, isBelow })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [isOpen, buttonRef])

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, scale: 0.95, y: coords.isBelow ? -8 : 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: coords.isBelow ? -8 : 8 }}
          transition={{ duration: 0.12 }}
          style={{
            position: 'absolute',
            top: coords.top,
            left: coords.left,
          }}
          className="w-48 rounded-2xl bg-white p-1.5 shadow-xl border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800 z-[9999] text-left"
          role="menu"
          aria-orientation="vertical"
        >
          <button
            type="button"
            onClick={() => {
              onOpen()
              onClose()
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-slate-750 dark:text-slate-250 hover:bg-[#F4F7FE] dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            role="menuitem"
          >
            <ExternalLink className="size-4 text-slate-400 dark:text-slate-550" />
            <span>Open</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              onDownload()
              onClose()
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-slate-750 dark:text-slate-250 hover:bg-[#F4F7FE] dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            role="menuitem"
          >
            <Download className="size-4 text-slate-400 dark:text-slate-550" />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onShareAccess()
              onClose()
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-slate-750 dark:text-slate-250 hover:bg-[#F4F7FE] dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            role="menuitem"
          >
            <Share2 className="size-4 text-slate-400 dark:text-slate-555" />
            <span>Share Access</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onRename()
              onClose()
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-slate-750 dark:text-slate-250 hover:bg-[#F4F7FE] dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            role="menuitem"
          >
            <Edit2 className="size-4 text-slate-400 dark:text-slate-550" />
            <span>Rename</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onChangePermission()
              onClose()
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-slate-750 dark:text-slate-250 hover:bg-[#F4F7FE] dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            role="menuitem"
          >
            <Shield className="size-4 text-slate-400 dark:text-slate-550" />
            <span>Change Permission</span>
          </button>
          
          <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-1" />
          
          <button
            type="button"
            onClick={() => {
              onRemoveAccess()
              onClose()
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
            role="menuitem"
          >
            <Trash2 className="size-4 text-red-500/80 dark:text-red-400/80" />
            <span>Remove Access</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(menuContent, document.body)
}

export default FileActionsDropdown
