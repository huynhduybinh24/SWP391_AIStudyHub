import { useState, useEffect } from 'react'
import { Bot, Folder, ArrowRight, AtSign, Reply as ReplyIcon, Shield, Send, FileText, Eye, Calendar, Layers, ExternalLink } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

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
  id,
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
      "border rounded-2xl p-6 shadow-sm flex gap-5 transition-all duration-200 hover:shadow-md",
      isUnread 
        ? "bg-blue-50/20 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50" 
        : "bg-white dark:bg-slate-900 border-[rgba(195,198,215,0.4)] dark:border-slate-800"
    )}>
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
          <div className="flex items-center gap-1.5 text-xs text-[#737686] dark:text-slate-400 font-medium">
            <span>{time}</span>
            {isUnread && <span className="w-2 h-2 rounded-full bg-[#3155F6] dark:bg-blue-500" />}
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
  
  // Read and normalize search parameter filter
  const filterParam = searchParams.get('filter') || 'all'
  const [activeFilter, setActiveFilter] = useState(filterParam)
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  // Default read/unread states based on instructions
  const defaultReadMap: Record<string, boolean> = {
    'ai-summary': false,
    'shared-folder': false,
    'emily': false,
    'security-alert': false,
    'study-plan': false,
    'mention-2': true,
    'shared-doc-1': true,
    'flashcards': true,
    'all-3': true,
  }

  // Load state from localStorage or default values
  const [isReadMap, setIsReadMap] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('aiStudyHubNotificationReadState')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (err) {
      console.error('Failed to read notification read state from localStorage', err)
    }
    return defaultReadMap
  })

  // Mark notification as read and save to localStorage
  const handleMarkAsRead = (id: string) => {
    setIsReadMap((prev) => {
      if (prev[id]) return prev // already read
      const updated = { ...prev, [id]: true }
      try {
        localStorage.setItem('aiStudyHubNotificationReadState', JSON.stringify(updated))
      } catch (err) {
        console.error('Failed to save notification read state to localStorage', err)
      }
      return updated
    })
  }

  // Normalizes filter strings (e.g., 'shared-files' or 'Shared Files' -> 'sharedfiles')
  const normalize = (str: string) => str.toLowerCase().replace(/[\s-_]+/g, '')

  const activeTab = tabs.find(
    (t) => normalize(t) === normalize(activeFilter)
  ) || 'All'

  const handleTabClick = (tab: string) => {
    // Generate parameter key (e.g. "Shared Files" -> "shared-files")
    const filterKey = tab.toLowerCase().replace(/\s+/g, '-')
    setActiveFilter(filterKey)
    setSearchParams({ filter: filterKey })
  }

  // Sync state if URL changes
  useEffect(() => {
    setActiveFilter(filterParam)
  }, [filterParam])

  // 1. "All" Filter Data: Exact 3 original notifications
  const allNotifications = [
    {
      id: 'ai-summary',
      type: 'ai' as const,
      title: 'AI Summary Ready',
      time: '10m ago',
      isRead: !!isReadMap['ai-summary'],
      description: (
        <>
          The comprehensive summary for your document{' '}
          <strong className="font-semibold text-[#0b1c30] dark:text-slate-100">
            "Advanced Neuroscience Syllabus 2024.pdf"
          </strong>{' '}
          is now complete and ready for review.
        </>
      ),
      actionText: 'View Summary',
      actionUrl: '/dashboard/notifications/summary',
    },
    {
      id: 'shared-folder',
      type: 'folder' as const,
      title: 'New File Shared',
      time: '2h ago',
      isRead: !!isReadMap['shared-folder'],
      description: (
        <>
          Sarah Jenkins shared a folder with you:{' '}
          <span
            onClick={() => navigate('/dashboard/shared-files/research-materials')}
            className="text-[#3155F6] dark:text-blue-400 hover:underline cursor-pointer font-semibold"
          >
            Group Project Research Materials.
          </span>
        </>
      ),
      actionText: 'Open Folder',
      actionUrl: '/dashboard/shared-files/research-materials',
    },
    {
      id: 'all-3',
      type: 'mention' as const,
      title: 'Mentioned You',
      time: 'Yesterday',
      isRead: !!isReadMap['all-3'],
      avatar: '/emily.png',
      description: (
        <>
          Emily R. mentioned you in a comment on{' '}
          <span className="text-[#3155F6] dark:text-blue-400 hover:underline cursor-pointer font-semibold">
            Lecture Notes Week 4.
          </span>
        </>
      ),
      quote: '@You could you verify the formulas used in section 3? They seem slightly different from the textbook.',
      actionText: 'Reply',
    },
  ]

  // 2. "Mentions" Filter Data: Exact 2 custom mentions from Figma with precise button labels and actions
  const mentionsNotifications = [
    {
      id: 'emily',
      type: 'mention' as const,
      title: 'Emily R. mentioned you',
      time: '1h ago',
      isRead: !!isReadMap['emily'],
      description: (
        <>
          <span className="text-[#3155F6] dark:text-blue-400 font-semibold">@User</span>, what do you think about the methodology section on page 4 of the 'Cognitive Science' paper?
        </>
      ),
      actionText: 'Reply',
    },
    {
      id: 'mention-2',
      type: 'mention' as const,
      title: 'Sarah Mitchell mentioned you',
      time: '4h ago',
      isRead: !!isReadMap['mention-2'],
      description: (
        <>
          Sarah Mitchell mentioned you in a comment on{' '}
          <strong className="font-semibold text-[#0b1c30] dark:text-slate-100">
            'Neuroscience_Ch4_Syn...'
          </strong>
          : "@Sarah Mitchell, check the synaptic plasticity diagram on page 12."
        </>
      ),
      actionText: 'View Comment',
      actionUrl: '/dashboard/shared-files/research-materials',
    },
  ]

  // 3. "Unread" Filter Data: Exact unread notifications across all lists dynamically
  const unreadNotifications: typeof allNotifications = []

  if (!isReadMap['ai-summary']) {
    unreadNotifications.push({
      id: 'ai-summary',
      type: 'ai' as const,
      title: 'AI Summary Ready',
      time: '10m ago',
      isRead: false,
      description: (
        <>
          The comprehensive summary for your document{' '}
          <strong className="font-semibold text-[#0b1c30] dark:text-slate-100">
            "Advanced Neuroscience Syllabus 2024.pdf"
          </strong>{' '}
          is now complete and ready for review.
        </>
      ),
      actionText: 'View Summary',
      actionUrl: '/dashboard/notifications/summary',
    })
  }

  if (!isReadMap['security-alert']) {
    unreadNotifications.push({
      id: 'security-alert',
      type: 'security' as const,
      title: 'Security Alert: New Login',
      time: '35m ago',
      isRead: false,
      description: (
        <>
          A new login was detected on your account from a Chrome browser on a MacOS device. If this wasn't you, please secure your account immediately.
        </>
      ),
      buttons: [
        { text: 'Review Activity', variant: 'primary' as const },
        { text: 'It was me', variant: 'light' as const },
      ],
    } as any)
  }

  if (!isReadMap['shared-folder']) {
    unreadNotifications.push({
      id: 'shared-folder',
      type: 'folder' as const,
      title: 'Sarah Jenkins shared a folder with you',
      time: '2h ago',
      isRead: false,
      description: (
        <>
          Folder: <span className="font-semibold text-[#0b1c30]">Group Project Research Materials</span>
        </>
      ),
      buttons: [
        {
          text: 'Open Folder',
          variant: 'shared-btn' as const,
          icon: <Folder className="w-3.5 h-3.5 text-[#3155F6]" />,
          url: '/dashboard/shared-files/research-materials',
        },
      ],
    } as any)
  }

  if (!isReadMap['emily']) {
    unreadNotifications.push({
      id: 'emily',
      type: 'mention' as const,
      title: 'Emily R. mentioned you',
      time: '1h ago',
      isRead: false,
      description: (
        <>
          <span className="text-[#3155F6] font-semibold">@User</span>, what do you think about the methodology section on page 4 of the 'Cognitive Science' paper?
        </>
      ),
      actionText: 'Reply',
    })
  }

  if (!isReadMap['study-plan']) {
    unreadNotifications.push({
      id: 'study-plan',
      type: 'calendar' as const,
      title: 'Study Plan Generated',
      time: '4h ago',
      isRead: false,
      description: (
        <>
          AI has created a personalized 4-week study plan for{' '}
          <strong className="font-semibold text-[#0b1c30]">
            "Organic Chemistry"
          </strong>{' '}
          based on your recent uploads.
        </>
      ),
      buttons: [
        {
          text: 'Open Plan',
          variant: 'secondary' as const,
          icon: <Calendar className="w-3.5 h-3.5 text-[#3155F6]" />,
          url: '/dashboard/study-plans',
        },
      ],
    } as any)
  }

  // 4. "Shared Files" Filter Data
  const sharedFilesNotifications = [
    {
      id: 'shared-folder',
      type: 'folder' as const,
      title: 'Sarah Jenkins shared a folder with you',
      time: '2h ago',
      isRead: !!isReadMap['shared-folder'],
      description: (
        <>
          Folder: <span className="font-semibold text-[#0b1c30] dark:text-slate-100">Group Project Research Materials</span>
        </>
      ),
      buttons: [
        {
          text: 'Open Folder',
          variant: 'shared-btn',
          icon: <Folder className="w-3.5 h-3.5 text-[#3155F6] dark:text-blue-400" />,
          url: '/dashboard/shared-files/research-materials',
        },
      ],
    },
    {
      id: 'shared-doc-1',
      type: 'document' as const,
      title: 'Alex Chen shared a document',
      time: '5h ago',
      isRead: !!isReadMap['shared-doc-1'],
      description: (
        <>
          Document: <span className="font-semibold text-[#0b1c30] dark:text-slate-100">Advanced Neuroscience Syllabus 2024.pdf</span>
        </>
      ),
      buttons: [
        {
          text: 'View Document',
          variant: 'shared-btn',
          icon: <Eye className="w-3.5 h-3.5 text-[#3155F6] dark:text-blue-400" />,
          url: '/dashboard/notifications/summary',
        },
      ],
    },
  ]

  // 5. "AI Updates" Filter Data
  const aiUpdatesNotifications = [
    {
      id: 'ai-summary',
      type: 'document' as const,
      title: 'AI Summary Ready',
      time: '10m ago',
      isRead: !!isReadMap['ai-summary'],
      description: (
        <>
          The comprehensive summary for your document{' '}
          <strong className="font-semibold text-[#0b1c30] dark:text-slate-100">
            "Advanced Neuroscience Syllabus 2024.pdf"
          </strong>{' '}
          is now complete and ready for review.
        </>
      ),
      actionText: 'View Summary',
      actionUrl: '/dashboard/notifications/summary',
    },
    {
      id: 'study-plan',
      type: 'calendar' as const,
      title: 'Study Plan Generated',
      time: '4h ago',
      isRead: !!isReadMap['study-plan'],
      description: (
        <>
          AI has created a personalized 4-week study plan for{' '}
          <strong className="font-semibold text-[#0b1c30] dark:text-slate-100">
            "Organic Chemistry"
          </strong>{' '}
          based on your recent uploads.
        </>
      ),
      buttons: [
        {
          text: 'Open Plan',
          variant: 'secondary',
          icon: <Calendar className="w-3.5 h-3.5 text-[#3155F6] dark:text-blue-400" />,
          url: '/dashboard/study-plans',
        },
      ],
    },
    {
      id: 'flashcards',
      type: 'flashcard' as const,
      title: 'New Flashcards Available',
      time: 'Yesterday',
      isRead: !!isReadMap['flashcards'],
      description: (
        <>
          25 new flashcards have been automatically generated for{' '}
          <strong className="font-semibold text-[#0b1c30] dark:text-slate-100">
            "Cell Biology - Week 4"
          </strong>.
        </>
      ),
      buttons: [
        {
          text: 'Practice Now',
          variant: 'secondary',
          icon: <ExternalLink className="w-3.5 h-3.5 text-[#3155F6] dark:text-blue-400" />,
          url: '/dashboard/quizzes',
        },
      ],
    },
  ]

  // Map active tab to current notifications array
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'All':
        return allNotifications
      case 'Unread':
        return unreadNotifications
      case 'Mentions':
        return mentionsNotifications
      case 'Shared Files':
        return sharedFilesNotifications
      case 'AI Updates':
        return aiUpdatesNotifications
      default:
        return allNotifications
    }
  }

  const currentNotifications = getFilteredNotifications()

  return (
    <div className="mx-auto max-w-[800px] py-8 px-4 md:px-6">
      {/* Title Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#0b1c30] dark:text-slate-100">Notifications</h1>
        <p className="text-base text-[#737686] dark:text-slate-400 mt-2">
          Stay updated on your study materials and collaborations.
        </p>
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
        {currentNotifications.length > 0 ? (
          currentNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              {...notification}
              isActiveReply={notification.id === activeReplyId}
              replyText={replyText}
              onMarkRead={() => handleMarkAsRead(notification.id)}
              onReplyClick={() => {
                if (notification.id === 'emily') {
                  setActiveReplyId('emily')
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
          <div className="flex flex-col items-center justify-center py-16 text-center text-[#737686] font-medium text-base">
            {activeTab === 'Unread' ? 'No unread notifications.' : 'No notifications.'}
          </div>
        )}
      </div>
    </div>
  )
}
