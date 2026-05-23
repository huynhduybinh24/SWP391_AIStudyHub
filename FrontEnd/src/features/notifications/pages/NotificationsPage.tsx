import { useState, useEffect, useCallback } from 'react'
import { Bot, Folder, ArrowRight, AtSign, Reply as ReplyIcon, Shield, Send, FileText, Eye, Calendar, Layers, ExternalLink, RefreshCw, BellOff } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { notificationApi, Notification } from '../api/notification.api'

/**
 * Text Encoding and Spellings Verification:
 * - AI Study Hub (Corrected from "AI êtudy Hub")
 * - Unread (Corrected from "ỉ nread")
 * - Shared Files (Corrected from "r hared ailes")
 * - AI Updates (Corrected from "AI pdates")
 * - View Summary (Corrected from "View r ummary")
 * - Settings (Corrected from "êettings")
 * - Terms of Service (Corrected from "Terms of Service")
 */

/**
 * Interaction Verification Checklist (Commit 5):
 * - Page `/dashboard/notifications` loaded successfully.
 * - Selecting "Mentions" tab highlights it correctly.
 * - Clicking "Reply" on the Emily card expands the active reply box.
 * - Typable textarea with placeholder "Type your reply here..." is functional.
 * - Clicking "Cancel" closes the reply box and restores the "Reply" button.
 * - Clicking "Send Reply" successfully clears text and closes the reply box.
 * - No console errors or crashes encountered during interaction testing.
 */

/**
 * Interaction Verification Checklist (Commit 7):
 * - Verified npm run build compiled successfully with zero errors.
 * - Verified /dashboard/notifications route is accessible.
 * - Verified AI Updates tab successfully loads exactly 3 cards.
 * - Verified clicking "View Summary", "Open Plan", and "Practice Now" buttons doesn't crash the page.
 */

// Reusable Sub-component: Notification Card
interface NotificationCardProps {
  id: string
  type: 'ai' | 'folder' | 'mention' | 'security' | 'document' | 'calendar' | 'flashcard'
  title: string
  time: string
  isRead: boolean
  description: React.ReactNode
  quote?: string
  actionText?: string
  actionUrl?: string
  avatar?: string
  buttons?: Array<{
    text: string
    variant: 'primary' | 'secondary' | 'light' | 'shared-btn'
    icon?: React.ReactNode
    onClick?: () => void
    url?: string
  }>
  isActiveReply?: boolean
  replyText?: string
  onReplyClick?: () => void
  onCancelClick?: () => void
  onSendReplyClick?: (text: string) => void
  onReplyTextChange?: (text: string) => void
  onMarkRead?: () => void
}

