import { useState } from 'react'
import { Bot, Folder, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function NotificationsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('All')
  const [commentText, setCommentText] = useState('')
  const [isReplied, setIsReplied] = useState(false)
  const [replyContent, setReplyContent] = useState('')

  const tabs = ['All', 'Unread', 'Mentions', 'Shared Files', 'AI Updates']

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
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer border ${
                isActive
                  ? 'bg-[#3155F6] text-white border-[#3155F6]'
                  : 'bg-white text-[#434655] border-[rgba(195,198,215,0.4)] hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {/* Card 1: AI Summary Ready */}
        <div className="bg-white border border-[rgba(195,198,215,0.4)] rounded-2xl p-5 shadow-sm flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-[#E8EEFF] flex items-center justify-center">
              <Bot className="w-6 h-6 text-[#3155F6]" />
            </div>
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-[#0b1c30]">AI Summary Ready</h2>
              <div className="flex items-center gap-1.5 text-xs text-[#737686] font-medium">
                <span>10m ago</span>
                <span className="w-2 h-2 rounded-full bg-[#3155F6]" />
              </div>
            </div>
            <p className="text-sm text-[#434655] leading-relaxed">
              The comprehensive summary for your document <strong className="font-semibold text-[#0b1c30]">"Advanced Neuroscience Syllabus 2024.pdf"</strong> is now complete and ready for review.
            </p>
            <div>
              <button
                type="button"
                onClick={() => navigate('/dashboard/notifications/summary')}
                className="inline-flex items-center gap-1 bg-[#E8EEFF] hover:bg-[#D4E5FF] text-[#3155F6] px-4 py-2 rounded-lg text-sm font-semibold mt-3.5 transition-colors cursor-pointer"
              >
                <span>View Summary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: New File Shared */}
        <div className="bg-white border border-[rgba(195,198,215,0.4)] rounded-2xl p-5 shadow-sm flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-[#E8EEFF] flex items-center justify-center">
              <Folder className="w-6 h-6 text-[#3155F6]" />
            </div>
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-[#0b1c30]">New File Shared</h2>
              <span className="text-xs text-[#737686] font-medium">2h ago</span>
            </div>
            <p className="text-sm text-[#434655] leading-relaxed">
              Sarah Jenkins shared a folder with you:{' '}
              <span
                onClick={() => navigate('/dashboard/shared-files/research-materials')}
                className="text-[#3155F6] hover:underline cursor-pointer font-semibold"
              >
                Group Project Research Materials.
              </span>
            </p>
            <div>
              <button
                type="button"
                onClick={() => navigate('/dashboard/shared-files/research-materials')}
                className="inline-flex items-center bg-[#3155F6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-semibold mt-3.5 transition-colors cursor-pointer"
              >
                Open Folder
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Mentioned You */}
        <div className="bg-white border border-[rgba(195,198,215,0.4)] rounded-2xl p-5 shadow-sm flex gap-4">
          <div className="flex-shrink-0">
            <img
              src="/emily.png"
              alt="Emily R."
              className="w-12 h-12 rounded-full object-cover border border-slate-100"
              onError={(e) => {
                e.currentTarget.src = '/avatar.svg'
              }}
            />
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-[#0b1c30]">Mentioned You</h2>
              <span className="text-xs text-[#737686] font-medium">Yesterday</span>
            </div>
            <p className="text-sm text-[#434655] leading-relaxed">
              Emily R. mentioned you in a comment on{' '}
              <span className="text-[#3155F6] hover:underline cursor-pointer font-semibold">
                Lecture Notes Week 4.
              </span>
            </p>
            
            {/* Quote block */}
            <div className="bg-[#F4F7FE] border border-[#E8EEFF] p-3 rounded-lg mt-3 text-sm italic text-[#434655] leading-relaxed">
              "@You could you verify the formulas used in section 3? They seem slightly different from the textbook."
            </div>

            {/* Comment reply input */}
            {!isReplied ? (
              <div className="mt-3 relative">
                <textarea
                  placeholder="Type a reply..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (commentText.trim()) {
                        setReplyContent(commentText)
                        setIsReplied(true)
                        setCommentText('')
                      }
                    }
                  }}
                  className="w-full border border-[rgba(195,198,215,0.6)] rounded-xl p-3 pr-20 text-sm placeholder-[#737686] focus:outline-none focus:ring-2 focus:ring-[#3155F6]/30 resize-none h-16 bg-white"
                />
                <button
                  onClick={() => {
                    if (commentText.trim()) {
                      setReplyContent(commentText)
                      setIsReplied(true)
                      setCommentText('')
                    }
                  }}
                  disabled={!commentText.trim()}
                  className="absolute bottom-3 right-3 bg-[#3155F6] hover:bg-[#2563eb] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Reply
                </button>
              </div>
            ) : (
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
      </div>
    </div>
  )
}
