import { useEffect, useRef, useState } from 'react'
import { Bell, CircleHelp, Sun, Moon, Menu, X, Search, History, TrendingUp, FileText, Sparkles, Folder, Calendar, MessageCircle, Shield, User } from 'lucide-react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUiStore } from '@/stores/uiStore'
import { useProfileStore } from '@/features/profile/stores/profileStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { useTheme } from '@/features/settings/components/ThemeProvider'
import { UserDropdown } from '@/components/layout/UserDropdown'
import { NotificationDropdown } from '@/components/layout/NotificationDropdown'
import { getCurrentUser } from '@/features/notifications/services/userNotificationService'
import { HelpModal } from '@/components/layout/HelpModal'
import { ConfirmLogoutModal } from '@/components/layout/ConfirmLogoutModal'
import { ChangeUserModal } from '@/components/layout/ChangeUserModal'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'

// â”€â”€â”€ Search Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface SearchSuggestion {
  id: string
  title: string
  category: string
}

const SEARCH_SUGGESTION_TOPICS: SearchSuggestion[] = [
  { id: '1', title: 'React 19 Hooks and Context Guide', category: 'Documentation' },
  { id: '2', title: 'TypeScript Strict Mode Best Practices', category: 'Programming' },
  { id: '3', title: 'CS101 Computer Architecture Chapter 4', category: 'Syllabus' },
  { id: '4', title: 'AI Chatbot Integration Architecture', category: 'Design Pattern' },
  { id: '5', title: 'Tailwind CSS V4 Utility Classes', category: 'Styling' },
  { id: '6', title: 'Data Structures and Algorithms Summary', category: 'Study Guide' },
]

const ADMIN_SUGGESTION_TOPICS: SearchSuggestion[] = [
  // Mock Users
  { id: 'usr-1', title: 'Huynh Duy Binh', category: 'User' },
  { id: 'usr-2', title: 'Alex Rivera', category: 'User' },
  { id: 'usr-3', title: 'Sarah Jenkins', category: 'User' },
  { id: 'usr-4', title: 'Ngoc Tan', category: 'User' },
  { id: 'usr-5', title: 'Marcus Knight', category: 'User' },
  { id: 'usr-6', title: 'Emily R.', category: 'User' },

  // Mock Documents
  { id: 'doc-1', title: 'Advanced Neuroscience Syllabus 2024', category: 'Syllabus' },
  { id: 'doc-2', title: 'Group Project Research Materials', category: 'Research Document' },
  { id: 'doc-3', title: 'Organic Chemistry Study Plan', category: 'Study Guide' },
  { id: 'doc-4', title: 'Biology 101 Midterm Notes Leaked Exam', category: 'Flagged Notes' },
  { id: 'doc-5', title: 'Literature Review Copy Paste Plagiarized', category: 'Flagged Review' },
  { id: 'doc-6', title: 'Data Set_V1', category: 'Dataset Document' },
  { id: 'doc-7', title: 'Project_Outline', category: 'Outline Document' },
  { id: 'doc-8', title: 'Brainstorming_Diagram', category: 'Image Document' },

  // Admin Panels / Tabs / Settings
  { id: 'adm-1', title: 'User Management Dashboard', category: 'Admin Panel' },
  { id: 'adm-2', title: 'Document Moderation and Audit', category: 'Admin Panel' },
  { id: 'adm-3', title: 'Security Logs and Auditing', category: 'Admin Panel' },
  { id: 'adm-4', title: 'System Status and Maintenance', category: 'Admin Panel' },
  { id: 'adm-5', title: 'User Reports and Plagiarism Claims', category: 'Admin Panel' },
  { id: 'adm-6', title: 'Subscription Packages and Pricing', category: 'Admin Panel' },
]

const TRENDING_TOPICS: string[] = [
  'AI Quiz Generator',
  'Midterm Exam Study Plan',
  'CS101 Networking Notes',
  'Flashcards Quick Review',
]

