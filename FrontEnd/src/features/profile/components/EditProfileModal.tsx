import { useState, useRef, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, User, GraduationCap, BookOpen, Award } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useProfileStore } from '../stores/profileStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

type ProfileFormInput = {
  name: string
  university: string
  major: string
  degree: 'Bachelor' | 'Master' | 'PhD' | 'Associate'
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { t, language } = useTranslation()
  const { profile, updateProfile } = useProfileStore()
  const [avatarPreview, setAvatarPreview] = useState<string>(profile.avatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  // Dynamically localized validation schema
  const profileSchema = useMemo(() => {
    return z.object({
      name: z.string().min(2, language === 'vi' ? 'Tên đầy đủ phải dài ít nhất 2 ký tự' : language === 'ja' ? 'フルネームは2文字以上である必要があります' : language === 'ko' ? '이름은 최소 2자 이상이어야 합니다' : 'Full Name must be at least 2 characters'),
      university: z.string().min(1, language === 'vi' ? 'Vui lòng nhập tên trường đại học' : language === 'ja' ? '大学名は必須です' : language === 'ko' ? '대학교명은 필수입니다' : 'University is required'),
      major: z.string().min(1, language === 'vi' ? 'Vui lòng nhập chuyên ngành' : language === 'ja' ? '専攻は必須です' : language === 'ko' ? '전공은 필수입니다' : 'Major is required'),
      degree: z.enum(['Bachelor', 'Master', 'PhD', 'Associate'], {
        message: language === 'vi' ? 'Vui lòng chọn bằng cấp' : language === 'ja' ? '学位を選択してください' : language === 'ko' ? '학위를 선택해주세요' : 'Degree is required'
      }),
    })
  }, [language])

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

  const onSubmit = async (data: ProfileFormInput) => {
    try {
      await updateProfile({
        ...data,
        avatarUrl: avatarPreview,
      })
      toast.success(language === 'vi' ? 'Cập nhật hồ sơ thành công' : language === 'ja' ? 'プロフィールが正常に更新されました' : language === 'ko' ? '프로필이 성공적으로 업데이트되었습니다' : 'Profile updated successfully')
      onClose()
    } catch (error: any) {
      const msg = error?.message || (language === 'vi' ? 'Không thể cập nhật hồ sơ' : 'Failed to update profile')
      toast.error(msg)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const img = new Image()
        img.src = reader.result as string
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
            setAvatarPreview(compressedDataUrl)
          } else {
            setAvatarPreview(reader.result as string)
          }
        }
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
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            {/* Title Section */}
            <div className="mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="h-5 w-1 rounded-full bg-[#3155F6]" />
              <h2 id="modal-title" className="text-xl font-extrabold text-[#0b1c30] dark:text-white tracking-tight">
                {language === 'vi' ? 'Chỉnh sửa Hồ sơ' : language === 'ja' ? 'プロフィールを編集' : language === 'ko' ? '프로필 편집' : 'Edit Profile'}
              </h2>
            </div>

            {/* Form layout */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Photo selection zone with card design */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100/50 dark:border-slate-850/40 rounded-2xl flex items-center gap-5">
                <div className="relative shrink-0 select-none cursor-pointer group" onClick={triggerFileInput}>
                  {/* Avatar Container with glowing border */}
                  <div className="size-20 overflow-hidden rounded-full border-[3px] border-blue-500/20 bg-slate-100 p-0.5 dark:bg-slate-850 transition-all group-hover:border-[#3155F6] relative">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar Preview"
                        className="h-full w-full rounded-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-400 dark:bg-slate-700 font-bold text-xl">
                        {profile.name[0]?.toUpperCase()}
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full">
                      <Camera className="size-5 text-white" />
                      <span className="text-[8px] font-bold text-white uppercase mt-0.5 tracking-wider">
                        {language === 'vi' ? 'Thay đổi' : 'Change'}
                      </span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-[#3155F6] text-white shadow-md border-2 border-white dark:border-slate-900 pointer-events-none">
                    <Camera className="size-3.5" />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    {language === 'vi' ? 'Ảnh đại diện' : language === 'ja' ? 'プロフィール写真' : language === 'ko' ? '프로필 사진' : 'Profile Picture'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {language === 'vi' ? 'Hỗ trợ định dạng PNG, JPG tối đa 5MB.' : 'Supports PNG, JPG format up to 5MB.'}
                  </span>
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="mt-1.5 inline-flex w-fit rounded-lg bg-blue-55 hover:bg-blue-100 dark:bg-slate-850 dark:hover:bg-slate-800 px-3.5 py-1.5 text-[11px] font-extrabold text-[#3155F6] dark:text-blue-450 transition-all cursor-pointer border border-[#3155F6]/10 active:scale-[0.98]"
                  >
                    {language === 'vi' ? 'Tải ảnh mới lên' : language === 'ja' ? '新しい写真をアップロード' : language === 'ko' ? '새 사진 업로드' : 'Upload New Photo'}
                  </button>
                </div>
              </div>

              {/* Section: Personal Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest">
                    {language === 'vi' ? 'Thông tin cá nhân' : 'Personal Information'}
                  </p>
                  <div className="flex-1 h-[1px] bg-slate-100 dark:bg-slate-800/80" />
                </div>

                {/* Name field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold tracking-wider text-slate-450 dark:text-slate-500 uppercase flex items-center gap-1">
                    <User className="size-3 text-slate-450" />
                    {language === 'vi' ? 'Họ và Tên' : language === 'ja' ? '氏名' : language === 'ko' ? '이름' : 'Full Name'}
                  </label>
                  <Input
                    {...register('name')}
                    error={errors.name?.message}
                    startIcon={<User className="size-4 text-slate-400 dark:text-slate-500" />}
                    className="bg-[#f0f4ff]/30 border border-slate-200/50 hover:border-slate-350 dark:bg-slate-800/30 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-850 focus:ring-offset-0 focus:ring-2 focus:ring-[#3155F6]/20 transition-all font-medium py-3 rounded-xl"
                    placeholder={language === 'vi' ? 'Nhập họ và tên của bạn' : language === 'ja' ? '氏名を入力してください' : language === 'ko' ? '이름을 입력하세요' : 'Enter your full name'}
                  />
                </div>
              </div>

              {/* Section: Academic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest">
                    {language === 'vi' ? 'Thông tin học thuật' : 'Academic Information'}
                  </p>
                  <div className="flex-1 h-[1px] bg-slate-100 dark:bg-slate-800/80" />
                </div>

                {/* University field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold tracking-wider text-slate-455 dark:text-slate-500 uppercase flex items-center gap-1">
                    <GraduationCap className="size-3 text-slate-455" />
                    {language === 'vi' ? 'Trường Đại học' : language === 'ja' ? '大学' : language === 'ko' ? '대학교' : 'University'}
                  </label>
                  <Input
                    {...register('university')}
                    error={errors.university?.message}
                    startIcon={<GraduationCap className="size-4 text-slate-400 dark:text-slate-500" />}
                    className="bg-[#f0f4ff]/30 border border-slate-200/50 hover:border-slate-350 dark:bg-slate-800/30 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-850 focus:ring-offset-0 focus:ring-2 focus:ring-[#3155F6]/20 transition-all font-medium py-3 rounded-xl"
                    placeholder={language === 'vi' ? 'Nhập tên trường đại học' : language === 'ja' ? '大学名を入力してください' : language === 'ko' ? '대학교명을 입력하세요' : 'Enter your university'}
                  />
                </div>

                {/* Major & Degree Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold tracking-wider text-slate-450 dark:text-slate-500 uppercase flex items-center gap-1">
                      <BookOpen className="size-3 text-slate-450" />
                      {language === 'vi' ? 'Chuyên ngành' : language === 'ja' ? '専攻' : language === 'ko' ? '전공' : 'Major'}
                    </label>
                    <Input
                      {...register('major')}
                      error={errors.major?.message}
                      startIcon={<BookOpen className="size-4 text-slate-400 dark:text-slate-500" />}
                      className="bg-[#f0f4ff]/30 border border-slate-200/50 hover:border-slate-355 dark:bg-slate-800/30 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-850 focus:ring-offset-0 focus:ring-2 focus:ring-[#3155F6]/20 transition-all font-medium py-3 rounded-xl"
                      placeholder={language === 'vi' ? 'Nhập chuyên ngành' : language === 'ja' ? '専攻を入力してください' : language === 'ko' ? '전공을 입력하세요' : 'Enter your major'}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold tracking-wider text-slate-450 dark:text-slate-500 uppercase flex items-center gap-1">
                      <Award className="size-3 text-slate-450" />
                      {language === 'vi' ? 'Bằng cấp / Học vị' : language === 'ja' ? '学位' : language === 'ko' ? '학위' : 'Degree'}
                    </label>
                    <div className="relative">
                      <Select
                        {...register('degree')}
                        error={errors.degree?.message}
                        className="bg-[#f0f4ff]/30 border border-slate-200/50 hover:border-slate-350 dark:bg-slate-800/30 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-850 focus:ring-offset-0 focus:ring-2 focus:ring-[#3155F6]/20 transition-all font-medium py-3 pl-10 rounded-xl h-[48px] cursor-pointer"
                      >
                        <option value="Associate">{language === 'vi' ? 'Cao đẳng' : language === 'ja' ? '準学士' : language === 'ko' ? '준학사' : 'Associate'}</option>
                        <option value="Bachelor">{language === 'vi' ? 'Cử nhân' : language === 'ja' ? '学士' : language === 'ko' ? '학사' : 'Bachelor'}</option>
                        <option value="Master">{language === 'vi' ? 'Thạc sĩ' : language === 'ja' ? '修士' : language === 'ko' ? '석사' : 'Master'}</option>
                        <option value="PhD">{language === 'vi' ? 'Tiến sĩ' : language === 'ja' ? '博士' : language === 'ko' ? '박사' : 'PhD'}</option>
                      </Select>
                      <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-2">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer active:scale-[0.98]"
                >
                  {t.common.cancel}
                </button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#3155F6] hover:bg-[#2563eb] text-white px-6 py-2.5 text-sm font-bold rounded-xl transition-all shadow-md shadow-[#3155F6]/10 shrink-0 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                >
                  {isSubmitting ? t.settings.saving : t.settings.saveChanges}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
