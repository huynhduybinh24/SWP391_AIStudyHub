import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/features/profile/stores/profileStore'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'
import { Check, Shield, GraduationCap, Sparkles, Lock, Trash2, X } from 'lucide-react'
import { authService } from '@/features/auth/services/authService'

interface ChangeUserModalProps {
  isOpen: boolean
  onClose: () => void
}

interface MockUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  plan: 'FREE' | 'PRO'
  avatar?: string
  initials: string
  description: string
  remembered?: boolean
  isGoogle?: boolean
  tokens?: any
}

export function ChangeUserModal({ isOpen, onClose }: ChangeUserModalProps) {
  const { t, language } = useTranslation()
  const toast = useToast()
  
  const authUser = useAuthStore((s) => s.user)
  
  const [mockUsers, setMockUsers] = useState<MockUser[]>([])
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Load registered logged-in accounts dynamically on this device
  useEffect(() => {
    const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
    let list: MockUser[] = []
    let changedInStorage = false
    
    const virtualEmails = [
      'admin@example.com', 
      'binh@example.com', 
      'sarah@school.edu', 
      'tan@example.com', 
      'alex@example.com', 
      'sarah@example.com', 
      'marcus@example.com', 
      'emily@example.com',
      'student@university.edu'
    ]

    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          // Filter out old mock emails so only database-supported accounts show up
          const filtered = parsed.filter(u => 
            u.email && !virtualEmails.includes(u.email.toLowerCase())
          )
          
          // Migrate any student/instructor role to user, rename student/instructor users
          list = filtered.map(u => {
            let role = u.role
            let name = u.name
            let initials = u.initials
            let description = u.description

            if (role === 'student' || role === 'instructor') {
              role = 'user'
              changedInStorage = true
            }
            if (name === 'Student User' || name === 'Instructor User') {
              name = 'LumiEdu User'
              initials = 'LU'
              description = language === 'vi'
                ? 'Tài khoản người dùng kết nối trực tiếp cơ sở dữ liệu.'
                : 'User account connected directly to database.'
              changedInStorage = true
            }
            return { ...u, role, name, initials, description }
          })
        }
      } catch (e) {
        console.error('Failed to parse logged-in accounts', e)
      }
    }
    
    if (list.length === 0) {
      // Seed initial database user switcher list
      const seedList: MockUser[] = [
        {
          id: '1',
          name: 'LumiEdu User',
          email: 'student@lumiedu.com',
          role: 'user',
          plan: 'FREE',
          initials: 'LU',
          description: language === 'vi' 
            ? 'Tài khoản người dùng kết nối trực tiếp cơ sở dữ liệu.'
            : 'User account connected directly to database.',
          remembered: false
        },
        {
          id: '2',
          name: 'LumiEdu User',
          email: 'instructor@lumiedu.com',
          role: 'user',
          plan: 'FREE',
          initials: 'LU',
          description: language === 'vi' 
            ? 'Tài khoản người dùng kết nối trực tiếp cơ sở dữ liệu.'
            : 'User account connected directly to database.',
          remembered: false
        },
        {
          id: '3',
          name: 'Admin User',
          email: 'admin@lumiedu.com',
          role: 'admin',
          plan: 'PRO',
          initials: 'AU',
          description: language === 'vi' 
            ? 'Tài khoản quản trị viên kết nối trực tiếp cơ sở dữ liệu.'
            : 'Admin account connected directly to database.',
          remembered: false
        }
      ]
      localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(seedList))
      list = seedList
    } else if (changedInStorage) {
      localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(list))
    } else {
      // If we filtered out old accounts, update the localStorage to be in sync
      localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(list))
    }

    setMockUsers(list)
  }, [language, isOpen])

  // Sync selected mock user
  useEffect(() => {
    if (mockUsers.length > 0) {
      const idx = mockUsers.findIndex(u => u.email?.toLowerCase() === authUser?.email?.toLowerCase())
      setSelectedUser(idx !== -1 ? mockUsers[idx] : mockUsers[0])
    }
  }, [mockUsers, authUser])

  const getTargetPassword = () => {
    if (!selectedUser) return ''
    let pwd = selectedUser.email?.toLowerCase().endsWith('@lumiedu.com') ? '123456' : ''

    // 1. Search dynamically in the logged-in accounts registry (captured during login)
    const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
    if (stored) {
      try {
        const list = JSON.parse(stored)
        const found = list.find((u: any) => u.email?.toLowerCase() === selectedUser.email?.toLowerCase())
        if (found && found.password) {
          return found.password
        }
      } catch (e) {
        console.error('Failed to parse logged in accounts in switcher:', e)
      }
    }

    // 2. Fallback to standard local user database registration password
    const savedUsersStr = localStorage.getItem('aiStudyHubUsers')
    if (savedUsersStr) {
      try {
        const users = JSON.parse(savedUsersStr)
        const found = users.find((u: any) => u.email?.toLowerCase() === selectedUser.email?.toLowerCase())
        if (found && found.password) {
          pwd = found.password
        }
      } catch (e) {
        console.error(e)
      }
    }
    return pwd
  }

  const getPasswordForEmail = (email: string) => {
    let pwd = email?.toLowerCase().endsWith('@lumiedu.com') ? '123456' : '' // Fallback
    const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
    if (stored) {
      try {
        const list = JSON.parse(stored)
        const found = list.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
        if (found && found.password) {
          return found.password
        }
      } catch (e) {}
    }
    const savedUsersStr = localStorage.getItem('aiStudyHubUsers')
    if (savedUsersStr) {
      try {
        const users = JSON.parse(savedUsersStr)
        const found = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
        if (found && found.password) {
          return found.password
        }
      } catch (e) {}
    }
    return pwd
  }

  const handleSaveActiveUserPreference = (remembered: boolean) => {
    if (!authUser) return

    try {
      const activeEmail = authUser.email?.toLowerCase()
      const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
      if (stored) {
        const list = JSON.parse(stored)
        if (Array.isArray(list)) {
          const updated = list.map((u: any) => {
            if (u.email?.toLowerCase() === activeEmail) {
              return {
                ...u,
                remembered: remembered,
                askedRemember: true, // Mark that we have prompted this user once!
                password: getPasswordForEmail(activeEmail)
              }
            }
            return u
          })
          localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(updated))
          setMockUsers(updated)
        }
      }

      toast.success(
        remembered
          ? (language === 'vi' ? `Đã lưu thông tin chuyển nhanh của ${authUser.name}` : `Saved quick switch credentials for ${authUser.name}`)
          : (language === 'vi' ? `Không lưu thông tin của ${authUser.name}` : `Did not save credentials for ${authUser.name}`)
      )
    } catch (e) {
      console.error(e)
    }

    setShowSavePrompt(false)

    // Now trigger the switch sequence to the selectedUser
    if (selectedUser) {
      const isRemembered = selectedUser.remembered === true
      if (isRemembered) {
        executeUserSwitch(true)
      } else {
        setShowPasswordPrompt(true)
        setPasswordInput('')
        setPasswordError('')
      }
    }
  }

  const executeUserSwitch = (remembered: boolean, loggedInResponse?: any) => {
    if (!selectedUser) return

    try {
      // Keep B's switcher preferences exactly as B has them
      const finalUser = {
        ...selectedUser,
        remembered: remembered
      }

      // If we have a backend response, use the real user details from the database!
      const userToUse = loggedInResponse ? loggedInResponse.user : {
        id: finalUser.id,
        name: finalUser.name,
        email: finalUser.email,
        role: finalUser.role,
        plan: finalUser.plan.toLowerCase() as 'free' | 'pro' | 'institutional',
        avatarUrl: finalUser.avatar || '/avatar.svg',
      }
      
      const tokensToUse = loggedInResponse ? loggedInResponse.tokens : { accessToken: 'mock-db-token' }

      // 1. Save to localStorage current active user
      localStorage.setItem('aiStudyHubCurrentUser', JSON.stringify({
        id: userToUse.id,
        name: userToUse.name,
        email: userToUse.email,
        role: userToUse.role,
        plan: userToUse.plan,
        avatar: userToUse.avatarUrl || '/avatar.svg'
      }))

      // 2. Update Zustand Stores
      useAuthStore.setState({
        user: userToUse,
        tokens: tokensToUse,
        isAuthenticated: true,
      })

      useProfileStore.setState({
        profile: {
          name: userToUse.name,
          university: 'FPT University',
          major: 'Software engineering',
          degree: 'Bachelor',
          avatarUrl: userToUse.avatarUrl || '/avatar.svg',
        }
      })

      // 3. Dispatch Custom Event
      window.dispatchEvent(new Event('aiStudyHubUserChanged'))

      // 4. Feedback Toast
      const textSwitched = language === 'vi' 
        ? (t.userSwitch.switched || 'Đã chuyển sang {name}').replace('{name}', userToUse.name)
        : (t.userSwitch.switched || 'Switched to {name}').replace('{name}', userToUse.name)
      toast.success(textSwitched)
      
      setShowPasswordPrompt(false)
      setShowSavePrompt(false)
      onClose()
    } catch (err) {
      console.error('Failed to switch user:', err)
      toast.error('Failed to switch account')
    }
  }

  const handleSwitchUser = async () => {
    if (!selectedUser) return

    // Avoid switching if selected is already the currently active user
    const isCurrentlyActive = authUser?.email?.toLowerCase() === selectedUser.email?.toLowerCase()
    if (isCurrentlyActive) {
      toast.error(language === 'vi' ? 'Bạn đang sử dụng tài khoản này!' : 'You are already using this account!')
      return
    }

    // Try to switch instantly using saved session tokens if available (instant 0ms bypass)
    if (selectedUser.tokens && selectedUser.tokens.accessToken) {
      executeUserSwitch(selectedUser.remembered || false, {
        user: {
          id: selectedUser.id.startsWith('u-') ? selectedUser.id.replace('u-', '') : selectedUser.id,
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
          plan: selectedUser.plan.toLowerCase() as any,
          avatarUrl: selectedUser.avatar || '/avatar.svg',
        },
        tokens: selectedUser.tokens
      })
      return
    }

    // Verify if it is a Google account
    const savedPassword = getTargetPassword()
    const isGoogleAccount = selectedUser.isGoogle || (!selectedUser.email?.toLowerCase().endsWith('@lumiedu.com') && !savedPassword)

    if (isGoogleAccount) {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '885322210817-bh9ua0cnrt5d7ogt6950o3ipekq6kdv3.apps.googleusercontent.com'
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback')
      
      toast.info(language === 'vi' ? 'Đang chuyển hướng sang Google để đăng nhập...' : 'Redirecting to Google for authentication...')
      
      if (clientId.includes('dummy')) {
        window.location.href = `${window.location.origin}/auth/callback?code=mock-google-code-123456`
        return
      }
      
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile&login_hint=${encodeURIComponent(selectedUser.email)}`
      return
    }

    // Step 1: Prompt to save the *currently logged-in* active user's credentials first (if not already asked or remembered & not admin)
    const activeEmail = authUser?.email?.toLowerCase()
    const isCurrentAdmin = authUser?.role === 'admin'
    
    let isActiveAlreadyAskedOrRemembered = false
    const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
    if (stored) {
      try {
        const list = JSON.parse(stored)
        const found = list.find((u: any) => u.email?.toLowerCase() === activeEmail)
        if (found && (found.remembered === true || found.askedRemember === true)) {
          isActiveAlreadyAskedOrRemembered = true
        }
      } catch (e) {}
    }

    if (!isActiveAlreadyAskedOrRemembered && !isCurrentAdmin && !showSavePrompt && !showPasswordPrompt) {
      setShowSavePrompt(true)
      return
    }

    // Step 2: Handle target B's switch sequence
    const isRemembered = selectedUser.remembered === true

    // If target B is already remembered and we have a saved password, switch immediately by calling backend
    if (isRemembered && savedPassword) {
      try {
        const response = await authService.login({ email: selectedUser.email, password: savedPassword })
        executeUserSwitch(true, response)
        return
      } catch (err) {
        toast.error(language === 'vi' ? 'Thông tin đăng nhập cũ không khớp. Vui lòng nhập lại mật khẩu!' : 'Saved password expired. Please enter password!')
        handleForgetPassword(selectedUser)
      }
    }

    // Otherwise show target B's password prompt
    if (!showPasswordPrompt) {
      setShowPasswordPrompt(true)
      setPasswordInput('')
      setPasswordError('')
      return
    }

    // Verify target B's password using the real backend login API
    if (showPasswordPrompt) {
      try {
        const response = await authService.login({ email: selectedUser.email, password: passwordInput })
        
        // If the target user was set to remembered, save the password to local storage history
        if (selectedUser.remembered) {
          const storedAccs = localStorage.getItem('aiStudyHubLoggedInAccounts')
          if (storedAccs) {
            try {
              const list = JSON.parse(storedAccs)
              const updated = list.map((u: any) => {
                if (u.email?.toLowerCase() === selectedUser.email.toLowerCase()) {
                  return { ...u, password: passwordInput }
                }
                return u
              })
              localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(updated))
            } catch (e) {}
          }
        }

        executeUserSwitch(selectedUser.remembered || false, response)
      } catch (err: any) {
        setPasswordError(language === 'vi' ? 'Mật khẩu không chính xác hoặc lỗi hệ thống!' : 'Incorrect password or system error!')
        toast.error(language === 'vi' ? 'Đăng nhập thất bại!' : 'Login failed!')
      }
    }
  }

  const handleForgetPassword = (targetUser: MockUser) => {
    try {
      const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
      if (stored) {
        const list = JSON.parse(stored)
        if (Array.isArray(list)) {
          const updated = list.map((u: any) => {
            if (u.email?.toLowerCase() === targetUser.email?.toLowerCase()) {
              return {
                ...u,
                remembered: false,
                askedRemember: false, // Reset so they can be prompted again next time they switch
                password: '' // Clear saved password for security!
              }
            }
            return u
          })
          localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(updated))
          setMockUsers(updated.slice(0, 4))
          
          // If the currently selected user is this targetUser, sync the state as well!
          if (selectedUser?.email?.toLowerCase() === targetUser.email?.toLowerCase()) {
            setSelectedUser({
              ...selectedUser,
              remembered: false
            })
          }

          toast.success(
            language === 'vi'
              ? `Đã xóa thông tin đăng nhập nhanh của tài khoản ${targetUser.name}`
              : `Cleared quick login credentials for ${targetUser.name}`
          )
        }
      }
    } catch (e) {
      console.error('Failed to forget saved credentials:', e)
      toast.error('Failed to clear credentials')
    }
  }

  const handleRemoveAccountCard = (targetUser: MockUser) => {
    try {
      const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
      if (stored) {
        const list = JSON.parse(stored)
        if (Array.isArray(list)) {
          const updated = list.filter((u: any) => u.email?.toLowerCase() !== targetUser.email?.toLowerCase())
          localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(updated))
          setMockUsers(updated.slice(0, 4))
          
          // If the currently selected user was this targetUser, select the first available account card
          if (selectedUser?.email?.toLowerCase() === targetUser.email?.toLowerCase() && updated.length > 0) {
            setSelectedUser(updated[0])
          }

          toast.success(
            language === 'vi'
              ? `Đã xóa tài khoản ${targetUser.name} khỏi thiết bị này`
              : `Removed account ${targetUser.name} from this device`
          )
        }
      }
    } catch (e) {
      console.error('Failed to remove account card:', e)
      toast.error('Failed to remove account')
    }
  }

  const getUserCardDescription = (user: MockUser) => {
    if (user.email?.toLowerCase() === 'admin@example.com') {
      return language === 'vi'
        ? 'Có toàn quyền truy cập trang quản trị và cài đặt hệ thống.'
        : 'Full access to admin dashboard and system settings.'
    }
    if (user.email?.toLowerCase() === 'binh@example.com') {
      return language === 'vi'
        ? 'Tài khoản học viên tiêu chuẩn với tài liệu và tính năng học tập.'
        : 'Standard learner account with documents and study features.'
    }
    if (user.email?.toLowerCase() === 'sarah@school.edu') {
      return language === 'vi'
        ? 'Có thể quản lý tài liệu khóa học và cộng tác với học viên.'
        : 'Can manage shared course materials and student collaboration.'
    }
    if (user.email?.toLowerCase() === 'tan@example.com') {
      return language === 'vi'
        ? 'Tài khoản học viên có dung lượng nâng cấp và tính năng cao cấp.'
        : 'Student account with upgraded storage and premium features.'
    }

    // Dynamic date parsing for other logged in accounts
    let dateStr = new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')
    if (user.description) {
      const match = user.description.match(/(\d+[\/\-]\d+[\/\-]\d+)/)
      if (match) {
        dateStr = match[1]
      }
    }

    return language === 'vi'
      ? `Tài khoản đăng nhập hệ thống ngày ${dateStr}`
      : `Account logged in on ${dateStr}`
  }

  const getRoleIcon = (role: MockUser['role']) => {
    switch (role) {
      case 'admin':
        return <Shield className="size-4 text-rose-500 dark:text-rose-400" />
      default:
        return <GraduationCap className="size-4 text-blue-500 dark:text-blue-400" />
    }
  }

  const getRoleBadgeClass = (role: MockUser['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30'
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setShowPasswordPrompt(false)
        setShowSavePrompt(false)
        onClose()
      }}
      title={
        showSavePrompt
          ? (language === 'vi' ? 'Lưu thông tin đăng nhập?' : 'Save credentials?')
          : showPasswordPrompt
            ? (language === 'vi' ? 'Xác thực bảo mật' : 'Security Verification')
            : (language === 'vi' ? t.userSwitch.title || 'Đổi người dùng' : t.userSwitch.title || 'Change User')
      }
      description={
        showSavePrompt
          ? (language === 'vi' ? 'Lưu lại để chuyển tài khoản nhanh hơn trong tương lai.' : 'Save to switch account faster on this device next time.')
          : showPasswordPrompt
            ? (language === 'vi' ? 'Cần mật khẩu tài khoản để chuyển nhanh.' : 'Account password required to switch account.')
            : (language === 'vi' ? 'Danh sách tài khoản đã đăng nhập trên thiết bị này.' : 'List of accounts logged in on this device.')
      }
      className="max-w-xl"
    >
      <div className="space-y-6">
        {showSavePrompt && authUser ? (
          <div className="space-y-6 py-4 flex flex-col items-center text-center">
            {/* Save Credentials Pulsing Icon */}
            <div className="flex size-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 border border-blue-100 dark:border-blue-900/30 animate-pulse">
              <Sparkles className="size-6 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="space-y-2 max-w-sm">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {language === 'vi' ? `Lưu thông tin tài khoản ${authUser.name}?` : `Remember account ${authUser.name}?`}
              </h3>
              <p className="text-xs font-semibold text-slate-450 dark:text-slate-400 leading-relaxed">
                {language === 'vi'
                  ? `Bạn có muốn lưu lại thông tin của tài khoản đang đăng nhập (${authUser.name}) để lần sau chuyển đổi nhanh quay lại tài khoản này không?`
                  : `Would you like to save your currently logged-in account (${authUser.name}) on this device for instant switching back next time?`}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3 w-full max-w-xs pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                onClick={() => handleSaveActiveUserPreference(false)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-bold py-2.5"
              >
                {language === 'vi' ? 'Không lưu' : "Don't Save"}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSaveActiveUserPreference(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-550 text-white rounded-xl font-bold cursor-pointer text-xs py-2.5 shadow-md shadow-blue-500/10"
              >
                {language === 'vi' ? 'Lưu thông tin' : 'Save Info'}
              </Button>
            </div>
          </div>
        ) : showPasswordPrompt && selectedUser ? (
          <div className="space-y-6 py-4 flex flex-col items-center text-center">
            {/* Pulsing Lock Icon */}
            <div className="flex size-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-100 dark:border-rose-900/30 animate-pulse">
              <Lock className="size-6" />
            </div>

            <div className="space-y-2 max-w-sm">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {language === 'vi' ? `Xác minh Tài khoản ${selectedUser.name}` : `Verify Account ${selectedUser.name}`}
              </h3>
              <p className="text-xs font-semibold text-slate-450 dark:text-slate-400 leading-relaxed">
                {language === 'vi'
                  ? `Để chuyển sang tài khoản này, vui lòng nhập mật khẩu tài khoản (Mật khẩu: ${getTargetPassword()}).`
                  : `To switch to this account, please enter the account password (Password: ${getTargetPassword()}).`}
              </p>
            </div>

            {/* Input field */}
            <div className="w-full max-w-xs space-y-2">
              <input
                type="password"
                placeholder={language === 'vi' ? 'Nhập mật khẩu...' : 'Enter password...'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value)
                  setPasswordError('')
                }}
                className={`w-full px-4 py-3 rounded-xl border text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-550/20 transition-all ${
                  passwordError
                    ? 'border-rose-500 bg-rose-50/20 text-rose-600 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-rose-500'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSwitchUser()
                }}
                autoFocus
              />
              {passwordError && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-450">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3 w-full max-w-xs pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                onClick={() => {
                  // Simply close the password verification screen back to card list selection
                  setShowPasswordPrompt(false)
                  setPasswordInput('')
                  setPasswordError('')
                }}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-bold py-2.5"
              >
                {language === 'vi' ? 'Quay lại' : 'Back'}
              </Button>
              <Button
                variant="primary"
                onClick={handleSwitchUser}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold cursor-pointer text-xs py-2.5 shadow-md shadow-rose-500/10"
              >
                {language === 'vi' ? 'Xác thực' : 'Verify'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockUsers.map((user) => {
                const isSelected = selectedUser?.id === user.id
                const isCurrentlyActive = authUser?.email?.toLowerCase() === user.email?.toLowerCase()

                return (
                  <div
                    key={user.id}
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

                    {/* Remembered Status Key Icon */}
                    {user.remembered && !user.isGoogle && user.email?.toLowerCase().endsWith('@lumiedu.com') && (
                      <span className="absolute bottom-3 right-10 inline-flex items-center text-[10px] font-bold text-blue-500 dark:text-blue-400 scale-90" title="Đăng nhập nhanh đã lưu">
                        ⚡ {language === 'vi' ? 'Chuyển nhanh' : 'Quick'}
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-3 w-full">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
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

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {user.remembered && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleForgetPassword(user)
                            }}
                            className="p-1 rounded-lg text-slate-450 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-450 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                            title={language === 'vi' ? 'Xóa thông tin chuyển nhanh' : 'Forget quick switch password'}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}

                        {!isCurrentlyActive && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveAccountCard(user)
                            }}
                            className="p-1 rounded-lg text-slate-450 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-450 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                            title={language === 'vi' ? 'Xóa tài khoản khỏi thiết bị này' : 'Remove account from this device'}
                          >
                            <X className="size-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 mt-3 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wide border shadow-2xs ${getRoleBadgeClass(user.role)}`}>
                        {getRoleIcon(user.role)}
                        {user.role}
                      </span>
                      
                      {user.role !== 'admin' && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider border shadow-2xs ${
                          user.plan === 'PRO'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/30'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}>
                          {user.plan}
                        </span>
                      )}

                      {(user.isGoogle || !user.email?.toLowerCase().endsWith('@lumiedu.com')) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider border shadow-2xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-450 dark:border-amber-900/30">
                          Google
                        </span>
                      )}
                    </div>

                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed font-medium line-clamp-2">
                      {getUserCardDescription(user)}
                    </p>

                    {/* Selection Checkmark */}
                    {isSelected && (
                      <div className="absolute bottom-3 right-3 flex size-5 items-center justify-center rounded-full bg-blue-600 text-white dark:bg-blue-500 animate-scale-in shadow-sm">
                        <Check className="size-3" strokeWidth={3} />
                      </div>
                    )}
                  </div>
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
          </>
        )}
      </div>
    </Modal>
  )
}
