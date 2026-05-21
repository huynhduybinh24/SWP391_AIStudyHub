import { useState } from 'react'
import { Bot, Folder, ArrowRight, AtSign, Reply as ReplyIcon, Shield } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

// Reusable Sub-component: Notification Card
interface NotificationCardProps {
  id: string
  type: 'ai' | 'folder' | 'mention' | 'security'
  title: string
  time: string
  isUnread: boolean
  description: React.ReactNode
  quote?: string
  actionText?: string
  actionUrl?: string
  avatar?: string
  buttons?: Array<{
    text: string
    variant: 'primary' | 'secondary' | 'light'
    onClick?: () => void
    url?: string
  }>
}

function NotificationCard({
  type,
  title,
  time,
  isUnread,
  description,
  quote,
  actionText,
  actionUrl,
  avatar,
  buttons,
}: NotificationCardProps) {
  const navigate = useNavigate()
  const [commentText, setCommentText] = useState('')
  const [isReplied, setIsReplied] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [showReplyInput, setShowReplyInput] = useState(false)

  const handleActionClick = () => {
    if (actionText === 'Reply') {
      setShowReplyInput(true)
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
    <div className="bg-white border border-[rgba(195,198,215,0.4)] rounded-2xl p-5 shadow-sm flex gap-4 transition-all duration-200 hover:shadow-md">
      {/* Icon/Avatar Container */}
      <div className="flex-shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={title}
            className="w-12 h-12 rounded-full object-cover border border-slate-100"
            onError={(e) => {
              e.currentTarget.src = '/avatar.svg'
            }}
          />
        ) : (
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            type === 'security' ? "bg-[#FFF0F0]" : "bg-[#E8EEFF]"
          )}>
            {type === 'ai' && <Bot className="w-6 h-6 text-[#3155F6]" />}
            {type === 'folder' && <Folder className="w-6 h-6 text-[#3155F6]" />}
            {type === 'mention' && <AtSign className="w-6 h-6 text-[#3155F6]" />}
            {type === 'security' && <Shield className="w-6 h-6 text-[#EF4444]" />}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-[#0b1c30]">{title}</h2>
          <div className="flex items-center gap-1.5 text-xs text-[#737686] font-medium">
            <span>{time}</span>
            {isUnread && <span className="w-2 h-2 rounded-full bg-[#3155F6]" />}
          </div>
        </div>

        <div className="text-sm text-[#434655] leading-relaxed">
          {description}
        </div>

        {/* Optional Quote Block */}
        {quote && (
          <div className="bg-[#F4F7FE] border border-[#E8EEFF] p-3 rounded-lg mt-3 text-sm italic text-[#434655] leading-relaxed">
            {quote}
          </div>
        )}

        {/* Action Buttons */}
        {buttons && buttons.length > 0 ? (
          <div className="flex items-center gap-3 mt-3.5">
            {buttons.map((btn, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  if (btn.onClick) {
                    btn.onClick()
                  } else if (btn.url) {
                    navigate(btn.url)
                  }
                }}
                className={cn(
                  "px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer border",
                  btn.variant === 'primary' && "bg-[#3155F6] hover:bg-[#2563eb] text-white border-[#3155F6]",
                  btn.variant === 'secondary' && "bg-[#E8EEFF] hover:bg-[#D4E5FF] text-[#3155F6] border-[#E8EEFF]",
                  btn.variant === 'light' && "bg-[#F4F7FE] hover:bg-slate-100 text-[#0b1c30] border-[rgba(195,198,215,0.4)]"
                )}
              >
                {btn.text}
              </button>
            ))}
          </div>
        ) : actionText && !showReplyInput && !isReplied ? (
          <div>
            <button
              type="button"
              onClick={handleActionClick}
              className="inline-flex items-center gap-1.5 bg-[#E8EEFF] hover:bg-[#D4E5FF] text-[#3155F6] px-4 py-2 rounded-lg text-sm font-semibold mt-3.5 transition-colors cursor-pointer border border-[#E8EEFF]"
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

        {/* Reply Input Form */}
        {showReplyInput && !isReplied && (
          <div className="mt-3 relative">
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
              className="w-full border border-[rgba(195,198,215,0.6)] rounded-xl p-3 pr-20 text-sm placeholder-[#737686] focus:outline-none focus:ring-2 focus:ring-[#3155F6]/30 resize-none h-16 bg-white"
            />
            <button
              type="button"
              onClick={handleReplySubmit}
              disabled={!commentText.trim()}
              className="absolute bottom-3 right-3 bg-[#3155F6] hover:bg-[#2563eb] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Reply
            </button>
          </div>
        )}

        {/* Replied Message Display */}
        {isReplied && (
          <div className="mt-3 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#3155F6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              Me
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl rounded-tl-none p-3 text-sm text-[#434655]">
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
  const activeTab = tabs.find(
    (t) => t.toLowerCase().replace(' ', '') === filterParam.toLowerCase().replace(' ', '')
  ) || 'All'

  const handleTabClick = (tab: string) => {
    setSearchParams({ filter: tab.toLowerCase().replace(' ', '') })
  }

  // 1. "All" Filter Data: Exact 3 original notifications
  const allNotifications: NotificationCardProps[] = [
    {
      id: 'all-1',
      type: 'ai',
      title: 'AI Summary Ready',
      time: '10m ago',
      isUnread: true,
      description: (
        <>
          The comprehensive summary for your document{' '}
          <strong className="font-semibold text-[#0b1c30]">
            "Advanced Neuroscience Syllabus 2024.pdf"
          </strong>{' '}
          is now complete and ready for review.
        </>
      ),
      actionText: 'View Summary',
      actionUrl: '/dashboard/notifications/summary',
    },
    {
      id: 'all-2',
      type: 'folder',
      title: 'New File Shared',
      time: '2h ago',
      isUnread: false,
      description: (
        <>
          Sarah Jenkins shared a folder with you:{' '}
          <span
            onClick={() => navigate('/dashboard/shared-files/research-materials')}
            className="text-[#3155F6] hover:underline cursor-pointer font-semibold"
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
      type: 'mention',
      title: 'Mentioned You',
      time: 'Yesterday',
      isUnread: false,
      avatar: '/emily.png',
      description: (
        <>
          Emily R. mentioned you in a comment on{' '}
          <span className="text-[#3155F6] hover:underline cursor-pointer font-semibold">
            Lecture Notes Week 4.
          </span>
        </>
      ),
      quote: '@You could you verify the formulas used in section 3? They seem slightly different from the textbook.',
      actionText: 'Reply',
    },
  ]

  // 2. "Mentions" Filter Data: Exact 2 custom mentions from Figma
  const mentionsNotifications: NotificationCardProps[] = [
    {
      id: 'mention-1',
      type: 'mention',
      title: 'Emily R. mentioned you',
      time: '1h ago',
      isUnread: true,
      description: (
        <>
          <span className="text-[#3155F6] font-semibold">@User</span>, what do you think about the methodology section on page 4 of the 'Cognitive Science' paper?
        </>
      ),
      actionText: 'Reply',
    },
    {
      id: 'mention-2',
      type: 'mention',
      title: 'Sarah Mitchell mentioned you',
      time: '4h ago',
      isUnread: false,
      description: (
        <>
          Sarah Mitchell mentioned you in a comment on{' '}
          <strong className="font-semibold text-[#0b1c30]">
            'Neuroscience_Ch4_Syn...'
          </strong>
          : "@Sarah Mitchell, check the synaptic plasticity diagram on page 12."
        </>
      ),
      actionText: 'View Comment',
      actionUrl: '/dashboard/shared-files/research-materials',
    },
  ]

  // 3. "Unread" Filter Data: Exact 2 unread notifications from Figma
  const unreadNotifications: NotificationCardProps[] = [
    {
      id: 'unread-1',
      type: 'ai',
      title: 'AI Summary Ready',
      time: '10m ago',
      isUnread: true,
      description: (
        <>
          The comprehensive summary for your document{' '}
          <strong className="font-semibold text-[#0b1c30]">
            "Advanced Neuroscience Syllabus 2024.pdf"
          </strong>{' '}
          is now complete and ready for review.
        </>
      ),
      actionText: 'View Summary',
      actionUrl: '/dashboard/notifications/summary',
    },
    {
      id: 'unread-2',
      type: 'security',
      title: 'Security Alert: New Login',
      time: '35m ago',
      isUnread: true,
      description: (
        <>
          A new login was detected on your account from a Chrome browser on a MacOS device. If this wasn't you, please secure your account immediately.
        </>
      ),
      buttons: [
        { text: 'Review Activity', variant: 'primary' },
        { text: 'It was me', variant: 'light' },
      ],
    },
  ]

  // 4. "Shared Files" Filter Data
  const sharedFilesNotifications: NotificationCardProps[] = [
    allNotifications[1], // New File Shared
  ]

  // 5. "AI Updates" Filter Data
  const aiUpdatesNotifications: NotificationCardProps[] = [
    allNotifications[0], // AI Summary Ready
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
    <div className="mx-auto max-w-[800px] py-6 px-1">
      {/* Title Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#0b1c30]">Notifications</h1>
        <p className="text-base text-[#737686] mt-1.5">
          Stay updated on your study materials and collaborations.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2.5 mb-6 flex-wrap">
        {tabs.map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabClick(tab)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer border",
                isActive
                  ? "bg-[#3155F6] text-white border-[#3155F6] shadow-sm"
                  : "bg-white text-[#434655] border-[rgba(195,198,215,0.4)] hover:bg-slate-50"
              )}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {currentNotifications.map((notification) => (
          <NotificationCard key={notification.id} {...notification} />
        ))}
      </div>
    </div>
  )
}
