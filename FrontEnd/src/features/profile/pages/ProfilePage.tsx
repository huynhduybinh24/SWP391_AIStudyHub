import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Edit2 } from 'lucide-react'
import { ProfileCard } from '../components/ProfileCard'
import { LinkedAccounts } from '../components/LinkedAccounts'
import { StatisticsCard } from '../components/StatisticsCard'
import { EditProfileModal } from '../components/EditProfileModal'

export function ProfilePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

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
          <ProfileCard />
        </motion.div>

        {/* Right Column: Linked Accounts & Stats */}
        <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">
          <LinkedAccounts />
          <StatisticsCard />
        </motion.div>
      </div>

      {/* Edit Profile Modal Dialog */}
      <EditProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </motion.div>
  )
}

export default ProfilePage
