import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BackButtonProps = {
  label: string
  to: string
  className?: string
}

export default function BackButton({ label, to, className }: BackButtonProps) {
  const navigate = useNavigate()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    // Prevent default scroll behavior
    window.history.scrollRestoration = 'manual'

    // Reset window scroll instantly to the top-left corner
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    })

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

    // Perform smooth routing
    navigate(to)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 shrink-0 cursor-pointer shadow-sm active:scale-[0.98]',
        'bg-white border-slate-200 text-slate-700 hover:bg-slate-100',
        'dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800',
        className
      )}
    >
      <ArrowLeft className="size-4 shrink-0" />
      <span>{label}</span>
    </button>
  )
}
