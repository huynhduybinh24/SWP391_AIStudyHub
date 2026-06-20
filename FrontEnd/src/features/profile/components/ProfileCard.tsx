import { useState, useEffect, useRef } from 'react'
import { GraduationCap, School, BookOpen, Mail, User, ShieldCheck, Edit3, Camera } from 'lucide-react'
import { useProfileStore } from '../stores/profileStore'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from '@/context/LanguageContext'
import { useToast } from '@/components/ui/Toast'

export function ProfileCard() {
  const { language } = useTranslation()
  const toast = useToast()
  const { profile, updateProfile } = useProfileStore()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role?.toLowerCase() === 'admin'
  
  const rawAvatar = user?.email
    ? (localStorage.getItem(`aiStudyHubUserAvatar:${user.email}`) || profile.avatarUrl)
    : profile.avatarUrl
  const profileAvatarUrl = (rawAvatar && rawAvatar !== '/logo.png') ? rawAvatar : undefined

  // Inline Edit States
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [nameInput, setNameInput] = useState(profile.name)
  const [universityInput, setUniversityInput] = useState(profile.university)
  const [majorInput, setMajorInput] = useState(profile.major)
  const [degreeInput, setDegreeInput] = useState(profile.degree)
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(profileAvatarUrl)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Keep fields synchronized when not editing
  useEffect(() => {
    if (!isEditing) {
      setNameInput(profile.name)
      setUniversityInput(profile.university)
      setMajorInput(profile.major)
      setDegreeInput(profile.degree)
      setAvatarPreview(profileAvatarUrl)
    }
  }, [profile, profileAvatarUrl, isEditing])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error(language === 'vi' ? 'Ảnh quá lớn (tối đa 2MB)' : 'Image too large (max 2MB)')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const img = new Image()
      img.src = result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 256
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
          const compressed = canvas.toDataURL('image/jpeg', 0.7)
          setAvatarPreview(compressed)
        } else {
          setAvatarPreview(result)
        }
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!nameInput.trim()) {
      toast.error(language === 'vi' ? 'Tên không được để trống' : 'Name cannot be empty')
      return
    }

    setIsLoading(true)
    try {
      // 1. Update backend & profile store state
      await updateProfile({
        name: nameInput,
        university: universityInput,
        major: majorInput,
        degree: degreeInput,
        avatarUrl: avatarPreview || '/logo.png'
      })

      // 2. Update user-scoped local avatar cache
      if (user?.email) {
        if (avatarPreview && avatarPreview.startsWith('data:image')) {
          localStorage.setItem(`aiStudyHubUserAvatar:${user.email}`, avatarPreview)
        } else if (!avatarPreview) {
          localStorage.removeItem(`aiStudyHubUserAvatar:${user.email}`)
        }
      }

      // Sync header and profile cards
      window.dispatchEvent(new Event('aiStudyHubProfileUpdated'))
      window.dispatchEvent(new Event('aiStudyHubUserChanged'))

      toast.success(language === 'vi' ? 'Cập nhật hồ sơ thành công!' : 'Profile updated successfully!')
      setIsEditing(false)
    } catch (e: any) {
      console.error('Failed to save profile:', e)
      toast.error(language === 'vi' ? 'Lưu thông tin thất bại!' : 'Failed to save profile details!')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-md hover:shadow-lg transition-all duration-300">
      {/* Premium Cover Accent Banner */}
      <div className="relative h-40 w-full bg-gradient-to-tr from-[#1E40AF] via-[#3B82F6] to-[#8B5CF6] dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#312E81] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_40%)]" />
        <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-white/5 blur-xl" />
        <div className="absolute -top-10 -right-10 size-40 rounded-full bg-blue-400/25 blur-2xl" />
      </div>
      
      {/* Profile Detail Block */}
      <div className="relative px-8 pb-10 pt-0">
        
        {/* Hidden File Input for Avatar */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          aria-hidden="true"
        />

        {/* Action Button Trigger in Top Right */}
        <div className="absolute top-4 right-8 flex gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-500/10 transition flex items-center gap-1.5 cursor-pointer"
              >
                {isLoading && (
                  <span className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {language === 'vi' ? 'Lưu' : 'Save'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-slate-200/20"
            >
              <Edit3 className="size-3.5" />
              {language === 'vi' ? 'Chỉnh sửa' : 'Edit'}
            </button>
          )}
        </div>

        {/* Profile Avatar Overlay with soft ring */}
        <div className="absolute -top-16 left-8">
          <div 
            onClick={() => isEditing && fileInputRef.current?.click()}
            className={`size-28 overflow-hidden rounded-[28px] border-4 border-white dark:border-slate-900 bg-slate-100 p-1 dark:bg-slate-800 shadow-xl transition-all duration-300 ${isEditing ? 'cursor-pointer group/avatar relative hover:scale-105' : 'hover:scale-105'}`}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={nameInput}
                referrerPolicy="no-referrer"
                className="h-full w-full rounded-[22px] object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-3xl rounded-[22px]">
                {nameInput.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'US'}
              </div>
            )}
            {/* Edit overlay indicator */}
            {isEditing && (
              <div className="absolute inset-1 rounded-[22px] bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200">
                <Camera className="size-6 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Spacing for avatar overlay */}
        <div className="h-16" />

        {/* User Bio */}
        <div className="space-y-3 mt-2">
          <div className="flex flex-wrap items-center gap-3">
            {isEditing ? (
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="text-2xl font-bold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                placeholder={language === 'vi' ? 'Họ và tên' : 'Full Name'}
              />
            ) : (
              <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight leading-none">
                {profile.name}
              </h2>
            )}
            
            {/* Elegant Plan/Admin Badge */}
            {isAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 text-white shadow-md shadow-rose-500/20">
                <ShieldCheck className="size-3.5 shrink-0" />
                {language === 'vi' ? 'Quản Trị Viên' : 'Administrator'}
              </span>
            ) : (
              user?.plan === 'pro' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                  <span className="size-1.5 bg-white rounded-full animate-ping shrink-0" />
                  {language === 'vi' ? 'Hội Viên Pro' : 'Pro Plan'}
                </span>
              ) : user?.plan === 'institutional' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-teal-500/20">
                  <span className="size-1.5 bg-white rounded-full animate-ping shrink-0" />
                  {language === 'vi' ? 'Tổ Chức' : 'Institutional'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-450 border border-slate-200/40 dark:border-slate-800">
                  {language === 'vi' ? 'Miễn Phí' : 'Free Plan'}
                </span>
              )
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-450 font-medium">
            <Mail className="size-4 text-slate-400 shrink-0" />
            <span>{user?.email ?? 'user@lumiedu.com'}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-slate-100 dark:border-slate-800/60" />

        {/* Detail Items Grid with clean icons & spacing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* University */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/40 dark:hover:bg-slate-850/40 border border-slate-100/10 hover:border-slate-100/30 transition-all duration-200">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0 border border-blue-100/20">
              <School className="size-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
                {language === 'vi' ? 'Trường Học' : 'University'}
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={universityInput}
                  onChange={(e) => setUniversityInput(e.target.value)}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1 text-slate-700 dark:text-slate-200"
                  placeholder="University"
                />
              ) : (
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1 leading-snug truncate">
                  {profile.university || 'FPT University'}
                </p>
              )}
            </div>
          </div>

          {/* Major */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/40 dark:hover:bg-slate-850/40 border border-slate-100/10 hover:border-slate-100/30 transition-all duration-200">
            <div className="flex size-11 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0 border border-purple-100/20">
              <BookOpen className="size-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
                {language === 'vi' ? 'Chuyên ngành' : 'Major'}
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={majorInput}
                  onChange={(e) => setMajorInput(e.target.value)}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1 text-slate-700 dark:text-slate-200"
                  placeholder="Major"
                />
              ) : (
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1 leading-snug truncate">
                  {profile.major || 'Software engineering'}
                </p>
              )}
            </div>
          </div>

          {/* Degree */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/40 dark:hover:bg-slate-850/40 border border-slate-100/10 hover:border-slate-100/30 transition-all duration-200">
            <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100/20">
              <GraduationCap className="size-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
                {language === 'vi' ? 'Học vị' : 'Degree'}
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={degreeInput}
                  onChange={(e) => setDegreeInput(e.target.value)}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1 text-slate-700 dark:text-slate-200"
                  placeholder="Degree"
                />
              ) : (
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1 leading-snug truncate">
                  {profile.degree || 'Bachelor'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
