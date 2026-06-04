import { GraduationCap, School, BookOpen, Mail, User } from 'lucide-react'
import { useProfileStore } from '../stores/profileStore'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from '@/context/LanguageContext'

export function ProfileCard() {
  const { language } = useTranslation()
  const { profile } = useProfileStore()
  const user = useAuthStore((s) => s.user)

  return (
    <div className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm">
      {/* Cover Accent Banner */}
      <div className="h-32 w-full bg-gradient-to-r from-blue-500 via-[#3155F6] to-indigo-600 dark:from-blue-900 dark:via-blue-850 dark:to-indigo-950" />
      
      {/* Profile Detail Block */}
      <div className="relative px-6 pb-8 pt-0">
        {/* Profile Avatar Overlay */}
        <div className="absolute -top-12 left-6">
          <div className="size-24 overflow-hidden rounded-3xl border-4 border-white dark:border-slate-900 bg-slate-150 p-0.5 dark:bg-slate-800 shadow-md">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                referrerPolicy="no-referrer"
                className="h-full w-full rounded-[20px] object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-400 dark:bg-slate-700">
                <User className="size-10 text-slate-400" />
              </div>
            )}
          </div>
        </div>

        {/* Spacing for avatar overlay */}
        <div className="h-16" />

        {/* User Bio */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight leading-tight">
              {profile.name}
            </h2>
            
            {/* Elegant Plan Badge */}
            {user?.plan === 'pro' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/10">
                <span className="size-1 bg-white rounded-full animate-ping shrink-0" />
                {language === 'vi' ? 'Vip Pro' : 'Pro Plan'}
              </span>
            ) : user?.plan === 'institutional' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm shadow-teal-500/10">
                <span className="size-1 bg-white rounded-full animate-ping shrink-0" />
                {language === 'vi' ? 'Tổ Chức' : 'Institutional'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-450 border border-slate-200/50 dark:border-slate-700/50">
                {language === 'vi' ? 'Miễn Phí' : 'Free Plan'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 font-medium leading-none">
            <Mail className="size-3.5 shrink-0" />
            <span>{user?.email ?? 'alex.rivera@fpt.edu.vn'}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-slate-100 dark:border-slate-800/50" />

        {/* Detail Items grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* University */}
          <div className="flex gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30 text-[#3155F6] dark:text-blue-400 shrink-0 border border-blue-100/10">
              <School className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                {language === 'vi' ? 'Trường Đại học' : language === 'ja' ? '大学' : language === 'ko' ? '대학교' : 'University'}
              </p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5 leading-snug">
                {profile.university}
              </p>
            </div>
          </div>

          {/* Major */}
          <div className="flex gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 shrink-0 border border-purple-100/10">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                {language === 'vi' ? 'Chuyên ngành' : language === 'ja' ? '専攻' : language === 'ko' ? '전공' : 'Major'}
              </p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5 leading-snug">
                {profile.major}
              </p>
            </div>
          </div>

          {/* Degree */}
          <div className="flex gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100/10">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                {language === 'vi' ? 'Bằng cấp' : language === 'ja' ? '学位' : language === 'ko' ? '학위' : 'Degree'}
              </p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5 leading-snug">
                {profile.degree}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
