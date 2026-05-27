import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Edit2, Shield, Trash2, Download, Share2, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

import { SharedFile } from './SharedFilesTable'

interface FileActionsDropdownProps {
  file: SharedFile
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
  onDownload?: () => void
  onShareAccess?: () => void
  onRename: () => void
  onChangePermission: () => void
  onRemoveAccess: () => void
  onReport?: () => void
  buttonRef: React.RefObject<HTMLButtonElement | null>
}

export function FileActionsDropdown({
  file,
  isOpen,
  onClose,
  onOpen,
  onDownload,
  onShareAccess,
  onRename,
  onChangePermission,
  onRemoveAccess,
  onReport,
  buttonRef
}: FileActionsDropdownProps) {
  const { t, language } = useTranslation()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [_openUpward, setOpenUpward] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const [_focusedIndex, setFocusedIndex] = useState(-1)

  const isOwner = file.owner === 'me' || file.permission === 'Owner'
  const isEditor = file.permission === 'Editor'


  const updatePosition = () => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const menuWidth = 260
    
    // Estimate menu height based on rendered items
    let numItems = 1 // Open is always present
    if (onDownload) numItems++
    if (onShareAccess && isOwner) numItems++
    if (isOwner || isEditor) numItems++ // Rename
    if (isOwner) numItems++ // Change Permission
    if (isOwner) numItems++ // Remove Access
    if (!isOwner && onReport) numItems++ // Report
    const menuHeight = numItems * 44 + 20
    const gap = 8

    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > spaceBelow

    const top = shouldOpenUp
      ? rect.top - menuHeight - gap
      : rect.bottom + gap

    const left = Math.min(
      Math.max(rect.right - menuWidth, 8),
      window.innerWidth - menuWidth - 8
    )

    // Close the menu if the anchor button is scrolled completely out of the viewport
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      onClose()
      return
    }

    setCoords({ top, left })
    setOpenUpward(shouldOpenUp)
  }

  // Position updates on scroll & resize (with capture = true for scroll)
  useEffect(() => {
    if (!isOpen) return

    updatePosition()

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, onDownload, onShareAccess, buttonRef])

  // ESC, Click Outside, and Keyboard Navigation
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

  const itemClass = "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:bg-slate-100 dark:focus-visible:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 9999
          }}
          className={cn(
            "w-[260px] rounded-3xl p-2 shadow-2xl border text-left",
            "bg-white text-slate-900 border-slate-200",
            "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800"
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {/* 1. OPEN (All) */}
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
          
          {/* 2. DOWNLOAD (All) */}
          {onDownload && (
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
              <span>Download</span>
            </button>
          )}

          {/* 3. SHARE ACCESS (Owner only) */}
          {onShareAccess && isOwner && (
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
              <span>Share Access</span>
            </button>
          )}

          {/* 4. RENAME (Owner & Editor) */}
          {(isOwner || isEditor) && (
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
          )}

          {/* 5. CHANGE PERMISSION (Owner only) */}
          {isOwner && (
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
          )}
          
          {/* 6. REMOVE ACCESS (Owner only) */}
          {isOwner && (
            <>
              <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-1" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveAccess()
                  onClose()
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[13px] font-bold text-red-600 dark:text-red-400 hover:bg-red-55/15 dark:hover:bg-red-955/20 focus-visible:bg-red-55/15 dark:focus-visible:bg-red-955/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                role="menuitem"
              >
                <Trash2 className="size-4 text-red-500 dark:text-red-400" />
                <span>{t.sharedFiles.removeAccess}</span>
              </button>
            </>
          )}

          {/* 7. REPORT FILE (Not Owner) */}
          {!isOwner && onReport && (
            <>
              <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-1" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onReport()
                  onClose()
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[13px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-55/15 dark:hover:bg-amber-955/20 focus-visible:bg-amber-55/15 dark:focus-visible:bg-amber-955/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                role="menuitem"
              >
                <Flag className="size-4 text-amber-500 dark:text-amber-400" />
                <span>{language === 'vi' ? 'Báo cáo vi phạm' : 'Report Abuse'}</span>
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default FileActionsDropdown

