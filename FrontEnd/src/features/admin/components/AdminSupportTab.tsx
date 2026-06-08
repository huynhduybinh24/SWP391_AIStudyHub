import { useState, useEffect, useRef } from 'react'
import { supportService, SupportTicket, SupportMessage, TicketStatus } from '@/services/supportService'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'
import { 
  MessageSquare, 
  Search, 
  Send, 
  CheckCircle, 
  Clock, 
  Inbox, 
  User, 
  Mail, 
  Loader2,
  Calendar,
  AlertCircle,
  FileText,
  AlertTriangle
} from 'lucide-react'

export function AdminSupportTab() {
  const { language } = useTranslation()
  const toast = useToast()
  const authUser = useAuthStore((state) => state.user)

  // List states
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Detail states
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Templates for faster replies
  const replyTemplates = [
    {
      title: language === 'vi' ? 'Chào hỏi & Tiếp nhận' : 'Greeting & Intake',
      text: language === 'vi' 
        ? 'Chào bạn,\n\nCảm ơn bạn đã gửi yêu cầu hỗ trợ đến LumiEdu. Chúng tôi đã tiếp nhận thông tin và bộ phận kỹ thuật đang tiến hành xử lý sự cố này.\n\nChúng tôi sẽ cập nhật kết quả sớm nhất cho bạn.'
        : 'Hello,\n\nThank you for reaching out to LumiEdu. We have received your inquiry and our technical team is currently investigating the issue.\n\nWe will update you with results as soon as possible.'
    },
    {
      title: language === 'vi' ? 'Yêu cầu thông tin' : 'Request Info',
      text: language === 'vi'
        ? 'Chào bạn,\n\nĐể hỗ trợ bạn tốt nhất, bạn vui lòng cung cấp thêm các thông tin sau:\n1. Ảnh chụp màn hình lỗi (nếu có)\n2. Tên trình duyệt và thiết bị bạn đang sử dụng.\n\nCảm ơn sự hợp tác của bạn!'
        : 'Hello,\n\nTo help you best, could you please provide some additional information:\n1. Screenshots of the error (if any)\n2. The browser name and device type you are using.\n\nThank you for your cooperation!'
    },
    {
      title: language === 'vi' ? 'Giải quyết hoàn tất' : 'Resolved Confirmation',
      text: language === 'vi'
        ? 'Chào bạn,\n\nYêu cầu hỗ trợ của bạn đã được giải quyết thành công. Bạn vui lòng kiểm tra lại dịch vụ nhé.\n\nNếu có bất kỳ vấn đề gì khác, đừng ngần ngại liên hệ lại với chúng tôi. Chúc bạn một ngày tốt lành!'
        : 'Hello,\n\nYour support ticket has been resolved successfully. Please verify your services again.\n\nIf you have any other issues, feel free to contact us back. Have a wonderful day!'
    }
  ]

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Fetch tickets on load
  const loadTickets = async (silent = false) => {
    if (!silent) setLoadingTickets(true)
    try {
      const allTickets = await supportService.getAllTickets()
      setTickets(allTickets)
    } catch (err: any) {
      toast.error(language === 'vi' ? 'Không thể tải danh sách vé hỗ trợ' : 'Failed to load support tickets')
    } finally {
      if (!silent) setLoadingTickets(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Select ticket and load messages
  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setLoadingDetail(true)
    setReplyText('')
    try {
      const detail = await supportService.getTicketDetail(ticket.id)
      setMessages(detail.messages)
    } catch (err: any) {
      toast.error(language === 'vi' ? 'Không thể tải lịch sử tin nhắn' : 'Failed to load conversation history')
    } finally {
      setLoadingDetail(false)
    }
  }

  // Handle send message/reply from admin
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !replyText.trim()) return

    setSendingReply(true)
    try {
      const senderName = authUser?.name || 'LumiEdu Support'
      const senderEmail = authUser?.email || 'lumieduteam@gmail.com'

      const newMsg = await supportService.replyToTicket(
        selectedTicket.id,
        replyText.trim(),
        senderName,
        senderEmail,
        true // isFromAdmin
      )

      // Add new message to list
      setMessages((prev) => [...prev, newMsg])
      
      // Update local ticket status in list to IN_PROGRESS
      setTickets((prev) => 
        prev.map((t) => t.id === selectedTicket.id ? { ...t, status: 'IN_PROGRESS' as TicketStatus } : t)
      )
      
      // Update selected ticket state status
      setSelectedTicket((prev) => prev ? { ...prev, status: 'IN_PROGRESS' as TicketStatus } : null)

      setReplyText('')
      toast.success(language === 'vi' ? 'Gửi phản hồi và Email thành công!' : 'Reply and Email sent successfully!')
    } catch (err: any) {
      toast.error(language === 'vi' ? 'Không thể gửi phản hồi' : 'Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  // Quick template insertion
  const handleInsertTemplate = (text: string) => {
    setReplyText((prev) => prev + (prev ? '\n' : '') + text)
  }

  // Change Ticket Status
  const handleChangeStatus = async (status: TicketStatus) => {
    if (!selectedTicket) return

    setUpdatingStatus(true)
    try {
      const updated = await supportService.updateTicketStatus(selectedTicket.id, status)
      
      // Update local list
      setTickets((prev) => prev.map((t) => t.id === selectedTicket.id ? updated : t))
      // Update selected
      setSelectedTicket(updated)

      toast.success(
        language === 'vi' 
          ? `Đã chuyển trạng thái vé sang: ${status}`
          : `Changed ticket status to: ${status}`
      )
    } catch (err: any) {
      toast.error(language === 'vi' ? 'Không thể cập nhật trạng thái' : 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Filter & Search logic
  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter
    const matchesSearch = 
      ticket.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(ticket.id).includes(searchQuery)
    return matchesStatus && matchesSearch
  })

  // Get status color styling
  const getStatusBadgeClass = (status: TicketStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
      case 'CLOSED':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-750'
      default:
        return 'bg-slate-100 text-slate-800 border'
    }
  }

  const getStatusLabel = (status: TicketStatus) => {
    if (language === 'vi') {
      switch (status) {
        case 'PENDING': return 'Chờ xử lý'
        case 'IN_PROGRESS': return 'Đang xử lý'
        case 'RESOLVED': return 'Đã giải quyết'
        case 'CLOSED': return 'Đã đóng'
      }
    }
    return status
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col md:flex-row h-[780px]">
      
      {/* ── Left Panel: Ticket List ── */}
      <div className="w-full md:w-[380px] border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
        
        {/* Search and Filter Panel */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder={language === 'vi' ? "Tìm theo tên, email, tiêu đề..." : "Search tickets..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
            {['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {st === 'ALL' 
                  ? (language === 'vi' ? 'Tất cả' : 'All') 
                  : getStatusLabel(st as TicketStatus)}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets Scroll Container */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
          {loadingTickets ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-xs font-semibold">{language === 'vi' ? 'Đang tải vé hỗ trợ...' : 'Loading tickets...'}</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 text-center px-6">
              <Inbox className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'vi' ? 'Không có vé yêu cầu nào' : 'No tickets found'}</p>
              <p className="text-xs mt-1">{language === 'vi' ? 'Thử thay đổi bộ lọc hoặc tìm kiếm.' : 'Try changing filters or search query.'}</p>
            </div>
          ) : (
            filteredTickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id
              const createdDate = new Date(t.createdAt).toLocaleDateString(
                language === 'vi' ? 'vi-VN' : 'en-US',
                { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
              )
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTicket(t)}
                  className={`w-full text-left p-4.5 transition-colors flex flex-col gap-2 cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-50/60 dark:bg-blue-955/15 border-l-4 border-blue-600' 
                      : 'hover:bg-slate-100/40 dark:hover:bg-slate-800/20 bg-transparent border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start w-full gap-2">
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                      #{t.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(t.status)}`}>
                      {getStatusLabel(t.status)}
                    </span>
                  </div>

                  <h4 className="text-xs font-extrabold text-slate-850 dark:text-slate-100 line-clamp-1">
                    {t.subject}
                  </h4>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <User className="w-3.5 h-3.5 opacity-60" />
                    <span className="line-clamp-1">{t.name}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span className="line-clamp-1 font-semibold">{t.email}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {createdDate}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Right Panel: Chat Thread & Operations ── */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900">
        {selectedTicket ? (
          <>
            {/* Header Details */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/20 dark:bg-slate-950/10">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-955/40 px-2.5 py-1 rounded-lg">
                    Ticket #{selectedTicket.id}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedTicket.subject}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 opacity-60 text-slate-400" />
                    <strong>{selectedTicket.name}</strong> ({selectedTicket.email})
                  </span>
                  {selectedTicket.userId && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 dark:bg-emerald-500/5 px-2 py-0.5 rounded">
                      User ID: {selectedTicket.userId}
                    </span>
                  )}
                </div>
              </div>

              {/* Action operations */}
              <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                <span className="text-xs font-bold text-slate-400 hidden sm:inline">Trạng thái:</span>
                <select
                  disabled={updatingStatus}
                  value={selectedTicket.status}
                  onChange={(e) => handleChangeStatus(e.target.value as TicketStatus)}
                  className="h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer"
                >
                  <option value="PENDING">{getStatusLabel('PENDING')}</option>
                  <option value="IN_PROGRESS">{getStatusLabel('IN_PROGRESS')}</option>
                  <option value="RESOLVED">{getStatusLabel('RESOLVED')}</option>
                  <option value="CLOSED">{getStatusLabel('CLOSED')}</option>
                </select>
                {updatingStatus && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
              </div>
            </div>

            {/* Chat Conversation Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30 dark:bg-slate-950/5">
              
              {/* Original ticket request card */}
              <div className="flex items-start gap-3.5 max-w-[85%]">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs uppercase shrink-0">
                  {selectedTicket.name.slice(0, 2)}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-800">
                    <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1 border-b border-slate-100 dark:border-slate-900 pb-1 flex justify-between gap-4">
                      <span>{selectedTicket.name} &lt;{selectedTicket.email}&gt;</span>
                      <span className="font-bold text-slate-400">{language === 'vi' ? 'Khởi tạo vé' : 'Initial ticket message'}</span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-355 whitespace-pre-wrap leading-relaxed">
                      {selectedTicket.message}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold pl-2">
                    {new Date(selectedTicket.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                  </span>
                </div>
              </div>

              {/* Message history loading */}
              {loadingDetail ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.isFromAdmin
                  const senderInitials = msg.senderName.slice(0, 2)
                  const msgDate = new Date(msg.createdAt).toLocaleString(
                    language === 'vi' ? 'vi-VN' : 'en-US'
                  )

                  return (
                    <div 
                      key={msg.id}
                      className={`flex gap-3.5 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                        isMe 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {senderInitials}
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className={`rounded-2xl p-4 shadow-sm border ${
                          isMe
                            ? 'bg-blue-50 dark:bg-blue-955/10 border-blue-100/50 dark:border-blue-900/40 text-slate-800 dark:text-slate-200'
                            : 'bg-white dark:bg-slate-950 border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                        }`}>
                          <p className="text-[10px] font-black text-slate-450 dark:text-slate-500 mb-1 flex justify-between gap-6">
                            <span>{msg.senderName}</span>
                            <span className="font-semibold">{isMe ? 'Admin' : 'Customer'}</span>
                          </p>
                          <p className="text-xs whitespace-pre-wrap leading-relaxed">
                            {msg.message}
                          </p>
                        </div>
                        <span className={`text-[10px] text-slate-450 dark:text-slate-500 font-semibold ${isMe ? 'text-right pr-2' : 'pl-2'}`}>
                          {msgDate}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Template select panel */}
            <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-850 flex items-center flex-wrap gap-2">
              <span className="text-[10.5px] font-black text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5 mr-1.5">
                <FileText className="w-3.5 h-3.5" />
                {language === 'vi' ? 'Mẫu phản hồi nhanh:' : 'Quick templates:'}
              </span>
              {replyTemplates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleInsertTemplate(tpl.text)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 hover:text-blue-600 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                >
                  {tpl.title}
                </button>
              ))}
            </div>

            {/* Input Reply Panel */}
            <form onSubmit={handleSendReply} className="p-5 border-t border-slate-200 dark:border-slate-800 flex gap-3 bg-white dark:bg-slate-900">
              <textarea
                rows={2}
                placeholder={language === 'vi' ? "Nhập tin nhắn phản hồi đến khách hàng... (Hệ thống sẽ gửi kèm Email)" : "Type reply to customer... (An email will be sent automatically)"}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={sendingReply}
                className="flex-1 px-4 py-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer self-end shrink-0 disabled:bg-blue-600/50 disabled:cursor-not-allowed"
              >
                {sendingReply ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-450 dark:text-slate-500 text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-955/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-700 dark:text-slate-300">
              {language === 'vi' ? 'Không có Vé hỗ trợ được chọn' : 'No Ticket Selected'}
            </h3>
            <p className="text-xs max-w-sm">
              {language === 'vi' 
                ? 'Hãy chọn một vé hỗ trợ từ danh sách bên trái để xem chi tiết, quản lý trạng thái hoặc gửi email phản hồi.'
                : 'Select a support ticket from the list on the left to view details, update status, or send reply emails.'}
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
