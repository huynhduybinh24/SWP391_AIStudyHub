import { motion } from 'framer-motion'
import { Bell, BookOpen, Bot, Calendar, Share2, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui/Toast'
import { MockNotification } from './Header'

interface NotificationDropdownProps {
  onClose: () => void
  notifications: MockNotification[]
  setNotifications: React.Dispatch<React.SetStateAction<MockNotification[]>>
}

export function NotificationDropdown({ onClose, notifications, setNotifications }: NotificationDropdownProps) {
  const navigate = useNavigate()
  const toast = useToast()

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    toast.success('All notifications marked as read')
  }

  const handleNotificationClick = (item: MockNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    )
    toast.success(`Opening: ${item.title}`)
    onClose()
    if (item.type === 'doc') {
      navigate('/dashboard/documents')
    } else if (item.type === 'plan') {
      navigate('/dashboard/study-plans')
    } else if (item.type === 'share') {
      navigate('/dashboard/shared')
    } else {
      navigate('/dashboard/notifications')
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'doc':
        return <BookOpen className="size-4 text-emerald-500" />
      case 'plan':
        return <Calendar className="size-4 text-[#3155F6]" />
      case 'share':
        return <Share2 className="size-4 text-amber-500" />
      case 'chat':
      default:
        return <Bot className="size-4 text-purple-500" />
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="absolute right-0 top-[52px] w-80 rounded-xl border border-border/85 bg-white dark:bg-slate-900 dark:border-slate-800 py-2 shadow-xl z-50 select-none"
      role="menu"
    >
      {/* Header */}
      <div className="border-b border-border/50 dark:border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Bell className="size-4 text-foreground dark:text-white" />
          <span className="text-sm font-bold text-foreground dark:text-slate-200">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={markAllRead}
          className="flex items-center gap-1 text-[11px] font-semibold text-[#3155F6] hover:text-[#2563eb] cursor-pointer"
        >
          <Check className="size-3" />
          Mark all read
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-64 overflow-y-auto divide-y divide-border/40 dark:divide-slate-800/50">
        {notifications.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNotificationClick(item)}
            className={`w-full flex gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer relative items-start ${
              !item.isRead ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
            }`}
          >
            <div className="mt-0.5 size-7 rounded-lg bg-slate-50 dark:bg-slate-800 border border-border/50 dark:border-slate-700/80 flex items-center justify-center shrink-0">
              {getIcon(item.type)}
            </div>
            
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-xs truncate ${!item.isRead ? 'font-bold text-foreground dark:text-white' : 'font-medium text-slate-700 dark:text-slate-350'}`}>
                  {item.title}
                </p>
                <span className="text-[10px] text-muted dark:text-slate-500 shrink-0 font-medium">
                  {item.time}
                </span>
              </div>
              <p className="text-[11px] text-muted dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                {item.description}
              </p>
            </div>

            {!item.isRead && (
              <span className="absolute top-4 right-3 block h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 dark:border-slate-800/80 pt-2 pb-0.5 px-4 text-center">
        <button
          type="button"
          onClick={() => {
            navigate('/dashboard/notifications')
            onClose()
          }}
          className="text-xs font-bold text-slate-550 dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 inline-block py-1 cursor-pointer transition-colors w-full"
        >
          View All Notifications
        </button>
      </div>
    </motion.div>
  )
}
