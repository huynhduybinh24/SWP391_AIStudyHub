import { useState, useRef } from 'react'
import { Camera, Upload, Trash2 } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

interface AvatarUploaderProps {
  /** Current preview data URL (base64) or null */
  avatarPreview: string | null
  /** Whether user has a custom avatar (either saved or previewing) */
  hasCustomAvatar: boolean
  /** Display name for fallback initial */
  displayName: string
  /** Called with base64 data URL when a valid file is selected */
  onAvatarChange: (dataUrl: string) => void
  /** Called when user clicks remove */
  onAvatarRemove: () => void
}

export function AvatarUploader({
  avatarPreview,
  hasCustomAvatar,
  displayName,
  onAvatarChange,
  onAvatarRemove,
}: AvatarUploaderProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const initial = (displayName || 'U').charAt(0).toUpperCase()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset the input so the same file can be re-selected
    e.target.value = ''

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError(t.settings.avatarInvalidType)
      return
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      setFileError(t.settings.avatarTooLarge)
      return
    }

    setFileError(null)

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const img = new Image()
      img.src = result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 256 // Max width/height for avatar
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7)
          onAvatarChange(compressedDataUrl)
        } else {
          onAvatarChange(result)
        }
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = () => {
    setFileError(null)
    onAvatarRemove()
  }

  return (
    <div className="flex items-center gap-5 pb-6 mb-6 border-b border-border/60 dark:border-slate-800/80">
      {/* Avatar preview */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group relative flex-shrink-0 cursor-pointer"
        aria-label={t.settings.avatarChangePhoto}
      >
        <div className="size-[88px] rounded-full ring-2 ring-[#2563EB]/20 dark:ring-[#2563EB]/30 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 overflow-hidden transition-all duration-200 group-hover:ring-[#2563EB]/50">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white text-2xl font-bold">
              {initial}
            </div>
          )}
        </div>
        {/* Camera overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Camera className="size-5 text-white" />
        </div>
      </button>

      {/* Text & buttons */}
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <p className="text-sm font-semibold text-foreground dark:text-slate-200">
            {t.settings.avatarLabel}
          </p>
          <p className="text-xs text-muted dark:text-slate-400 mt-0.5">
            {t.settings.avatarDescription}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#2563EB]/30 text-[#2563EB] hover:bg-[#2563EB]/5 dark:border-[#2563EB]/40 dark:text-blue-400 dark:hover:bg-[#2563EB]/10 transition-colors cursor-pointer"
          >
            <Upload className="size-3.5" />
            {t.settings.avatarChangePhoto}
          </button>

          {hasCustomAvatar && (
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800/50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              {t.settings.avatarRemovePhoto}
            </button>
          )}
        </div>

        {/* File error message */}
        {fileError && (
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1">
            {fileError}
          </p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  )
}