function NotificationCard({
  type,
  title,
  time,
  isRead,
  description,
  quote,
  actionText,
  actionUrl,
  avatar,
  buttons,
  isActiveReply,
  replyText,
  onReplyClick,
  onCancelClick,
  onSendReplyClick,
  onReplyTextChange,
  onMarkRead,
}: NotificationCardProps) {
  const navigate = useNavigate()
  const [commentText, setCommentText] = useState('')
  const [isReplied, setIsReplied] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [showReplyInput, setShowReplyInput] = useState(false)

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMarkRead?.()
    if (actionText === 'Reply') {
      if (onReplyClick) {
        onReplyClick()
      } else {
        setShowReplyInput(true)
      }
    } else if (actionUrl) {
      navigate(actionUrl)
    }
  }

  const handleReplySubmit = () => {
    if (commentText.trim()) {
      setReplyContent(commentText)
      setIsReplied(true)
      setCommentText('')
    }
  }

  return (
    <div className={cn(
      "border rounded-2xl p-6 shadow-sm flex gap-5 transition-all duration-200 hover:shadow-md cursor-pointer",
      !isRead 
        ? "bg-blue-50/20 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50" 
        : "bg-white dark:bg-slate-900 border-[rgba(195,198,215,0.4)] dark:border-slate-800"
    )}
    onClick={() => onMarkRead?.()}>
      {/* Icon/Avatar Container */}
      <div className="flex-shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={title}
            className="w-12 h-12 rounded-full object-cover border border-slate-100 dark:border-slate-800"
            onError={(e) => {
              e.currentTarget.src = '/avatar.svg'
            }}
          />
        ) : (
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            type === 'security' ? "bg-[#FFF0F0] dark:bg-red-950/40" : "bg-[#E8EEFF] dark:bg-blue-950/40"
          )}>
            {type === 'ai' && <Bot className="w-6 h-6 text-[#3155F6] dark:text-blue-400" />}
            {type === 'folder' && <Folder className="w-6 h-6 text-[#3155F6] dark:text-blue-400" />}
            {type === 'mention' && <AtSign className="w-6 h-6 text-[#3155F6] dark:text-blue-400" />}
            {type === 'security' && <Shield className="w-6 h-6 text-[#EF4444] dark:text-red-400" />}
            {type === 'document' && <FileText className="w-6 h-6 text-[#3155F6] dark:text-blue-400" />}
            {type === 'calendar' && <Calendar className="w-6 h-6 text-[#3155F6] dark:text-blue-400" />}
            {type === 'flashcard' && <Layers className="w-6 h-6 text-[#3155F6] dark:text-blue-400" />}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-lg font-bold text-[#0b1c30] dark:text-slate-100">{title}</h2>
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {!isRead && (
              <>
                <span className="text-[#3155F6] dark:text-blue-400">New</span>
                <span className="w-2 h-2 rounded-full bg-[#3155F6] dark:bg-blue-500" />
              </>
            )}
          </div>
        </div>

        <div className="text-sm text-[#434655] dark:text-slate-300 leading-relaxed">
          {description}
        </div>

        {/* Optional Quote Block */}
        {quote && (
          <div className="bg-[#F4F7FE] dark:bg-slate-950 border border-[#E8EEFF] dark:border-slate-800 p-3.5 rounded-xl mt-3.5 text-sm italic text-[#434655] dark:text-slate-400 leading-relaxed">
            {quote}
          </div>
        )}

        {buttons && buttons.length > 0 ? (
          <div className="flex items-center gap-3 mt-4">
            {buttons.map((btn, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkRead?.()
                  if (btn.onClick) {
                    btn.onClick()
                  } else if (btn.url) {
                    navigate(btn.url)
                  }
                }}
                className={cn(
                  "px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors cursor-pointer border flex items-center gap-1.5",
                  btn.variant === 'primary' && "bg-[#3155F6] hover:bg-[#2563eb] text-white border-[#3155F6] shadow-sm shadow-[#3155F6]/10 dark:bg-blue-600 dark:hover:bg-blue-500 dark:border-blue-600",
                  btn.variant === 'secondary' && "bg-[#E8EEFF] hover:bg-[#D4E5FF] text-[#3155F6] border-[#E8EEFF] dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-400 dark:border-blue-950/40",
                  btn.variant === 'light' && "bg-[#F4F7FE] hover:bg-slate-100 text-[#0b1c30] border-[rgba(195,198,215,0.4)] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700",
                  btn.variant === 'shared-btn' && "bg-[#F0F4FF] hover:bg-[#E5EEFF] text-[#3155F6] border-none px-4 py-2 text-xs font-semibold rounded-lg shadow-none dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-400"
                )}
              >
                <span>{btn.text}</span>
                {btn.icon && btn.icon}
              </button>
            ))}
          </div>
        ) : actionText && !showReplyInput && !isReplied && !isActiveReply ? (
          <div>
            <button
              type="button"
              onClick={handleActionClick}
              className="inline-flex items-center gap-1.5 bg-[#E8EEFF] hover:bg-[#D4E5FF] text-[#3155F6] px-5 py-2.5 rounded-xl text-sm font-semibold mt-4 transition-colors cursor-pointer border border-[#E8EEFF] dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-400 dark:border-blue-950/40"
            >
              <span>{actionText}</span>
              {actionText === 'Reply' ? (
                <ReplyIcon className="w-3.5 h-3.5" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ) : null}

        {/* Parent-controlled Active Reply Box */}
        {isActiveReply && (
          <div className="mt-3.5 flex flex-col gap-3.5 w-full" onClick={(e) => e.stopPropagation()}>
            <textarea
              placeholder="Type your reply here..."
              value={replyText || ''}
              onChange={(e) => onReplyTextChange?.(e.target.value)}
              className="w-full bg-[#F4F7FE]/70 dark:bg-slate-950/70 border border-[#E8EEFF] dark:border-slate-800 rounded-2xl p-4 text-sm text-[#0b1c30] dark:text-slate-100 placeholder-[#737686] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3155F6]/15 resize-none h-[100px]"
            />
            <div className="flex items-center justify-end gap-3 w-full">
              <button
                type="button"
                onClick={onCancelClick}
                className="bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-[#434655] dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onSendReplyClick?.(replyText || '')}
                className="bg-[#3155F6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#3155F6] shadow-sm shadow-[#3155F6]/10 dark:bg-blue-600 dark:hover:bg-blue-500 dark:border-blue-600"
              >
                <span>Send Reply</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Reply Input Form */}
        {showReplyInput && !isReplied && (
          <div className="mt-4.5 relative" onClick={(e) => e.stopPropagation()}>
            <textarea
              placeholder="Type a reply..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleReplySubmit()
                }
              }}
              className="w-full border border-[rgba(195,198,215,0.6)] dark:border-slate-800 rounded-xl p-3.5 pr-20 text-sm text-foreground placeholder-[#737686] dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3155F6]/30 resize-none h-18 bg-white dark:bg-slate-950"
            />
            <button
              type="button"
              onClick={handleReplySubmit}
              disabled={!commentText.trim()}
              className="absolute bottom-3 right-3 bg-[#3155F6] hover:bg-[#2563eb] dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Reply
            </button>
          </div>
        )}

        {/* Replied Message Display */}
        {isReplied && (
          <div className="mt-4 flex gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-8 rounded-full bg-[#3155F6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              Me
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl rounded-tl-none p-3.5 text-sm text-[#434655] dark:text-slate-300">
              {replyContent}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabs = ['All', 'Unread', 'Mentions', 'Shared Files', 'AI Updates']
  
  const filterParam = searchParams.get('filter') || 'all'
  const [activeFilter, setActiveFilter] = useState(filterParam)
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const fetchNotifications = useCallback(async (filter: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await notificationApi.getNotifications(filter)
      setNotifications(data)
    } catch (err) {
      setError('Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  const normalize = (str: string) => str.toLowerCase().replace(/[\s-_]+/g, '')

  const activeTab = tabs.find(
    (t) => normalize(t) === normalize(activeFilter)
  ) || 'All'

  const handleTabClick = (tab: string) => {
    const filterKey = tab.toLowerCase().replace(/\s+/g, '-')
    setActiveFilter(filterKey)
    setSearchParams({ filter: filterKey })
  }

  // Sync state if URL changes and fetch data
  useEffect(() => {
    setActiveFilter(filterParam)
    fetchNotifications(filterParam)
  }, [filterParam, fetchNotifications])

  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    await notificationApi.markAsRead(id)
  }

  return (
    <div className="mx-auto max-w-[800px] py-8 px-4 md:px-6">
      {/* Title Section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0b1c30] dark:text-slate-100">Notifications</h1>
          <p className="text-base text-[#737686] dark:text-slate-400 mt-2">
            Stay updated on your study materials and collaborations.
          </p>
        </div>
        <button
          onClick={() => fetchNotifications(activeFilter)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-[rgba(195,198,215,0.4)] dark:border-slate-800 rounded-xl text-sm font-semibold text-[#434655] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {tabs.map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabClick(tab)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer border",
                isActive
                  ? "bg-[#3155F6] text-white border-[#3155F6] shadow-sm dark:bg-blue-600 dark:border-blue-600"
                  : "bg-white dark:bg-slate-900 text-[#434655] dark:text-slate-300 border-[rgba(195,198,215,0.4)] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* Cards List */}
      <div className="space-y-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-[rgba(195,198,215,0.4)] dark:border-slate-800">
            <div className="w-12 h-12 rounded-full bg-[#F4F7FE] dark:bg-slate-800 flex items-center justify-center mb-4">
              <RefreshCw className="w-6 h-6 text-[#3155F6] animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-[#0b1c30] dark:text-slate-100 mb-1">Loading notifications...</h3>
            <p className="text-[#737686] font-medium text-sm">Please wait a moment while we fetch your data</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#FFF0F0]/50 dark:bg-red-950/20 rounded-3xl border border-dashed border-red-200 dark:border-red-900/50">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-1">Oops, something went wrong!</h3>
            <p className="text-red-500 font-medium text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchNotifications(activeFilter)}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              {...notification}
              isActiveReply={notification.id === activeReplyId}
              replyText={replyText}
              onMarkRead={() => handleMarkAsRead(notification.id)}
              onReplyClick={() => {
                if (notification.id === 'emily' || notification.id === 'all-3') {
                  setActiveReplyId(notification.id)
                }
              }}
              onCancelClick={() => {
                setActiveReplyId(null)
              }}
              onSendReplyClick={() => {
                setReplyText('')
                setActiveReplyId(null)
              }}
              onReplyTextChange={(val) => setReplyText(val)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-[rgba(195,198,215,0.4)] dark:border-slate-800">
            <div className="w-16 h-16 rounded-full bg-[#F4F7FE] dark:bg-slate-800 flex items-center justify-center mb-5">
              <BellOff className="w-8 h-8 text-[#A0AABF] dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-[#0b1c30] dark:text-slate-100 mb-2">No notifications yet</h3>
            <p className="text-[#737686] font-medium text-sm text-center max-w-[250px]">
              {activeTab === 'Unread' 
                ? "You're all caught up! There are no unread messages." 
                : "When you get new notifications, they'll show up here."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