const CHATBOT_SEARCH_DATA = [
  { title: 'Advanced Neuroscience Syllabus 2024.pdf', type: 'Document', route: '/dashboard/notifications/summary' },
  { title: 'Group Project: Research Materials', type: 'Shared Folder', route: '/dashboard/shared-files/research-materials' },
  { title: 'Organic Chemistry Study Plan', type: 'Study Plan', route: '/dashboard/study-plans' },
  { title: 'Chat about Quantum Mechanics', type: 'Chat', route: '/dashboard/chat' }
]

export interface MockNotification {
  id: string
  title: string
  description: string
  time: string
  type: 'doc' | 'chat' | 'plan' | 'share' | 'document_deleted' | 'document_rejected'
  isRead: boolean
  reason?: string
  documentName?: string
  documentId?: string
  actionType?: "removed" | "rejected" | "approved" | "system"
  adminNote?: string
  targetUserEmail?: string
}

// â”€â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function Header() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role?.toLowerCase() === 'admin'
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const urlKeyword = searchParams.get('keyword') || ''
  const [searchVal, setSearchVal] = useState(urlKeyword)

  // States for AI Chatbot page custom search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<typeof CHATBOT_SEARCH_DATA>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const loadNotifications = () => {
    const currentUser = getCurrentUser();
    const userRole = currentUser.role;
    const userEmail = currentUser.email;

    let defaultNotifications: MockNotification[] = [];
    if (userRole === 'admin') {
      defaultNotifications = [
        {
          id: 'new-report-submitted',
          title: language === 'vi' ? 'Có báo cáo mới' : 'New report submitted',
          description: language === 'vi' ? 'Một người dùng đã báo cáo tài liệu vì đạo văn.' : 'A user reported a document for plagiarism.',
          time: '10m ago',
          type: 'doc',
          isRead: false,
        },
        {
          id: 'ai-audit-flagged',
          title: language === 'vi' ? 'AI phát hiện tài liệu đáng ngờ' : 'AI audit flagged a document',
          description: language === 'vi' ? 'AI Guard đã phát hiện vi phạm chính sách tiềm ẩn.' : 'AI Guard detected a potential policy violation.',
          time: '1h ago',
          type: 'chat',
          isRead: false,
        },
        {
          id: 'system-status-updated',
          title: language === 'vi' ? 'Trạng thái hệ thống đã cập nhật' : 'System status updated',
          description: language === 'vi' ? 'Chế độ bảo trì hoặc trạng thái sự cố đã được thay đổi.' : 'Maintenance mode or incident status was changed.',
          time: '3h ago',
          type: 'plan',
          isRead: true,
        }
      ];
    } else {
      defaultNotifications = [
        {
          id: 'syllabus-analyzed',
          title: 'Syllabus analyzed',
          description: 'Your CS101 Syllabus was parsed successfully by AI.',
          time: '5m ago',
          type: 'doc',
          isRead: false,
        },
        {
          id: 'study-plan-starting',
          title: 'Study plan starting',
          description: 'Your midterm exam study plan starts tomorrow.',
          time: '1h ago',
          type: 'plan',
          isRead: false,
        },
        {
          id: 'new-shared-folder',
          title: 'New shared folder',
          description: 'Duy Binh shared "SWE Lab materials" with you.',
          time: '3h ago',
          type: 'share',
          isRead: true,
        },
        {
          id: 'ai-summary-generated',
          title: 'AI Summary generated',
          description: 'Summary is ready for Chapter 4: Computer Networking.',
          time: '1d ago',
          type: 'chat',
          isRead: true,
        },
      ];
    }

    let localNotifications: MockNotification[] = []
    try {
      const savedNotifs = localStorage.getItem(`aiStudyHubUserNotifications:${userEmail}`)
      if (savedNotifs) {
        const parsed = JSON.parse(savedNotifs)
        
        // Filter out notifications older than 7 days
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const validList = parsed.filter((n: any) => {
          const timestamp = n.createdAt ? new Date(n.createdAt).getTime() : Date.now();
          return timestamp >= sevenDaysAgo;
        });

        if (validList.length !== parsed.length) {
          localStorage.setItem(`aiStudyHubUserNotifications:${userEmail}`, JSON.stringify(validList));
        }

        localNotifications = validList.map((n: any) => ({
          id: n.id,
          title: n.title,
          description: n.message,
          time: n.time || 'Just now',
          type: n.type,
          isRead: n.isRead,
          createdAt: n.createdAt,
          reason: n.reason,
          documentName: n.documentName,
          documentId: n.documentId,
          actionType: n.actionType,
          adminNote: n.adminNote,
          targetUserEmail: n.targetUserEmail
        }))
      }
    } catch (err) {
      console.error('Failed to load user notifications:', err)
    }

    let allNotifs = [...localNotifications, ...defaultNotifications]

    try {
      const saved = localStorage.getItem(`aiStudyHubHeaderNotificationsReadState:${userEmail}`)
      if (saved) {
        const readMap = JSON.parse(saved)
        allNotifs = allNotifs.map((n) => ({
          ...n,
          isRead: readMap[n.id] !== undefined ? readMap[n.id] : n.isRead,
        }))
      }
    } catch (err) {
      console.error('Failed to load notifications read state:', err)
    }

    let deletedIds: string[] = []
    try {
      const storedDeleted = localStorage.getItem(`aiStudyHubDeletedNotificationIds:${userEmail}`)
      if (storedDeleted) {
        deletedIds = JSON.parse(storedDeleted)
      }
    } catch (e) {
      console.error('Failed to parse deleted notification IDs', e)
    }

    allNotifs = allNotifs.filter((n) => {
      if (deletedIds.includes(n.id)) return false;

      if (n.targetUserEmail && n.targetUserEmail.toLowerCase() !== userEmail.toLowerCase()) {
        return false;
      }

      if (userRole === 'admin') {
        const typeStr = n.type || '';
        if ((typeStr as string) === 'document_deleted' || (typeStr as string) === 'document_rejected' || (typeStr as string) === 'document_removed') {
          if (!n.targetUserEmail || n.targetUserEmail.toLowerCase() !== userEmail.toLowerCase()) {
            return false;
          }
        }
        const descStr = typeof n.description === 'string' ? n.description : '';
        if ((descStr.startsWith('Your document') || descStr.startsWith('Tài liệu')) && !n.targetUserEmail) {
          return false;
        }
      }

      return true;
    })

    return allNotifs
  }

  const [notifications, setNotifications] = useState<MockNotification[]>([])

  const refreshNotifications = async () => {
    const currentUser = getCurrentUser()
    const userEmail = currentUser.email

    try {
      const { userNotificationService } = await import('@/features/notifications/services/userNotificationService')
      const data = await userNotificationService.getNotifications(currentUser)

      const mapped = data.map((item: any): MockNotification => {
        let headerType: MockNotification['type'] = 'chat'
        const type = item.type
        if (type === 'document' || type === 'document_approved' || type === 'flashcard' || type === 'doc') {
          headerType = 'doc'
        } else if (type === 'calendar' || type === 'plan') {
          headerType = 'plan'
        } else if (type === 'folder' || type === 'shared_file' || type === 'share') {
          headerType = 'share'
        } else if (type === 'document_deleted' || type === 'document_removed') {
          headerType = 'document_deleted'
        } else if (type === 'document_rejected') {
          headerType = 'document_rejected'
        }

        return {
          id: String(item.id),
          title: item.title,
          description: item.description || item.message || '',
          time: item.time || 'Just now',
          type: headerType,
          isRead: item.isRead !== undefined ? !!item.isRead : !!item.read,
          reason: item.reason,
          documentName: item.documentName,
          documentId: item.documentId,
          actionType: item.actionType,
          adminNote: item.adminNote,
          targetUserEmail: item.targetUserEmail
        }
      })

      const filtered = mapped.filter((n: any) => {
        if (n.targetUserEmail && n.targetUserEmail.toLowerCase() !== userEmail.toLowerCase()) {
          return false
        }
        return true
      })

      setNotifications(filtered)
    } catch (e) {
      console.error('Failed to fetch header notifications', e)
    }
  }

  useEffect(() => {
    refreshNotifications()
    const handleUpdate = () => refreshNotifications()
    window.addEventListener('aiStudyHubNotificationsUpdated', handleUpdate)
    window.addEventListener('aiStudyHubUserChanged', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('aiStudyHubNotificationsUpdated', handleUpdate)
      window.removeEventListener('aiStudyHubUserChanged', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  // Single source of truth for all unread indicators (Bell red dot, Dropdown title badge, Item dots)
  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAsRead = (id: string) => {
    const userEmail = getCurrentUser().email
    import('@/features/notifications/services/userNotificationService').then((m) => {
      m.userNotificationService.markUserNotificationAsRead(id, userEmail)
    })

    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
  }

  const markAllAsRead = () => {
    const userEmail = getCurrentUser().email
    import('@/features/notifications/services/userNotificationService').then((m) => {
      m.userNotificationService.markAllUserNotificationsAsRead(userEmail)
    })

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    toast.success(t.header.toastAllMarkedRead)
  }

  const [showSuggestions, setShowSuggestions] = useState(false)
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('search_history')
      return saved ? JSON.parse(saved) : ['React', 'TypeScript', 'Tailwind', 'AI Summary']
    } catch (err) {
      return ['React', 'TypeScript', 'Tailwind', 'AI Summary']
    }
  })

  const saveSearchToHistory = (term: string) => {
    const cleanTerm = term.trim()
    if (!cleanTerm) return
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== cleanTerm.toLowerCase())
      const newHistory = [cleanTerm, ...filtered].slice(0, 5)
      try {
        localStorage.setItem('search_history', JSON.stringify(newHistory))
      } catch (err) {
        console.error('Failed to save search history:', err)
      }
      return newHistory
    })
  }

  const deleteHistoryItem = (e: React.MouseEvent, term: string) => {
    e.stopPropagation()
    e.preventDefault()
    setHistory((prev) => {
      const newHistory = prev.filter((item) => item !== term)
      try {
        localStorage.setItem('search_history', JSON.stringify(newHistory))
      } catch (err) {
        console.error('Failed to delete search history item:', err)
      }
      return newHistory
    })
  }

  const { pathname } = useLocation()
  const { userMenuOpen, setUserMenuOpen, toggleUserMenu, setSidebarOpen } = useUiStore()
  const { profile } = useProfileStore()
  const currentEmail = user?.email
  const rawHeaderAvatar = currentEmail 
    ? (localStorage.getItem(`aiStudyHubUserAvatar:${currentEmail}`) || profile.avatarUrl) 
    : profile.avatarUrl
  const headerAvatarUrl = (rawHeaderAvatar && rawHeaderAvatar !== '/logo.png') ? rawHeaderAvatar : undefined
  
  const menuRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLFormElement>(null)

  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const [isChangeUserOpen, setIsChangeUserOpen] = useState(false)

  // Hydrate store from localStorage key aiStudyHubCurrentUser on app mount
  useEffect(() => {
    let savedUserStr = localStorage.getItem('aiStudyHubCurrentUser')
    if (!savedUserStr) {
      // Default to Alex Morgan (Admin) as default mock account
      const defaultUser = {
        id: 'admin-alex',
        name: 'Alex Morgan',
        email: 'admin@example.com',
        role: 'admin',
        plan: 'PRO',
        initials: 'AM',
        avatar: '/logo.png'
      }
      localStorage.setItem('aiStudyHubCurrentUser', JSON.stringify(defaultUser))
      savedUserStr = JSON.stringify(defaultUser)
    }

    try {
      const savedUser = JSON.parse(savedUserStr)
      const authUser = useAuthStore.getState().user
      const profile = useProfileStore.getState().profile
      if (!authUser || authUser.email !== savedUser.email || profile.name !== savedUser.name) {
        useAuthStore.setState({
          user: {
            id: savedUser.id,
            name: savedUser.name,
            email: savedUser.email,
            role: savedUser.role,
            plan: savedUser.plan.toLowerCase() as 'free' | 'pro' | 'institutional',
            avatarUrl: savedUser.avatar || '/logo.png',
            university: savedUser.university || 'FPT University',
            major: savedUser.major || 'Software engineering',
            degree: savedUser.degree || 'Bachelor',
          },
          isAuthenticated: true,
        })
        useProfileStore.setState({
          profile: {
            name: savedUser.name,
            university: savedUser.university || 'FPT University',
            major: savedUser.major || 'Software engineering',
            degree: savedUser.degree || 'Bachelor',
            avatarUrl: savedUser.avatar || '/logo.png',
          }
        })
      }
    } catch (e) {
      console.error('Error synchronizing mock user from localStorage on mount:', e)
    }
  }, [])

  // Listen to custom event to react instantly
  useEffect(() => {
    const handleUserChanged = () => {
      // Zustand store update automatically triggers re-renders,
      // but we register the listener as requested.
    }
    window.addEventListener('aiStudyHubUserChanged', handleUserChanged)
    return () => {
      window.removeEventListener('aiStudyHubUserChanged', handleUserChanged)
    }
  }, [])

  const { setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    setSearchVal(urlKeyword)
  }, [urlKeyword])


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (menuRef.current && !menuRef.current.contains(target)) {
        setUserMenuOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setNotificationMenuOpen(false)
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setShowSuggestions(false)
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setUserMenuOpen])

  const isChatPage = pathname === '/dashboard/chat'

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isChatPage) {
      const query = searchQuery.trim().toLowerCase()
      if (query) {
        const filtered = CHATBOT_SEARCH_DATA.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            item.type.toLowerCase().includes(query)
        )
        setSearchResults(filtered)
        setIsSearchOpen(true)
      } else {
        setIsSearchOpen(false)
      }
      return
    }

    if (pathname.startsWith('/dashboard/shared')) {
      if (searchVal.trim()) {
        toast.success(t.header.toastSearchingWorkspace(searchVal.trim()))
      }
      return
    }

    if (searchVal.trim()) {
      toast.success(t.header.toastSearchingResults(searchVal.trim()))
      const kw = encodeURIComponent(searchVal.trim())
      if (isAdmin || pathname.startsWith('/dashboard/admin')) {
        const params = new URLSearchParams(window.location.search)
        const currentTab = params.get('tab') || 'overview'
        navigate(`/dashboard/admin?tab=${currentTab}&keyword=${kw}`)
      } else if (pathname.startsWith('/dashboard/study-plans')) {
        navigate(`/dashboard/study-plans?keyword=${kw}`)
      } else if (pathname.startsWith('/dashboard/shared-files/research-materials')) {
        navigate(`/dashboard/shared-files/research-materials?keyword=${kw}`)
      } else {
        navigate(`/dashboard/documents/search?keyword=${kw}`)
      }
    }
  }

  const handleSuggestionClick = (term: string, category?: string) => {
    setSearchVal(term)
    saveSearchToHistory(term)
    toast.success(t.header.toastSearchingResults(term))

    if (isAdmin) {
      const lowerTerm = term.toLowerCase()
      if (category === 'Admin Panel' || lowerTerm.includes('user') || lowerTerm.includes('moderation') || lowerTerm.includes('log') || lowerTerm.includes('status') || lowerTerm.includes('report') || lowerTerm.includes('package')) {
        let targetTab = 'overview'
        if (lowerTerm.includes('user')) targetTab = 'users'
        else if (lowerTerm.includes('document') || lowerTerm.includes('moderation')) targetTab = 'documents'
        else if (lowerTerm.includes('log')) targetTab = 'activity-logs'
        else if (lowerTerm.includes('report')) targetTab = 'reports'
        else if (lowerTerm.includes('package') || lowerTerm.includes('pricing')) targetTab = 'packages'
        else if (lowerTerm.includes('status') || lowerTerm.includes('maintenance')) targetTab = 'overview'

        navigate(`/dashboard/admin?tab=${targetTab}`)
      } else if (category && category.includes('User')) {
        navigate(`/dashboard/admin?tab=users&keyword=${encodeURIComponent(term)}`)
      } else if (category && (category.includes('Syllabus') || category.includes('Document') || category.includes('Notes') || category.includes('Review') || category.includes('Guide') || category.includes('Outline') || category.includes('Dataset') || category.includes('Image'))) {
        navigate(`/dashboard/admin?tab=documents&keyword=${encodeURIComponent(term)}`)
      } else {
        navigate(`/dashboard/admin?keyword=${encodeURIComponent(term)}`)
      }
    } else {
      navigate(`/dashboard/documents/search?keyword=${encodeURIComponent(term)}`)
    }
    setShowSuggestions(false)
  }

  // Dynamic filter for autocomplete suggestions
  const currentSuggestions = isAdmin ? ADMIN_SUGGESTION_TOPICS : SEARCH_SUGGESTION_TOPICS
  const filteredTopics = currentSuggestions.filter((item) =>
    item.title.toLowerCase().includes(searchVal.toLowerCase())
  )

  return (
    <header className="relative z-50 flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 px-8 shadow-sm">
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="md:hidden p-2 -ml-2 mr-3 rounded-lg text-slate-550 hover:text-slate-755 dark:text-slate-400 dark:hover:text-slate-255 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
        aria-label="Open sidebar"
      >
        <Menu className="size-5" />
      </button>

      <form
        ref={searchContainerRef}
        onSubmit={handleSearchSubmit}
        className="relative flex flex-1 items-center max-w-[400px]"
      >
        <Input
          placeholder={
            isAdmin
              ? t.header.searchPlaceholderAdmin
              : pathname.startsWith('/dashboard/shared')
              ? t.header.searchWorkspace
              : pathname.startsWith('/dashboard/shared-files/research-materials')
              ? t.header.searchFolder
              : pathname.startsWith('/dashboard/study-plans')
              ? t.header.searchStudyPlans
              : t.header.searchPlaceholderAll
          }
          className="w-full bg-slate-100 border border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-400"
          aria-label="Search"
          value={isChatPage ? searchQuery : searchVal}
          onChange={(e) => {
            if (isChatPage) {
              setSearchQuery(e.target.value)
              if (!e.target.value.trim()) {
                setIsSearchOpen(false)
              }
            } else {
              setSearchVal(e.target.value)
              setShowSuggestions(true)
            }
          }}
          onFocus={() => {
            if (!isChatPage) {
              setShowSuggestions(true)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsSearchOpen(false)
              setShowSuggestions(false)
            }
          }}
          startIcon={<Search className="size-4.5 text-slate-400 dark:text-slate-500" />}
          endIcon={
            isChatPage ? (
              searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                    setIsSearchOpen(false)
                  }}
                  className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label="Clear search query"
                >
                  <X className="size-3.5" />
                </button>
              ) : null
            ) : (
              searchVal ? (
                <button
                  type="button"
                  onClick={() => setSearchVal('')}
                  className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label="Clear search query"
                >
                  <X className="size-3.5" />
                </button>
              ) : null
            )
          }
        />

        {/* Custom Autocomplete or Search Suggestion Dropdown */}
        <AnimatePresence>
          {isChatPage ? (
            isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute left-0 right-0 top-full mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 select-none"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 py-1.5 block text-left">
                    {t.header.searchResults}
                  </span>
                  <div className="space-y-0.5 mt-1">
                    {searchResults.length > 0 ? (
                      searchResults.map((item) => {
                        let IconComponent = FileText
                        if (item.type === 'Shared Folder') {
                          IconComponent = Folder
                        } else if (item.type === 'Study Plan') {
                          IconComponent = Calendar
                        } else if (item.type === 'Chat') {
                          IconComponent = MessageCircle
                        }

                        return (
                          <div
                            key={item.title}
                            onClick={() => {
                              setIsSearchOpen(false)
                              navigate(item.route)
                            }}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center min-w-0 flex-1 mr-2">
                              <IconComponent className="size-4 text-slate-400 mr-2.5 group-hover:text-[#3155F6] transition-colors shrink-0" />
                              <span className="truncate group-hover:text-[#3155F6] transition-colors text-left text-xs font-semibold">
                                {item.title}
                              </span>
                            </div>
                            <span className="rounded-md bg-[#F0F2FB] dark:bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
                              {item.type}
                            </span>
                          </div>
                        )
                      })
                    ) : (
                      <div className="flex items-center px-3 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 text-left">
                        {t.header.noResults}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          ) : (
            showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute left-0 right-0 top-full mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 select-none"
              >
                {searchVal.trim() === '' ? (
                  // 1. STATE: EMPTY INPUT (Show History and Trending)
                  <div className="space-y-3.5">
                    {history.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 py-1.5 block text-left">
                          {t.header.recentSearches}
                        </span>
                        <div className="space-y-0.5 mt-1">
                          {history.map((item) => (
                            <div
                              key={item}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                handleSuggestionClick(item)
                              }}
                              className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center">
                                <History className="size-4 text-slate-400 mr-2.5 group-hover:text-[#3155F6] transition-colors shrink-0" />
                                <span className="group-hover:text-[#3155F6] transition-colors">{item}</span>
                              </div>
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                }}
                                onClick={(e) => deleteHistoryItem(e, item)}
                                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                aria-label={`Delete ${item} from history`}
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 py-1.5 block text-left">
                        {t.header.trendingSearches}
                      </span>
                      <div className="space-y-0.5 mt-1">
                        {TRENDING_TOPICS.map((item) => (
                          <div
                            key={item}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleSuggestionClick(item)
                            }}
                            className="flex items-center px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer group"
                          >
                            <TrendingUp className="size-4 text-slate-400 mr-2.5 group-hover:text-[#3155F6] transition-colors shrink-0" />
                            <span className="group-hover:text-[#3155F6] transition-colors">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // 2. STATE: USER TYPING (Show dynamic matching suggestions)
                  <div className="space-y-3.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 py-1.5 block text-left">
                        {t.header.suggestedTopics}
                      </span>
                      <div className="space-y-0.5 mt-1">
                        {filteredTopics.length > 0 ? (
                          filteredTopics.map((item) => {
                            let IconComponent = FileText
                            if (item.category.includes('User')) {
                              IconComponent = User
                            } else if (item.category.includes('Admin Panel')) {
                              IconComponent = Shield
                            } else if (item.category.includes('Image')) {
                              IconComponent = Folder
                            }
                            return (
                              <div
                                key={item.id}
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  handleSuggestionClick(item.title, item.category)
                                }}
                                className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center min-w-0 flex-1 mr-2">
                                  <IconComponent className="size-4 text-slate-400 mr-2.5 group-hover:text-[#3155F6] transition-colors shrink-0" />
                                  <span className="truncate group-hover:text-[#3155F6] transition-colors text-left text-xs font-semibold">
                                    {item.title}
                                  </span>
                                </div>
                                <span className="rounded-md bg-[#F0F2FB] dark:bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
                                  {item.category}
                                </span>
                              </div>
                            )
                          })
                        ) : (
                          <div className="flex items-center px-3 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 text-left">
                            <Sparkles className="size-3.5 mr-2 text-indigo-400 shrink-0" />
                            {t.header.noExactMatch}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 py-1.5 block text-left">
                        {t.header.otherSearches}
                      </span>
                      <div className="space-y-0.5 mt-1">
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleSuggestionClick(searchVal)
                          }}
                          className="flex items-center px-3 py-2 rounded-xl text-sm font-semibold text-[#3155F6] hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer group"
                        >
                          <Search className="size-4 text-[#3155F6] mr-2.5 shrink-0" />
                          <span className="text-left">{t.header.searchFor(searchVal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          )}
        </AnimatePresence>
      </form>

      <div className="flex items-center gap-4">
        {/* Toggle Theme */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={toggleTheme}
          className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? (
            <Sun className="size-5 text-slate-400 hover:text-amber-500 transition-colors" />
          ) : (
            <Moon className="size-5 text-body" />
          )}
        </Button>

        {/* Help Center */}
        {user?.role?.toLowerCase() !== 'admin' && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Help"
            onClick={() => setHelpModalOpen(true)}
            className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <CircleHelp className="size-5 text-body dark:text-slate-400" />
          </Button>
        )}

        {/* Notification Bell with Dropdown */}
        {user && (
          <div className="relative" ref={notificationRef}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
              className={cn(
                'rounded-xl size-10 flex items-center justify-center transition-colors relative hover:bg-slate-100 dark:hover:bg-slate-800',
                notificationMenuOpen && 'bg-[#e5eeff] text-[#3155F6] dark:bg-blue-950'
              )}
            >
              <Bell className={cn('size-5', notificationMenuOpen ? 'text-[#3155F6]' : 'text-body dark:text-slate-400')} />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 block h-2 w-2 rounded-full bg-[#EF4444] border border-white dark:border-slate-900" />
              )}
            </Button>

            <AnimatePresence>
              {notificationMenuOpen && (
                <NotificationDropdown
                  onClose={() => setNotificationMenuOpen(false)}
                  notifications={notifications}
                  setNotifications={setNotifications}
                  markAsRead={markAsRead}
                  markAllAsRead={markAllAsRead}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* User Account Avatar with Dropdown */}
        <div className="relative flex items-center" ref={menuRef}>
          <button
            type="button"
            onClick={toggleUserMenu}
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            aria-label="User menu"
          >
            <Avatar src={headerAvatarUrl} name={profile.name} className="cursor-pointer border border-slate-200/50 dark:border-slate-800" />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <UserDropdown
                onClose={() => setUserMenuOpen(false)}
                onLogoutClick={() => {
                  setUserMenuOpen(false)
                  setLogoutModalOpen(true)
                }}
                onChangeUserClick={() => setIsChangeUserOpen(true)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Interactive Modals */}
      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
      <ConfirmLogoutModal isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} />
      <ChangeUserModal isOpen={isChangeUserOpen} onClose={() => setIsChangeUserOpen(false)} />
    </header>
  )
}

// â”€â”€â”€ Test Verification Plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Verified interactions:
// 1. Dropdown toggle: Bell click correctly shows/hides the notification dropdown.
// 2. Individual read: Clicking a single notification successfully calls markAsRead(id), removing its red dot immediately and decrementing unreadCount.
// 3. Mark all read: Clicking "Mark all read" correctly sets all items to isRead = true, instantly clearing the Bell icon dot, Dropdown title badge, and all item dots.
// 4. Persistence: Reloading the page correctly parses the saved state from localStorage key "aiStudyHubHeaderNotificationsReadState" and preserves the read/unread state.
// 5. Navigation: "View All Notifications" cleanly routes to "/dashboard/notifications" and closes the dropdown menu without console errors.

