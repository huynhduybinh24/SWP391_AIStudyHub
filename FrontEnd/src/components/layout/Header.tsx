import { useEffect, useRef, useState } from 'react'
import { Bell, CircleHelp, Sun, Moon, Menu, X, Search, History, TrendingUp, FileText, Sparkles, Folder, Calendar, MessageCircle } from 'lucide-react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUiStore } from '@/stores/uiStore'
import { useProfileStore } from '@/features/profile/stores/profileStore'
import { cn } from '@/lib/utils'
import { useTheme } from '@/features/settings/components/ThemeProvider'
import { UserDropdown } from '@/components/layout/UserDropdown'
import { NotificationDropdown } from '@/components/layout/NotificationDropdown'
import { HelpModal } from '@/components/layout/HelpModal'
import { ConfirmLogoutModal } from '@/components/layout/ConfirmLogoutModal'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'

// ─── Search Constants ────────────────────────────────────────────────────────
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
  type: 'doc' | 'chat' | 'plan' | 'share'
  isRead: boolean
}

// ─── Header ───────────────────────────────────────────────────────────────────
export function Header() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const urlKeyword = searchParams.get('keyword') || ''
  const [searchVal, setSearchVal] = useState(urlKeyword)

  // States for AI Chatbot page custom search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<typeof CHATBOT_SEARCH_DATA>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const [notifications, setNotifications] = useState<MockNotification[]>([
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
  ])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    toast.success('All notifications marked as read')
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
  
  const menuRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLFormElement>(null)

  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark')
    setTheme(isCurrentlyDark ? 'light' : 'dark')
  }

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

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

    if (searchVal.trim()) {
      toast.success(`Searching for: ${searchVal.trim()}`)
      navigate(`/dashboard/documents/search?keyword=${encodeURIComponent(searchVal.trim())}`)
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (term: string) => {
    setSearchVal(term)
    saveSearchToHistory(term)
    toast.success(`Searching results for: "${term}"`)
    navigate(`/dashboard/documents/search?keyword=${encodeURIComponent(term)}`)
    setShowSuggestions(false)
  }

  // Dynamic filter for autocomplete recommendations
  const filteredTopics = SEARCH_SUGGESTION_TOPICS.filter(
    (item) =>
      item.title.toLowerCase().includes(searchVal.toLowerCase()) ||
      item.category.toLowerCase().includes(searchVal.toLowerCase())
  ).slice(0, 5)

  return (
    <header className="relative z-20 flex h-[72px] shrink-0 items-center justify-between border-b border-border bg-white dark:bg-slate-950 dark:border-slate-850 px-8 shadow-sm">
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="md:hidden p-2 -ml-2 mr-3 rounded-lg text-slate-550 hover:text-slate-755 dark:text-slate-400 dark:hover:text-slate-255 hover:bg-slate-50 dark:hover:bg-slate-850 shrink-0 cursor-pointer"
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
            pathname.startsWith('/dashboard/shared-files/research-materials')
              ? 'Search in this folder...'
              : pathname.startsWith('/dashboard/study-plans')
              ? 'Search study plans...'
              : 'Search documents, chats, plans...'
          }
          className="w-full bg-[#f0f4ff]/70 border border-[#e2e8f0]/40 rounded-xl dark:bg-slate-900 dark:border-slate-800"
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
          startIcon={
            <button
              type="submit"
              className="flex items-center justify-center p-0 border-none bg-transparent cursor-pointer shrink-0"
              title="Search"
            >
              <Search className="size-4.5 text-slate-400 dark:text-slate-550 hover:text-[#3155F6] transition-colors" />
            </button>
          }
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
            isSearchOpen && searchQuery.trim() !== '' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute left-0 right-0 top-full mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-955 z-50 select-none"
              >
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 py-1.5 block text-left">
                      Search Results
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
                          No results found.
                        </div>
                      )}
                    </div>
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
                className="absolute left-0 right-0 top-full mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-955 z-50 select-none"
              >
                {searchVal.trim() === '' ? (
                  // 1. STATE: EMPTY INPUT (Show History and Trending)
                  <div className="space-y-3.5">
                    {history.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 py-1.5 block text-left">
                          Recent Searches
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
                        Trending Searches
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
                        Suggested Topics & Docs
                      </span>
                      <div className="space-y-0.5 mt-1">
                        {filteredTopics.length > 0 ? (
                          filteredTopics.map((item) => (
                            <div
                              key={item.id}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                handleSuggestionClick(item.title)
                              }}
                              className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center min-w-0 flex-1 mr-2">
                                <FileText className="size-4 text-slate-400 mr-2.5 group-hover:text-[#3155F6] transition-colors shrink-0" />
                                <span className="truncate group-hover:text-[#3155F6] transition-colors text-left text-xs font-semibold">
                                  {item.title}
                                </span>
                              </div>
                              <span className="rounded-md bg-[#F0F2FB] dark:bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
                                {item.category}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center px-3 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 text-left">
                            <Sparkles className="size-3.5 mr-2 text-indigo-400 shrink-0" />
                            No exact matching documents found. Press Enter to search.
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 py-1.5 block text-left">
                        Other Searches
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
                          <span className="text-left">Search for "{searchVal}"</span>
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
        <Button
          variant="ghost"
          size="icon"
          aria-label="Help"
          onClick={() => setHelpModalOpen(true)}
          className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <CircleHelp className="size-5 text-body dark:text-slate-400" />
        </Button>
        
        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
            className={cn(
              'rounded-xl size-10 flex items-center justify-center transition-colors relative hover:bg-slate-100 dark:hover:bg-slate-800',
              notificationMenuOpen && 'bg-[#e5eeff] text-[#3155F6] dark:bg-blue-955'
            )}
          >
            <Bell className={cn('size-5', notificationMenuOpen ? 'text-[#3155F6]' : 'text-body dark:text-slate-400')} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 block h-2 w-2 rounded-full bg-[#EF4444] border border-white dark:border-slate-950" />
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
            <Avatar src={profile.avatarUrl} name={profile.name} className="cursor-pointer border border-slate-200/50 dark:border-slate-800" />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <UserDropdown
                onClose={() => setUserMenuOpen(false)}
                onLogoutClick={() => {
                  setUserMenuOpen(false)
                  setLogoutModalOpen(true)
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Interactive Modals */}
      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
      <ConfirmLogoutModal isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} />
    </header>
  )
}

