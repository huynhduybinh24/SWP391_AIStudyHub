import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

export type BackToSharedFilesButtonProps = {
  className?: string
  clearViewingFile?: () => void
  clearSelectedFile?: () => void
  clearOpenedFile?: () => void
  setViewingFile?: (val: any) => void
  setSelectedFile?: (val: any) => void
  setOpenedFile?: (val: any) => void
}

export default function BackToSharedFilesButton({
  className,
  clearViewingFile,
  clearSelectedFile,
  clearOpenedFile,
  setViewingFile,
  setSelectedFile,
  setOpenedFile
}: BackToSharedFilesButtonProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    clearViewingFile?.()
    clearSelectedFile?.()
    clearOpenedFile?.()

    setViewingFile?.(null)
    setSelectedFile?.(null)
    setOpenedFile?.(null)

    // Disable automatic restoration
    window.history.scrollRestoration = 'manual'

    // Reset window scroll instantly to the top-left corner
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      })
    } catch (err) {
      window.scrollTo(0, 0)
    }

    // Reset container scroll position if any scrollable containers exist
    const scrollableContainers = document.querySelectorAll(
      '.overflow-y-auto, [class*="overflow-y-auto"], .overflow-auto, [class*="overflow-auto"]'
    )
    scrollableContainers.forEach((container) => {
      container.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      })
    })

    // Route smoothly via React Router
    navigate('/dashboard/shared-files', {
      replace: true,
      state: {
        resetViewer: true
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        'inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 shrink-0 cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99]',
        'bg-white border-slate-200 text-slate-700 hover:bg-slate-100',
        'dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800',
        className
      )}
    >
      <ArrowLeft className="size-4 shrink-0" />
      <span>{t.fileViewer?.backToShared || 'Back to Shared Files'}</span>
    </button>
  )
}
