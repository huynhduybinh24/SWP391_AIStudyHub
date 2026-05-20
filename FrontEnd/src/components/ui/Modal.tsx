import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        ref={modalRef}
        className={cn(
          'relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-white p-6 pb-4">
          <div>
            {title && <h2 className="text-xl font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 -mt-2 -mr-2">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
