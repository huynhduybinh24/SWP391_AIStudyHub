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

// ─── Help Modal Data ──────────────────────────────────────────────────────────
const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], label: 'Open global search' },
  { keys: ['Ctrl', 'U'], label: 'Upload new document' },
  { keys: ['Ctrl', '/'], label: 'Open AI chat assistant' },
  { keys: ['Esc'],       label: 'Close any open modal' },
  { keys: ['Ctrl', 'D'], label: 'Go to My Documents' },
  { keys: ['Ctrl', 'H'], label: 'Go to Dashboard home' },
]

const FAQ = [
  {
    q: 'Làm thế nào để upload tài liệu học?',
    a: 'Nhấn nút "Upload New" ở trang Documents, hoặc dùng phím tắt Ctrl + U. Hỗ trợ PDF, DOCX, TXT, PNG, PPTX tối đa 50MB.',
  },
  {
    q: 'AI phân tích tài liệu mất bao lâu?',
    a: 'Thường dưới 30 giây cho tài liệu dưới 10MB. Sau khi xử lý, bạn sẽ thấy badge "ANALYZED" và có thể tạo flashcard, tóm tắt ngay lập tức.',
  },
  {
    q: 'Flashcard và Quiz hoạt động như thế nào?',
    a: 'Mở bất kỳ tài liệu đã phân tích, chọn tab "Flashcards" để ôn bài, hoặc nhấn "Start Quiz" trong trang Subject để làm bài kiểm tra AI tự tạo từ nội dung tài liệu.',
  },
  {
    q: 'Tôi có thể chat với AI về tài liệu không?',
    a: 'Có! Ở mỗi tài liệu, nhấn icon chat (💬) hoặc chọn "Chat with AI" trong menu. AI sẽ trả lời các câu hỏi dựa trên nội dung tài liệu đó.',
  },
  {
    q: 'Giới hạn lưu trữ là bao nhiêu?',
    a: 'Gói Free có 100MB cloud storage. Nâng cấp lên Pro để có 10GB và không giới hạn số tài liệu phân tích AI mỗi tháng.',
  },
]

const QUICK_TIPS = [
  { icon: Upload,        color: 'bg-blue-50 text-blue-600',      title: 'Upload & Analyze',  desc: 'Tải tài liệu lên và AI sẽ tự động tạo tóm tắt, flashcard ngay lập tức.', path: '/dashboard/upload' },
  { icon: MessageSquare, color: 'bg-violet-50 text-violet-600',  title: 'Chat with AI',      desc: 'Hỏi AI về bất kỳ nội dung nào trong tài liệu — như có gia sư riêng 24/7.', path: '/dashboard/chat' },
  { icon: BrainCircuit,  color: 'bg-emerald-50 text-emerald-600',title: 'Practice Quiz',     desc: 'Kiểm tra kiến thức với bộ đề trắc nghiệm AI tạo từ tài liệu của bạn.', path: '/dashboard/quizzes' },
  { icon: BookOpen,      color: 'bg-amber-50 text-amber-600',    title: 'Flashcards',        desc: 'Ôn tập hiệu quả với hệ thống thẻ flashcard tương tác, lật thẻ xem đáp án.', path: '/dashboard/documents' },
]

// ─── Help Modal Component ─────────────────────────────────────────────────────
function HelpModal({ onClose, navigate }: { onClose: () => void, navigate: ReturnType<typeof useNavigate> }) {
  const [tab, setTab] = useState<'tips' | 'shortcuts' | 'faq'>('tips')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
              <CircleHelp className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Help Center</h2>
              <p className="text-xs text-slate-400 font-medium">AI Study Hub — Quick Reference</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          {(['tips', 'shortcuts', 'faq'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex items-center gap-1.5 px-1 py-3 mr-5 text-xs font-bold border-b-2 -mb-px transition-all',
                tab === t
                  ? 'border-[#2563eb] text-[#2563eb]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              )}
            >
              {t === 'tips' && <Zap className="size-3.5" />}
              {t === 'shortcuts' && <Keyboard className="size-3.5" />}
              {t === 'faq' && <FileText className="size-3.5" />}
              {t === 'tips' ? 'Quick Start' : t === 'shortcuts' ? 'Shortcuts' : 'FAQ'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">

          {/* Quick Tips Tab */}
          {tab === 'tips' && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">4 tính năng cốt lõi</p>
              {QUICK_TIPS.map(({ icon: Icon, color, title, desc, path }) => (
                <button
                  key={title}
                  onClick={() => {
                    navigate(path)
                    onClose()
                  }}
                  className="w-full flex items-start text-left gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 hover:border-[#2563eb]/40 hover:bg-blue-50/30 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 group"
                >
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl group-hover:scale-110 transition-transform', color)}>
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#2563eb] transition-colors">{title}</h4>
                    <p className="mt-0.5 text-xs text-slate-500 leading-relaxed group-hover:text-slate-600 transition-colors">{desc}</p>
                  </div>
                </button>
              ))}
              <div className="rounded-xl bg-[#EEF2FF] border border-indigo-100 p-4 flex items-start gap-3 mt-2">
                <BrainCircuit className="size-5 text-[#4F46E5] shrink-0 mt-0.5" />
                <p className="text-xs text-[#4338CA] font-semibold leading-relaxed">
                  💡 <strong>Mẹo:</strong> Upload tài liệu và AI sẽ tự tạo tóm tắt + flashcard trong vài giây. Không cần cài đặt gì thêm!
                </p>
              </div>
            </div>
          )}

          {/* Shortcuts Tab */}
          {tab === 'shortcuts' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Keyboard shortcuts</p>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                {SHORTCUTS.map(({ keys, label }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50/60 transition-colors">
                    <span className="text-sm text-slate-700 font-medium">{label}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((k, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600 shadow-sm font-mono"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Tab */}
          {tab === 'faq' && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Câu hỏi thường gặp</p>
              {FAQ.map(({ q, a }, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-left bg-white hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-semibold text-slate-800 pr-4">{q}</span>
                    <span className={cn('text-slate-400 shrink-0 transition-transform duration-200', openFaq === idx && 'rotate-45')}>
                      <X className="size-4" />
                    </span>
                  </button>
                  {openFaq === idx && (
                    <div className="px-4 pb-4 pt-2 bg-slate-50/80 border-t border-slate-100">
                      <p className="text-sm text-slate-600 leading-relaxed">{a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs text-slate-400">AI Study Hub v1.0 — SWP391 Project</p>
          <Button
            variant="secondary"
            onClick={onClose}
            className="rounded-xl text-xs font-semibold h-8 px-4"
          >
            Got it!
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
export function Header() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const urlKeyword = searchParams.get('keyword') || ''
  const [searchVal, setSearchVal] = useState(urlKeyword)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

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

