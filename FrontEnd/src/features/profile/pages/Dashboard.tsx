import { useState } from 'react'
import { motion, Variants } from 'framer-motion'
import { Edit2, GraduationCap, School, BookOpen, Mail, User } from 'lucide-react'
import { useProfileStore } from '../stores/profileStore'
import { useAuthStore } from '@/stores/authStore'
import { LinkedAccounts } from '../components/LinkedAccounts'

export function ProfileDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { profile } = useProfileStore()
  const user = useAuthStore((s) => s.user)

  // Stagger Container animations
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header section with Title, Subtitle and Edit Button */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-[#0b1c30] dark:text-white tracking-tight">
            My Profile
          </h1>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">
            Manage your academic identity and study preferences.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3155F6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2563eb] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-[#3155F6]/10 shrink-0 self-start sm:self-auto"
        >
          <Edit2 className="size-4" />
          Edit Profile
        </button>
      </motion.div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Academic Profile Overview */}
        <motion.div variants={itemVariants} className="lg:col-span-7 space-y-6">
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
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{profile.name}</h2>
                <div className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 font-medium">
                  <Mail className="size-3.5" />
                  <span>{user?.email ?? 'alex.rivera@fpt.edu.vn'}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-slate-100 dark:border-slate-800/50" />

              {/* Detail Items grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* University */}
                <div className="flex gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30 text-[#3155F6] dark:text-blue-400 shrink-0">
                    <School className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                      University
                    </p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                      {profile.university}
                    </p>
                  </div>
                </div>

                {/* Major */}
                <div className="flex gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 shrink-0">
                    <BookOpen className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                      Major
                    </p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                      {profile.major}
                    </p>
                  </div>
                </div>

                {/* Degree */}
                <div className="flex gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <GraduationCap className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                      Degree
                    </p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                      {profile.degree}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Linked Accounts & Stats */}
        <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">
          {/* Linked Accounts */}
          <LinkedAccounts />

          {/* Statistics Grid */}
            <StatsCard />
        </motion.div>
      </div>

      {/* Edit Profile Modal Dialog */}
      <ProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </motion.div>
  )
}
export default ProfileDashboard

// Fallback components to avoid missing symbol errors when the real components
// are not imported from other files. These are minimal stand-ins and can be
// replaced by proper implementations elsewhere in the project.
const StatsCard = () => {
  return (
    <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">No stats available</p>
    </div>
  )
}

const ProfileModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full mx-4 animate-fade-in">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Profile Editor</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Profile editor placeholder</p>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
