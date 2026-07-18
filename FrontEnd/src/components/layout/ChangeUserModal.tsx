import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/features/profile/stores/profileStore'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'
import { Check, Shield, GraduationCap, Sparkles, Lock, Trash2, X, Eye, EyeOff } from 'lucide-react'
import { authService } from '@/features/auth/services/authService'
import { apiClient } from '@/lib/axios'

interface ChangeUserModalProps {
  isOpen: boolean
  onClose: () => void
}

interface MockUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  plan: string
  avatar?: string
  initials: string
  description: string
  remembered?: boolean
  isGoogle?: boolean
  tokens?: any
}

function cleanEmail(email?: string): string {
  if (!email) return ''
  return email.trim().toLowerCase().replace(/[^\x20-\x7E]/g, '')
}

function deduplicateAccounts(list: MockUser[]): MockUser[] {
  const uniqueMap = new Map<string, MockUser>()
  for (const u of list) {
    if (!u.email) continue
    const emailKey = cleanEmail(u.email)
    const cleanUser = {
      ...u,
      email: emailKey
    }
    if (!uniqueMap.has(emailKey)) {
      uniqueMap.set(emailKey, cleanUser)
    } else {
      const existing = uniqueMap.get(emailKey)!
      const hasTokens = !!u.tokens && !!u.tokens.accessToken
      const existingHasTokens = !!existing.tokens && !!existing.tokens.accessToken
      
      uniqueMap.set(emailKey, {
        ...existing,
        ...cleanUser,
        remembered: existing.remembered || cleanUser.remembered,
        tokens: existingHasTokens ? existing.tokens : (hasTokens ? cleanUser.tokens : existing.tokens),
        password: existing.password || cleanUser.password || undefined
      })
    }
  }
  return Array.from(uniqueMap.values())
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
  const [showPassword, setShowPassword] = useState(false)

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
            u.email && !virtualEmails.includes(cleanEmail(u.email))
          )
          
          // Deduplicate by email to avoid displaying duplicate cards
          const uniqueList = deduplicateAccounts(filtered)
          if (uniqueList.length !== filtered.length) {
            changedInStorage = true
          }
          
          // Migrate any student/instructor role to user, rename student/instructor users
          list = uniqueList.map(u => {
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

  // Listen for login/sync updates from other components
  useEffect(() => {
    const handleSync = () => {
      const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            setMockUsers(deduplicateAccounts(parsed))
          }
        } catch (e) {}
      }
    }
    window.addEventListener('aiStudyHubLoggedInAccountsUpdated', handleSync)
    return () => window.removeEventListener('aiStudyHubLoggedInAccountsUpdated', handleSync)
  }, [])

  // Synchronize mockUsers with their real profiles from the database when modal opens
  useEffect(() => {
    if (!isOpen || mockUsers.length === 0) return

    const fetchRealProfiles = async () => {
      let uniqueList = deduplicateAccounts([...mockUsers])
      let listChanged = uniqueList.length !== mockUsers.length

      for (let i = 0; i < uniqueList.length; i++) {
        const acc = uniqueList[i]
        try {
          const response = await apiClient.get<any>(`/users/by-email?email=${encodeURIComponent(cleanEmail(acc.email))}`)
          if (response.data) {
            const dbUser = response.data
            const planFormatted = (dbUser.plan || 'free').toUpperCase()
            const roleFormatted = dbUser.role?.toLowerCase() === 'admin' ? 'admin' : 'user'
            const nameFormatted = dbUser.fullName || dbUser.name || acc.name
            const initialsFormatted = nameFormatted.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'LU'
            
            // Resolve custom avatar from database, falling back to local storage scoped cache, then user.avatar
            const localCachedAvatar = localStorage.getItem(`aiStudyHubUserAvatar:${cleanEmail(acc.email)}`)
            const avatarFormatted = dbUser.avatarUrl || localCachedAvatar || acc.avatar || '/logo.png'

            // If the database has an avatar but local storage doesn't, sync it to local storage as well!
            if (dbUser.avatarUrl && dbUser.avatarUrl.startsWith('data:image') && !localCachedAvatar) {
              try {
                localStorage.setItem(`aiStudyHubUserAvatar:${cleanEmail(acc.email)}`, dbUser.avatarUrl)
              } catch (e) {
                console.warn('Failed to sync avatar to local storage:', e)
              }
            }

            // Check if any value changed
            if (
              acc.name !== nameFormatted ||
              acc.role !== roleFormatted ||
              acc.plan !== planFormatted ||
              acc.avatar !== avatarFormatted ||
              acc.initials !== initialsFormatted
            ) {
              uniqueList[i] = {
                ...acc,
                name: nameFormatted,
                role: roleFormatted,
                plan: planFormatted,
                initials: initialsFormatted,
                avatar: avatarFormatted
              }
              listChanged = true
            }
          }
        } catch (e) {
          console.warn(`Failed to fetch real profile for ${acc.email} from database`, e)
        }
      }

      if (listChanged) {
        localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(uniqueList))
        setMockUsers(uniqueList)
      }
    }

    fetchRealProfiles()
  }, [isOpen, mockUsers.length])

  // Sync selected mock user
  useEffect(() => {
    if (mockUsers.length > 0) {
      const idx = mockUsers.findIndex(u => cleanEmail(u.email) === cleanEmail(authUser?.email))
      setSelectedUser(idx !== -1 ? mockUsers[idx] : mockUsers[0])
    }
  }, [mockUsers, authUser])

  const getTargetPassword = () => {
    if (!selectedUser) return ''
    let pwd = cleanEmail(selectedUser.email).endsWith('@lumiedu.com') ? '123456' : ''

    // 1. Search dynamically in the logged-in accounts registry (captured during login)
    const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
    if (stored) {
      try {
        const list = JSON.parse(stored)
        const found = list.find((u: any) => cleanEmail(u.email) === cleanEmail(selectedUser.email))
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
        const found = users.find((u: any) => cleanEmail(u.email) === cleanEmail(selectedUser.email))
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
    let pwd = cleanEmail(email).endsWith('@lumiedu.com') ? '123456' : '' // Fallback
    const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
    if (stored) {
      try {
        const list = JSON.parse(stored)
        const found = list.find((u: any) => cleanEmail(u.email) === cleanEmail(email))
        if (found && found.password) {
          return found.password
        }
      } catch (e) {}
    }
    const savedUsersStr = localStorage.getItem('aiStudyHubUsers')
    if (savedUsersStr) {
      try {
        const users = JSON.parse(savedUsersStr)
        const found = users.find((u: any) => cleanEmail(u.email) === cleanEmail(email))
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
      const activeEmail = cleanEmail(authUser.email)
      const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
      if (stored) {
        const list = JSON.parse(stored)
        if (Array.isArray(list)) {
          const updated = list.map((u: any) => {
            if (cleanEmail(u.email) === activeEmail) {
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
      const userToUse = loggedInResponse ? {
        ...loggedInResponse.user,
        avatarUrl: localStorage.getItem(`aiStudyHubUserAvatar:${cleanEmail(loggedInResponse.user.email)}`) || loggedInResponse.user.avatarUrl || '/logo.png'
      } : {
        id: finalUser.id,
        name: finalUser.name,
        email: cleanEmail(finalUser.email),
        role: finalUser.role,
        plan: finalUser.plan.toLowerCase() as 'free' | 'pro' | 'institutional',
        avatarUrl: localStorage.getItem(`aiStudyHubUserAvatar:${cleanEmail(finalUser.email)}`) || finalUser.avatar || '/logo.png',
      }
      
      const tokensToUse = loggedInResponse ? loggedInResponse.tokens : { accessToken: 'mock-db-token' }

      // 1. Save to localStorage current active user
      localStorage.setItem('aiStudyHubCurrentUser', JSON.stringify({
        id: userToUse.id,
        name: userToUse.name,
        email: cleanEmail(userToUse.email),
        role: userToUse.role,
        plan: userToUse.plan,
        avatar: userToUse.avatarUrl || '/logo.png'
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
          university: userToUse.university || 'FPT University',
          major: userToUse.major || 'Software engineering',
          degree: userToUse.degree || 'Bachelor',
          avatarUrl: userToUse.avatarUrl || '/logo.png',
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

      // Redirect and reload to clean the SPA state for the new user role
      setTimeout(() => {
        if (userToUse.role?.toLowerCase() === 'admin') {
          sessionStorage.setItem('aiStudyHubSwitchingUser', 'true')
          window.location.href = '/dashboard/admin?tab=overview'
        } else {
          window.location.href = '/dashboard'
        }
      }, 800)
    } catch (err) {
      console.error('Failed to switch user:', err)
      toast.error('Failed to switch account')
    }
  }

  const handleSwitchUser = async () => {
    if (!selectedUser) return

    // Avoid switching if selected is already the currently active user
    const isCurrentlyActive = cleanEmail(authUser?.email) === cleanEmail(selectedUser.email)
    if (isCurrentlyActive) {
      toast.error(language === 'vi' ? 'Bạn đang sử dụng tài khoản này!' : 'You are already using this account!')
      return
    }

    const targetIsAdmin = selectedUser.role === 'admin'

    // Try to switch instantly using saved session tokens if available (instant 0ms bypass)
    // For admin security, always require password prompt unless already verifying password
    if (!targetIsAdmin && selectedUser.remembered && selectedUser.tokens && selectedUser.tokens.accessToken) {
      executeUserSwitch(selectedUser.remembered || false, {
        user: {
          id: selectedUser.id.startsWith('u-') ? selectedUser.id.replace('u-', '') : selectedUser.id,
          name: selectedUser.name,
          email: cleanEmail(selectedUser.email),
          role: selectedUser.role,
          plan: selectedUser.plan.toLowerCase() as any,
          avatarUrl: selectedUser.avatar || '/logo.png',
        },
        tokens: selectedUser.tokens
      })
      return
    }

    // Verify if it is a Google account
    const savedPassword = getTargetPassword()
    const isGoogleAccount = selectedUser.isGoogle === true

    if (isGoogleAccount && !targetIsAdmin) {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '299923810846-kfk4pv295irthtmvfdpuj91gijqkilmh.apps.googleusercontent.com'
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback')
      
      toast.info(language === 'vi' ? 'Đang chuyển hướng sang Google để đăng nhập...' : 'Redirecting to Google for authentication...')
      
      if (clientId.includes('dummy')) {
        window.location.href = `${window.location.origin}/auth/callback?code=mock-google-code-123456`
        return
      }
      
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile&login_hint=${encodeURIComponent(cleanEmail(selectedUser.email))}`
      return
    }

    // Step 1: Prompt to save the *currently logged-in* active user's credentials first (if not already asked or remembered & not admin)
    const activeEmail = cleanEmail(authUser?.email)
    const isCurrentAdmin = authUser?.role === 'admin'
    
    let isActiveAlreadyAskedOrRemembered = false
    const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
    if (stored) {
      try {
        const list = JSON.parse(stored)
        const found = list.find((u: any) => cleanEmail(u.email) === activeEmail)
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
    // For admin security, always require password prompt
    if (!targetIsAdmin && isRemembered && savedPassword) {
      try {
        const response = await authService.login({ email: cleanEmail(selectedUser.email), password: savedPassword })
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
        const response = await authService.login({ email: cleanEmail(selectedUser.email), password: passwordInput })
        
        // Sync updated details from the database login response
        const storedAccs = localStorage.getItem('aiStudyHubLoggedInAccounts')
        if (storedAccs) {
          try {
            const list = JSON.parse(storedAccs)
            const updated = list.map((u: any) => {
              if (cleanEmail(u.email) === cleanEmail(selectedUser.email)) {
                const planFormatted = (response.user.plan || 'free').toUpperCase()
                const roleFormatted = response.user.role?.toLowerCase() === 'admin' ? 'admin' : 'user'
                const nameFormatted = response.user.name || u.name
                const initialsFormatted = nameFormatted.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'LU'
                return {
                  ...u,
                  name: nameFormatted,
                  role: roleFormatted,
                  plan: planFormatted,
                  initials: initialsFormatted,
                  avatar: response.user.avatarUrl || u.avatar,
                  password: selectedUser.remembered ? passwordInput : u.password
                }
              }
              return u
            })
            localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(updated))
            setMockUsers(updated)
          } catch (e) {
            console.error('Failed to sync login updates to switcher list:', e)
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
            if (cleanEmail(u.email) === cleanEmail(targetUser.email)) {
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
          setMockUsers(updated)
          
          // If the currently selected user is this targetUser, sync the state as well!
          if (cleanEmail(selectedUser?.email) === cleanEmail(targetUser.email)) {
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
          const updated = list.filter((u: any) => cleanEmail(u.email) !== cleanEmail(targetUser.email))
          localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(updated))
          setMockUsers(updated)
          
          // If the currently selected user was this targetUser, select the first available account card
          if (cleanEmail(selectedUser?.email) === cleanEmail(targetUser.email) && updated.length > 0) {
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
    const cleanUserEmail = cleanEmail(user.email)
    if (cleanUserEmail === 'admin@example.com') {
      return language === 'vi'
        ? 'Có toàn quyền truy cập trang quản trị và cài đặt hệ thống.'
        : 'Full access to admin dashboard and system settings.'
    }
    if (cleanUserEmail === 'binh@example.com') {
      return language === 'vi'
        ? 'Tài khoản người dùng tiêu chuẩn với tài liệu và tính năng học tập.'
        : 'Standard user account with documents and study features.'
    }
    if (cleanUserEmail === 'sarah@school.edu') {
      return language === 'vi'
        ? 'Tài khoản người dùng có thể quản lý tài liệu học tập và cộng tác.'
        : 'User account with shared learning materials and collaboration features.'
    }
    if (cleanUserEmail === 'tan@example.com') {
      return language === 'vi'
        ? 'Tài khoản người dùng có dung lượng nâng cấp và tính năng cao cấp.'
        : 'User account with upgraded storage and premium features.'
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

  const renderModalContent = () => {
    if (showSavePrompt && authUser) {
      return (
        <div className="space-y-6 py-4 flex flex-col items-center text-center">
          {/* Save Credentials Pulsing Icon */}
          <div className="flex size-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 border border-blue-100 dark:border-blue-900/30 animate-pulse">
            <Sparkles className="size-6 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="space-y-2 max-w-sm">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {language === 'vi' ? `Lưu tài khoản của ${authUser.name}?` : `Save credentials for ${authUser.name}?`}
            </h3>
            <p className="text-xs font-semibold text-slate-450 dark:text-slate-400 leading-relaxed">
              {language === 'vi'
                ? `Lưu lại thông tin đăng nhập của tài khoản này trên thiết bị hiện tại? Lần tới chuyển ngược lại bằng trình đổi tài khoản nhanh sẽ không cần nhập lại mật khẩu.`
                : `Save this account credentials on this device? Next time switching back using quick switch won't require password authentication.`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3 w-full max-w-xs pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              onClick={() => handleSaveActiveUserPreference(false)}
              className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl font-bold cursor-pointer text-xs py-2.5"
            >
              {language === 'vi' ? 'Không lưu' : 'No, Thanks'}
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
      )
    }

    if (showPasswordPrompt && selectedUser) {
      return (
        <div className="space-y-6 py-2 flex flex-col items-center text-center">
          {/* Centered User Profile Circle */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              {(() => {
                const selectedUserAvatar = localStorage.getItem(`aiStudyHubUserAvatar:${selectedUser.email.trim()}`) || selectedUser.avatar || '/logo.png'
                return selectedUserAvatar && selectedUserAvatar !== '/logo.png' ? (
                  <img
                    src={selectedUserAvatar}
                    alt={selectedUser.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-800 shadow-md ring-4 ring-slate-105 dark:ring-slate-900/50 transition-all duration-300"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-lg text-white border-2 border-slate-200 dark:border-slate-800 shadow-md ring-4 ring-slate-105 dark:ring-slate-900/50 transition-all duration-300">
                    {selectedUser.initials}
                  </div>
                )
              })()}
              {/* Micro-badge of role */}
              <div className="absolute -bottom-1 -right-1 flex items-center justify-center p-1 rounded-full bg-blue-600 text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                <Lock className="size-3" />
              </div>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-3.5 leading-snug">
              {selectedUser.name}
            </h3>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
              {selectedUser.email}
            </p>

            <div className="flex items-center gap-1.5 mt-2.5 justify-center">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-2xs ${getRoleBadgeClass(selectedUser.role)}`}>
                {getRoleIcon(selectedUser.role)}
                {selectedUser.role}
              </span>
              {selectedUser.role !== 'admin' && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-2xs ${
                  selectedUser.plan === 'PRO'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/30'
                    : (selectedUser.plan === 'PREMIUM' || selectedUser.plan === 'INSTITUTIONAL' || selectedUser.plan === 'ENTERPRISE')
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}>
                  {selectedUser.plan}
                </span>
              )}
            </div>
          </div>

          {/* Password Input with left Lock and right Eye icons */}
          <div className="w-full max-w-xs space-y-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                <Lock className="size-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={language === 'vi' ? 'Nhập mật khẩu...' : 'Enter password...'}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSwitchUser()
                }}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-250 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 focus:outline-hidden text-sm font-semibold transition-all duration-200"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-left text-xs font-bold text-rose-500 dark:text-rose-450 animate-shake flex items-center gap-1">
                ⚠️ {passwordError}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3 w-full max-w-xs pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              onClick={() => {
                setShowPasswordPrompt(false)
                setPasswordInput('')
                setPasswordError('')
                setShowPassword(false)
              }}
              className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl font-bold cursor-pointer text-xs py-2.5"
            >
              {language === 'vi' ? 'Quay lại' : 'Back'}
            </Button>
            <Button
              variant="primary"
              onClick={handleSwitchUser}
              className="flex-1 bg-blue-600 hover:bg-blue-550 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer text-xs py-2.5 shadow-md shadow-blue-500/10"
            >
              {language === 'vi' ? 'Xác thực' : 'Verify'}
            </Button>
          </div>
        </div>
      )
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mockUsers.map((user) => {
            const isSelected = selectedUser?.email?.trim().toLowerCase() === user.email?.trim().toLowerCase()
            const isCurrentlyActive = authUser?.email?.trim().toLowerCase() === user.email?.trim().toLowerCase()

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
                {/* Active Indicator Badge */}
                {isCurrentlyActive && (
                  <span className="absolute top-3 right-3 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-green-50 text-green-700 border border-green-250 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/30">
                    🟢 {language === 'vi' ? t.userSwitch.current || 'Đang dùng' : t.userSwitch.current || 'Current'}
                  </span>
                )}

                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Avatar Image or Initials */}
                    {(() => {
                      const userAvatarUrl = localStorage.getItem(`aiStudyHubUserAvatar:${user.email.trim()}`) || user.avatar || '/logo.png'
                      return userAvatarUrl && userAvatarUrl !== '/logo.png' ? (
                        <img
                          src={userAvatarUrl}
                          alt={user.name}
                          className="flex-shrink-0 w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                        />
                      ) : (
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-850 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
                          {user.initials}
                        </div>
                      )
                    })()}

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-snug">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-snug mt-0.5">
                        {user.email}
                      </p>
                    </div>
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
                        : (user.plan === 'PREMIUM' || user.plan === 'INSTITUTIONAL' || user.plan === 'ENTERPRISE')
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30'
                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}>
                      {user.plan}
                    </span>
                  )}

                  {user.isGoogle && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider border shadow-2xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-450 dark:border-amber-900/30">
                      Google
                    </span>
                  )}

                  {user.remembered && !user.isGoogle && getPasswordForEmail(user.email) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider border shadow-2xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30" title="Đăng nhập nhanh đã lưu">
                      ⚡ {language === 'vi' ? 'Chuyển nhanh' : 'Quick'}
                    </span>
                  )}
                </div>

                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed font-medium line-clamp-2 pr-6">
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
    )
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
          : (showPasswordPrompt && selectedUser)
            ? (language === 'vi' ? `Xác minh tài khoản ${selectedUser.name}` : `Verify Account ${selectedUser.name}`)
            : (language === 'vi' ? t.userSwitch.title || 'Đổi người dùng' : t.userSwitch.title || 'Change User')
      }
      description={
        showSavePrompt
          ? (language === 'vi' ? 'Lưu lại để chuyển tài khoản nhanh hơn trong tương lai.' : 'Save to switch account faster on this device next time.')
          : (showPasswordPrompt && selectedUser)
            ? (language === 'vi'
              ? `Nhập mật khẩu của tài khoản ${selectedUser.email} để tiếp tục (Mật khẩu gợi ý: ${getTargetPassword()}).`
              : `Enter password for account ${selectedUser.email} to continue (Password hint: ${getTargetPassword()}).`)
            : (language === 'vi' ? 'Danh sách tài khoản đã đăng nhập trên thiết bị này.' : 'List of accounts logged in on this device.')
      }
      className="max-w-xl"
    >
      <div className="space-y-6">
        {renderModalContent()}
      </div>
    </Modal>
  )
}
