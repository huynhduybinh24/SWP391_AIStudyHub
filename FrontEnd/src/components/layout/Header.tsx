import { useEffect, useRef, useState } from 'react'
import { Bell, CircleHelp, LogOut, Settings, User } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { userMenuOpen, setUserMenuOpen, toggleUserMenu } = useUiStore()
  const menuRef = useRef<HTMLDivElement>(null)

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
          placeholder="Search documents, chats, plans..."
          className="max-w-[400px] bg-surface"
          aria-label="Search"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
        />
      </form>

      <div className="relative flex items-center gap-4" ref={menuRef}>
        <Button variant="ghost" size="icon" aria-label="Help">
          <CircleHelp className="size-5 text-body" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-5 text-body" />
        </Button>

        <button
          type="button"
          onClick={toggleUserMenu}
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-expanded={userMenuOpen}
          aria-haspopup="menu"
        >
          <Avatar name={user?.name ?? 'User'} className="cursor-pointer" />
        </button>

        {userMenuOpen && user ? (
          <div
            className={cn(
              'absolute right-0 top-[52px] w-64 rounded-lg border border-border bg-white py-2 shadow-xl',
            )}
            role="menu"
          >
            <div className="border-b border-border/50 px-4 py-3">
              <p className="text-sm font-bold text-foreground">{user.name}</p>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-body hover:bg-surface"
              onClick={() => navigate('/profile')}
            >
              <User className="size-3" />
              View Profile
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-body hover:bg-surface"
              onClick={() => navigate('/settings')}
            >
              <Settings className="size-3" />
              Account Settings
            </button>
            <div className="mt-1 border-t border-border/50 pt-1">
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-danger/5"
                onClick={handleLogout}
              >
                <LogOut className="size-3.5" />
                Logout
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}
