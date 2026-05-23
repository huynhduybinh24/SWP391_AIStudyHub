import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useProfileStore } from '../stores/profileStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

// Form validation schema using Zod
const profileSchema = z.object({
  name: z.string().min(2, 'Full Name must be at least 2 characters'),
  university: z.string().min(1, 'University is required'),
  major: z.string().min(1, 'Major is required'),
  degree: z.enum(['Bachelor', 'Master', 'PhD', 'Associate'], {
    message: 'Degree is required',
  }),
})

type ProfileFormInput = z.infer<typeof profileSchema>

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { profile, updateProfile } = useProfileStore()
  const [avatarPreview, setAvatarPreview] = useState<string>(profile.avatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      university: profile.university,
      major: profile.major,
      degree: profile.degree as any,
    },
  })

  // Sync default values when store profile changes or modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        name: profile.name,
        university: profile.university,
        major: profile.major,
        degree: profile.degree as any,
      })
      setAvatarPreview(profile.avatarUrl)
    }
  }, [isOpen, profile, reset])

  // Focus trap and ESC key handler
  useEffect(() => {
    if (!isOpen) return

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    )
    if (focusableElements && focusableElements.length > 0) {
      // Focus on the first element (usually close button or photo upload)
      (focusableElements[0] as HTMLElement).focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleModalClose()
        return
      }

      if (e.key === 'Tab' && focusableElements) {
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const onSubmit = (data: ProfileFormInput) => {
    updateProfile({
      ...data,
      avatarUrl: avatarPreview,
    })
    toast.success('Profile updated successfully')
    onClose()
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleModalClose = () => {
    reset({
      name: profile.name,
      university: profile.university,
      major: profile.major,
      degree: profile.degree as any,
    })
    setAvatarPreview(profile.avatarUrl)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleModalClose}
            className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content Box */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="relative z-10 w-full max-w-[540px] overflow-hidden rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Close Icon button */}
            <button
              onClick={handleModalClose}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            {/* Title */}
            <div className="mb-6">
              <h2 id="modal-title" className="text-xl font-bold text-[#0b1c30] dark:text-white">
                Edit Profile
              </h2>
            </div>

            {/* Form layout */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Photo selection */}
              <div className="flex items-center gap-5">
                <div className="relative group shrink-0 select-none">
                  <div className="size-20 overflow-hidden rounded-full border-2 border-[#3155F6] bg-slate-100 p-0.5 dark:bg-slate-800">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar Preview"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-400 dark:bg-slate-700">
                        {profile.name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-[#3155F6] text-white shadow-md hover:bg-[#2563eb] transition-all cursor-pointer border-2 border-white dark:border-slate-900"
                    aria-label="Upload photo"
                  >
                    <Camera className="size-3.5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-[#0b1c30] dark:text-slate-200">
                    Profile Picture
                  </span>
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="inline-flex w-fit rounded-lg bg-[#E5EEFF] dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-[#3155F6] dark:text-blue-400 hover:bg-[#d0e0ff] dark:hover:bg-slate-700 transition-all cursor-pointer border border-[#3155F6]/10"
                  >
                    Upload New Photo
                  </button>
                </div>
              </div>

              {/* Name field */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  Full Name
                </label>
                <Input
                  {...register('name')}
                  error={errors.name?.message}
                  className="bg-[#f0f4ff]/50 border border-slate-200/50 hover:border-slate-300 dark:bg-slate-800/40 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-offset-0 focus:ring-2 focus:ring-[#3155F6]/20 transition-all font-medium py-3 px-4 rounded-xl"
                  placeholder="Enter your full name"
                />
              </div>

              {/* University field */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  University
                </label>
                <Input
                  {...register('university')}
                  error={errors.university?.message}
                  className="bg-[#f0f4ff]/50 border border-slate-200/50 hover:border-slate-300 dark:bg-slate-800/40 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-offset-0 focus:ring-2 focus:ring-[#3155F6]/20 transition-all font-medium py-3 px-4 rounded-xl"
                  placeholder="Enter your university"
                />
              </div>

              {/* Major & Degree Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                    Major
                  </label>
                  <Input
                    {...register('major')}
                    error={errors.major?.message}
                    className="bg-[#f0f4ff]/50 border border-slate-200/50 hover:border-slate-300 dark:bg-slate-800/40 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-offset-0 focus:ring-2 focus:ring-[#3155F6]/20 transition-all font-medium py-3 px-4 rounded-xl"
                    placeholder="Enter your major"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                    Degree
                  </label>
                  <Select
                    {...register('degree')}
                    error={errors.degree?.message}
                    className="bg-[#f0f4ff]/50 border border-slate-200/50 hover:border-slate-300 dark:bg-slate-800/40 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-offset-0 focus:ring-2 focus:ring-[#3155F6]/20 transition-all font-medium py-3 px-4 rounded-xl h-[50px] cursor-pointer"
                  >
                    <option value="Associate">Associate</option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Master">Master</option>
                    <option value="PhD">PhD</option>
                  </Select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#3155F6] text-white hover:bg-[#2563eb] px-6 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-md shadow-[#3155F6]/10 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
