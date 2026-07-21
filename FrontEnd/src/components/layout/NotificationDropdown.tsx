import { motion } from 'framer-motion'
import { Bell, BookOpen, Bot, Calendar, Share2, Check, AlertTriangle, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui/Toast'
import { MockNotification } from './Header'
import { useTranslation } from '@/context/LanguageContext'

interface NotificationDropdownProps {
  onClose: () => void
  notifications: MockNotification[]
  setNotifications: React.Dispatch<React.SetStateAction<MockNotification[]>>
  markAsRead: (id: string) => void
  markAllAsRead: () => void
}

export function NotificationDropdown({ onClose, notifications, markAsRead, markAllAsRead }: NotificationDropdownProps) {
  const navigate = useNavigate()
  const toast = useToast()
  const { t, language } = useTranslation()

  const getNotificationTitle = (title: string) => {
    if (title === 'Syllabus analyzed') return t.header.notifSyllabusTitle
    if (title === 'Study plan starting') return t.header.notifPlanTitle
    if (title === 'New shared folder') return t.header.notifShareTitle
    if (title === 'AI Summary generated') return t.header.notifSummaryTitle
    if (title === 'Document removed by admin') return language === 'vi' ? 'Tài liệu đã bị quản trị viên xóa' : title
    if (title === 'Document rejected by admin') return language === 'vi' ? 'Tài liệu đã bị quản trị viên từ chối' : title
    return title
  }

  const getNotificationDesc = (item: MockNotification) => {
    const desc = item.description || ''
    if (desc.includes('parsed successfully')) return t.header.notifSyllabusDesc
    if (desc.includes('midterm exam study plan')) return t.header.notifPlanDesc
    if (desc.includes('shared "SWE Lab materials"')) return t.header.notifShareDesc
    if (desc.includes('Summary is ready')) return t.header.notifSummaryDesc
    if (item.type === 'document_deleted' || item.type === 'document_rejected' || desc.includes('was removed by admin') || desc.includes('was rejected by admin')) {
      let docNameMatch = item.documentName || ''
      let reasonMatch = item.reason || ''
      if (!docNameMatch || !reasonMatch) {
        const dMatch = desc.match(/"([^"]+)"/)
        const rMatch = desc.match(/Reason:\s*(.*)$/)
        if (dMatch && !docNameMatch) docNameMatch = dMatch[1]
        if (rMatch && !reasonMatch) reasonMatch = rMatch[1]
      }
      
      const reasonText = reasonMatch.trim() || (language === 'vi' ? 'Chưa có lý do chi tiết.' : 'No reason details were provided.')
      const isRemoved = item.type === 'document_deleted' || desc.includes('was removed by admin')
      if (language === 'vi') {
        return `Tài liệu "${docNameMatch || 'Không rõ'}" của bạn đã bị quản trị viên ${isRemoved ? 'xóa' : 'từ chối'}. Lý do: ${reasonText}`
      } else {
        return `Your document "${docNameMatch || 'Unknown'}" was ${isRemoved ? 'removed' : 'rejected'} by admin. Reason: ${reasonText}`
      }
    }
    return desc
  }

  const handleNotificationClick = (item: MockNotification) => {
    markAsRead(item.id)
    toast.success(`${t.common.loading}`)
    onClose()
    if (item.actionUrl) {
      let targetUrl = item.actionUrl
      if (targetUrl.includes('/dashboard/workspaces')) {
        targetUrl = '/dashboard/shared'
      } else if (targetUrl.includes('/dashboard/admin')) {
        targetUrl = '/dashboard'
      }
      navigate(targetUrl)
    } else if (item.type === 'doc') {
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
      case 'document_deleted':
        return <AlertTriangle className="size-4 text-rose-500" />
      case 'document_rejected':
        return <XCircle className="size-4 text-rose-500" />
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
      className="absolute right-0 top-[52px] w-80 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 py-2 shadow-xl z-50 select-none"
      role="menu"
    >
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Bell className="size-4 text-slate-900 dark:text-white" />
          <span className="text-sm font-bold text-slate-900 dark:text-slate-200">{t.header.notifications}</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={markAllAsRead}
          className="flex items-center gap-1 text-[11px] font-semibold text-[#3155F6] hover:text-[#2563eb] cursor-pointer"
        >
          <Check className="size-3" />
          {t.header.markAllRead}
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
        {notifications.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNotificationClick(item)}
            className={`w-full flex gap-3 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer relative items-start ${
              !item.isRead ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
            }`}
          >
            <div className={`mt-0.5 size-7 rounded-lg border flex items-center justify-center shrink-0 ${
              (item.type === 'document_deleted' || item.type === 'document_rejected')
                ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}>
              {getIcon(item.type)}
            </div>
            
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-xs truncate ${!item.isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                  {getNotificationTitle(item.title)}
                </p>
                <span className="text-[10px] text-slate-550 dark:text-slate-500 shrink-0 font-medium">
                  {item.time}
                </span>
              </div>
              <p className="text-[11px] text-slate-550 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                {getNotificationDesc(item)}
              </p>
            </div>

            {!item.isRead && (
              <span className="absolute top-4 right-3 block h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-2 pb-0.5 px-4 text-center">
        <button
          type="button"
          onClick={() => {
            navigate('/dashboard/notifications')
            onClose()
          }}
          className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 inline-block py-1 cursor-pointer transition-colors w-full"
        >
          {t.header.viewAllNotifications}
        </button>
      </div>
    </motion.div>
  )
}
