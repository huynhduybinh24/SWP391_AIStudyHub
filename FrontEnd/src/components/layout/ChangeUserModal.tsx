import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/features/profile/stores/profileStore'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'
import { Check, Shield, GraduationCap, Sparkles } from 'lucide-react'

interface ChangeUserModalProps {
  isOpen: boolean
  onClose: () => void
}

interface MockUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'student' | 'instructor'
  plan: 'FREE' | 'PRO'
  avatar?: string
  initials: string
  description: string
}

export function ChangeUserModal({ isOpen, onClose }: ChangeUserModalProps) {
  const { t, language } = useTranslation()
  const toast = useToast()
  
  const authUser = useAuthStore((s) => s.user)
  
  // List of mock accounts
  const mockUsers: MockUser[] = [
    {
      id: 'admin-alex',
      name: 'Alex Morgan',
      email: 'admin@example.com',
      role: 'admin',
      plan: 'PRO',
      initials: 'AM',
      description: language === 'vi' 
        ? t.userSwitch.adminDescription || 'Có toàn quyền truy cập trang quản trị và cài đặt hệ thống.'
        : t.userSwitch.adminDescription || 'Full access to admin dashboard and system settings.'
    },
    {
      id: 'student-duybinh',
      name: 'Duy Binh',
      email: 'binh@example.com',
      role: 'student',
      plan: 'FREE',
      initials: 'DB',
      description: language === 'vi'
        ? t.userSwitch.studentDescription || 'Tài khoản học viên tiêu chuẩn với tài liệu và tính năng học tập.'
        : t.userSwitch.studentDescription || 'Standard learner account with documents and study features.'
    },
    {
      id: 'instructor-sarah',
      name: 'Sarah Jenkins',
      email: 'sarah@school.edu',
      role: 'instructor',
      plan: 'PRO',
      initials: 'SJ',
      description: language === 'vi'
        ? t.userSwitch.instructorDescription || 'Có thể quản lý tài liệu khóa học và cộng tác với học viên.'
        : t.userSwitch.instructorDescription || 'Can manage shared course materials and student collaboration.'
    },
    {
      id: 'student-ngoctan',
      name: 'Ngoc Tan',
      email: 'tan@example.com',
      role: 'student',
      plan: 'PRO',
      initials: 'NT',
      description: language === 'vi'
        ? t.userSwitch.proStudentDescription || 'Tài khoản học viên có dung lượng nâng cấp và tính năng cao cấp.'
        : t.userSwitch.proStudentDescription || 'Student account with upgraded storage and premium features.'
    }
  ]

  // Find index of current user based on email
  const currentActiveIdx = mockUsers.findIndex(u => u.email === authUser?.email)
  const initialSelected = currentActiveIdx !== -1 ? mockUsers[currentActiveIdx] : mockUsers[0]

  const [selectedUser, setSelectedUser] = useState<MockUser>(initialSelected)

  const handleSwitchUser = () => {
    try {
      // 1. Save to localStorage
      localStorage.setItem('aiStudyHubCurrentUser', JSON.stringify(selectedUser))

      // 2. Update Zustand Stores
      useAuthStore.setState({
        user: {
          id: selectedUser.id,
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
          plan: selectedUser.plan.toLowerCase() as 'free' | 'pro' | 'institutional',
          avatarUrl: selectedUser.avatar || '/avatar.svg',
        },
        isAuthenticated: true,
      })

      useProfileStore.setState({
        profile: {
          name: selectedUser.name,
          university: 'FPT University',
          major: 'Software engineering',
          degree: 'Bachelor',
          avatarUrl: selectedUser.avatar || '/avatar.svg',
        }
      })

      // 3. Dispatch Custom Event
      window.dispatchEvent(new Event('aiStudyHubUserChanged'))

      // 4. Feedback Toast
      const textSwitched = language === 'vi' 
        ? (t.userSwitch.switched || 'Đã chuyển sang {name}').replace('{name}', selectedUser.name)
        : (t.userSwitch.switched || 'Switched to {name}').replace('{name}', selectedUser.name)
      toast.success(textSwitched)
      
      onClose()
    } catch (err) {
      console.error('Failed to switch user:', err)
      toast.error('Failed to switch account')
    }
  }

  const getRoleIcon = (role: MockUser['role']) => {
    switch (role) {
      case 'admin':
        return <Shield className="size-4 text-rose-500 dark:text-rose-400" />
      case 'instructor':
        return <Sparkles className="size-4 text-amber-500 dark:text-amber-400" />
      default:
        return <GraduationCap className="size-4 text-blue-500 dark:text-blue-400" />
    }
  }

  const getRoleBadgeClass = (role: MockUser['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30'
      case 'instructor':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30'
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'vi' ? t.userSwitch.title || 'Đổi người dùng' : t.userSwitch.title || 'Change User'}
      description={language === 'vi' ? t.userSwitch.subtitle || 'Chọn tài khoản mẫu để kiểm thử quyền truy cập khác nhau.' : t.userSwitch.subtitle || 'Select a mock account to preview different permissions.'}
      className="max-w-xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mockUsers.map((user) => {
            const isSelected = selectedUser.id === user.id
            const isCurrentlyActive = authUser?.email === user.email

            return (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUser(user)}
                onDoubleClick={handleSwitchUser}
                className={`relative flex flex-col p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer group select-none ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-500/30 dark:border-blue-500 dark:bg-blue-950/15'
                    : 'border-slate-200 hover:border-slate-350 dark:border-slate-800 dark:hover:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850'
                }`}
              >
                {/* Current Badge */}
                {isCurrentlyActive && (
                  <span className="absolute top-3 right-3 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/30 uppercase tracking-wider scale-90">
                    {language === 'vi' ? t.userSwitch.current || 'Đang dùng' : t.userSwitch.current || 'Current'}
                  </span>
                )}

                <div className="flex items-center gap-3">
                  {/* Initials Avatar */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-850 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
                    {user.initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-snug">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-snug mt-0.5">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 mt-3 shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wide border shadow-2xs ${getRoleBadgeClass(user.role)}`}>
                    {getRoleIcon(user.role)}
                    {user.role}
                  </span>
                  
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider border shadow-2xs ${
                    user.plan === 'PRO'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/30'
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}>
                    {user.plan}
                  </span>
                </div>

                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed font-medium line-clamp-2">
                  {user.description}
                </p>

                {/* Selection Checkmark */}
                {isSelected && (
                  <div className="absolute bottom-3 right-3 flex size-5 items-center justify-center rounded-full bg-blue-600 text-white dark:bg-blue-500 animate-scale-in shadow-sm">
                    <Check className="size-3" strokeWidth={3} />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            {language === 'vi' ? t.userSwitch.cancel || 'Hủy' : t.userSwitch.cancel || 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={handleSwitchUser}
            className="bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer"
          >
            {language === 'vi' ? t.userSwitch.switch || 'Chuyển người dùng' : t.userSwitch.switch || 'Switch User'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
