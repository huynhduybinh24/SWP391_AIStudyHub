import { useEffect, useRef, useState } from 'react'
import { Bell, CircleHelp, Sun, Moon, Menu, X } from 'lucide-react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUiStore } from '@/stores/uiStore'
import { useProfileStore } from '@/features/profile/stores/profileStore'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'
import { UserDropdown } from '@/components/layout/UserDropdown'
import { NotificationDropdown } from '@/components/layout/NotificationDropdown'
import { HelpModal } from '@/components/layout/HelpModal'
import { ConfirmLogoutModal } from '@/components/layout/ConfirmLogoutModal'
import { AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'

// ─── Header ───────────────────────────────────────────────────────────────────
export function Header() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const urlKeyword = searchParams.get('keyword') || ''
  const [searchVal, setSearchVal] = useState(urlKeyword)

  const { pathname } = useLocation()
  const { userMenuOpen, setUserMenuOpen, toggleUserMenu, setSidebarOpen } = useUiStore()
  const { profile } = useProfileStore()
  
  const menuRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  const storeTheme = useSettingsStore((s) => s.theme)
  const setThemeStore = useSettingsStore((s) => s.setTheme)

  useEffect(() => {
    setThemeStore(storeTheme)
  }, [storeTheme, setThemeStore])

  const toggleTheme = () => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark')
    setThemeStore(isCurrentlyDark ? 'light' : 'dark')
  }

  const isDark =
    storeTheme === 'dark' ||
    (storeTheme === 'system' &&
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
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setUserMenuOpen])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) {
      toast.success(`Searching results for: "${searchVal.trim()}"`)
      navigate(`/dashboard/documents/search?keyword=${encodeURIComponent(searchVal.trim())}`)
    }
  }

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
      
      <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center">
        <Input
          placeholder={
            pathname.startsWith('/dashboard/shared-files/research-materials')
              ? 'Search in this folder...'
              : pathname.startsWith('/dashboard/study-plans')
              ? 'Search study plans...'
              : 'Search documents, chats, plans...'
          }
          className="max-w-[400px] bg-[#f0f4ff]/70 border border-[#e2e8f0]/40 rounded-xl dark:bg-slate-900 dark:border-slate-800"
          aria-label="Search"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          endIcon={
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
          }
        />
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
            <span className="absolute top-2.5 right-2.5 block h-2 w-2 rounded-full bg-[#EF4444] border border-white dark:border-slate-950" />
          </Button>

          <AnimatePresence>
            {notificationMenuOpen && (
              <NotificationDropdown onClose={() => setNotificationMenuOpen(false)} />
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

