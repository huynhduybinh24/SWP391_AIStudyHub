import { useEffect, useRef, useState } from 'react'
import { Bell, CircleHelp, LogOut, Settings, User } from 'lucide-react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { authService } from '@/features/auth/services/authService'
import { cn } from '@/lib/utils'

export function Header() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlKeyword = searchParams.get('keyword') || ''
  const [searchVal, setSearchVal] = useState(urlKeyword)
  
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { userMenuOpen, setUserMenuOpen, toggleUserMenu } = useUiStore()
  const menuRef = useRef<HTMLDivElement>(null)

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
    <header className="relative z-10 flex h-[72px] shrink-0 items-center justify-between border-b border-border bg-white px-8 shadow-sm">
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
        <Button variant="ghost" size="icon" aria-label="Help">
          <CircleHelp className="size-5 text-body" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          onClick={() => navigate('/dashboard/notifications')}
          className={cn(
            'rounded-full size-10 flex items-center justify-center transition-colors relative',
            isNotificationsPage ? 'bg-[#e5eeff] text-[#3155F6]' : 'text-body hover:bg-slate-100'
          )}
        >
          <Bell className={cn('size-5', isNotificationsPage ? 'text-[#3155F6]' : 'text-body')} />
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
          <Avatar src="/avatar.svg" name={user?.name ?? 'Alex Rivera'} className="cursor-pointer" />
        </button>

        {userMenuOpen ? (
          <div
            className={cn(
              'absolute right-0 top-[52px] w-64 rounded-xl border border-border/80 bg-white py-2 shadow-xl z-50',
            )}
            role="menu"
          >
            <div className="border-b border-border/50 px-4 py-3 flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#E8EEFF] flex items-center justify-center border border-border/40">
                <img src="/avatar.svg" alt="Avatar" className="w-8 h-8 object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate">{user?.name ?? 'Alex Rivera'}</p>
                <p className="text-xs text-muted truncate">{user?.email ?? 'alex@example.com'}</p>
              </div>
            </div>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-body hover:bg-surface transition-colors text-left cursor-pointer font-medium"
              onClick={() => navigate('/dashboard/profile')}
            >
              <User className="size-4 text-muted" />
              My Profile
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-body hover:bg-surface transition-colors text-left cursor-pointer font-medium"
              onClick={() => navigate('/dashboard/settings')}
            >
              <Settings className="size-4 text-muted" />
              Settings
            </button>
            <div className="mt-1 border-t border-border/50 pt-1">
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
