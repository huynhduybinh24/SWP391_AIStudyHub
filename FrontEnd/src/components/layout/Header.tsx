import { useEffect, useRef, useState } from 'react'
import { Bell, CircleHelp, LogOut, Settings, User } from 'lucide-react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { useProfileStore } from '@/features/profile/stores/profileStore'
import { authService } from '@/features/auth/services/authService'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'

export function Header() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlKeyword = searchParams.get('keyword') || ''
  const [searchVal, setSearchVal] = useState(urlKeyword)
  
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { userMenuOpen, setUserMenuOpen, toggleUserMenu } = useUiStore()
  const { profile } = useProfileStore()
  const menuRef = useRef<HTMLDivElement>(null)

  const storeTheme = useSettingsStore((s) => s.theme)
  const setThemeStore = useSettingsStore((s) => s.setTheme)

  useEffect(() => {
    setThemeStore(storeTheme)
  }, [storeTheme, setThemeStore])

  const toggleTheme = () => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark')
    setThemeStore(isCurrentlyDark ? 'light' : 'dark')
  }

  const isDark = storeTheme === 'dark' || (storeTheme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const isNotificationsPage = pathname === '/dashboard/notifications' || pathname === '/dashboard/notifications/'

  useEffect(() => {
    setSearchVal(urlKeyword)
  }, [urlKeyword])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setUserMenuOpen])

  async function handleLogout() {
    await authService.logout()
    logout()
    navigate('/')
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/dashboard/documents/search?keyword=${encodeURIComponent(searchVal.trim())}`)
    }
  }

  return (
    <header className="relative z-10 flex h-[72px] shrink-0 items-center justify-between border-b border-border bg-white dark:bg-slate-950 dark:border-slate-850 px-8 shadow-sm">
      <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center">
        <Input
          placeholder={
            pathname === '/dashboard/shared-files/research-materials' ||
            pathname === '/dashboard/shared-files/research-materials/'
              ? 'Search in this folder...'
              : 'Search documents, chats, plans...'
          }
          className="max-w-[400px] bg-[#f0f4ff]/70 border border-[#e2e8f0]/40 rounded-xl"
          aria-label="Search"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
        />
      </form>

      <div className="relative flex items-center gap-4" ref={menuRef}>
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

        <Button variant="ghost" size="icon" aria-label="Help">
          <CircleHelp className="size-5 text-body dark:text-slate-400" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          onClick={() => navigate('/dashboard/notifications')}
          className={cn(
            'rounded-full size-10 flex items-center justify-center transition-colors relative',
            isNotificationsPage ? 'bg-[#e5eeff] text-[#3155F6]' : 'text-body dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Bell className={cn('size-5', isNotificationsPage ? 'text-[#3155F6]' : 'text-body dark:text-slate-400')} />
          {isNotificationsPage && (
            <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-[#EF4444] border border-white" />
          )}
        </Button>

        <button
          type="button"
          onClick={toggleUserMenu}
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-expanded={userMenuOpen}
          aria-haspopup="menu"
        >
          <Avatar src={profile.avatarUrl} name={profile.name} className="cursor-pointer border border-slate-200/50 dark:border-slate-800" />
        </button>

        {userMenuOpen ? (
          <div
            className={cn(
              'absolute right-0 top-[52px] w-64 rounded-xl border border-border/80 bg-white dark:bg-slate-900 dark:border-slate-800 py-2 shadow-xl z-50',
            )}
            role="menu"
          >
            <div className="border-b border-border/50 dark:border-slate-800/80 px-4 py-3 flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#E8EEFF] dark:bg-slate-800 flex items-center justify-center border border-border/40 dark:border-slate-700/40 overflow-hidden">
                <img src={profile.avatarUrl} alt="Avatar" className="w-8 h-8 object-cover rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground dark:text-slate-200 truncate">{profile.name}</p>
                <p className="text-xs text-muted dark:text-slate-500 truncate">{user?.email ?? 'alex@example.com'}</p>
              </div>
            </div>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-body dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer font-medium"
              onClick={() => navigate('/dashboard/profile')}
            >
              <User className="size-4 text-muted dark:text-slate-500" />
              Profile
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-body dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer font-medium"
              onClick={() => navigate('/dashboard/settings')}
            >
              <Settings className="size-4 text-muted dark:text-slate-500" />
              Settings
            </button>
            <div className="mt-1 border-t border-border/50 dark:border-slate-800/80 pt-1">
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors text-left font-medium cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="size-4 text-danger" />
                Log Out
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}
