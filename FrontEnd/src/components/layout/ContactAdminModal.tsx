import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from '@/context/LanguageContext'
import { useToast } from '@/components/ui/Toast'
import { Send, CheckCircle2, AlertCircle, Mail, FileText, MessageSquare, Lock, ChevronDown, Sparkles } from 'lucide-react'
import { supportService } from '@/services/supportService'

interface ContactAdminModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactAdminModal({ isOpen, onClose }: ContactAdminModalProps) {
  const { language } = useTranslation()
  const toast = useToast()
  const user = useAuthStore((s) => s.user)
  
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email)
    } else {
      setEmail('')
    }
    // Reset state on open
    if (isOpen) {
      setSubject('')
      setMessage('')
      setIsSuccess(false)
      setError('')
    }
  }, [user, isOpen])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !subject.trim() || !message.trim()) {
      setError(language === 'vi' ? 'Vui lòng điền đầy đủ các thông tin.' : 'Please fill in all fields.')
      return
    }

    setIsSending(true)
    setError('')

    try {
      await supportService.createTicket({
        name: user?.name || user?.email?.split('@')[0] || 'Guest',
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim()
      }, user?.id)
      
      setIsSuccess(true)
      toast.success(language === 'vi' ? 'Gửi email thành công!' : 'Email sent successfully!')
    } catch (err) {
      console.error("Failed to create support ticket", err)
      setError(language === 'vi' ? 'Có lỗi xảy ra khi gửi. Vui lòng thử lại.' : 'Failed to send email. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const isVi = language === 'vi'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isVi ? 'Gửi Email cho Admin' : 'Email Administrator'}
      description={isVi ? 'Gửi phản hồi, báo cáo lỗi hoặc đóng góp ý kiến trực tiếp cho quản trị viên.' : 'Send feedback, report bugs, or request assistance from the administrator.'}
      className="max-w-md overflow-hidden relative"
    >
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center text-center py-8 px-4 animate-scale-in relative">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent rounded-2xl pointer-events-none" />
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30 mb-5 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <CheckCircle2 className="size-8 animate-pulse" />
          </div>
          <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">
            {isVi ? 'Đã gửi thư thành công!' : 'Message Sent!'}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mb-6">
            {isVi 
              ? 'Cảm ơn bạn đã gửi đóng góp. Ban quản trị sẽ phản hồi sớm nhất qua email của bạn.' 
              : 'Thank you for your response. The administration team will review it and reply to your email shortly.'}
          </p>
          <Button
            variant="primary"
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold py-2.5 shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            {isVi ? 'Đóng cửa sổ' : 'Close Window'}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-6 pt-2">
          {/* Branded Personalized Greeting Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-500/10 dark:border-blue-500/20 relative overflow-hidden flex gap-4 items-center">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl -mr-6 -mt-6" />
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-center shadow-sm shrink-0 relative">
              <img src="/logo.png" alt="LumiEdu Logo" className="size-8 object-contain" />
              <Sparkles className="size-3 text-indigo-500 dark:text-indigo-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
                {user?.name 
                  ? (isVi ? `Chào ${user.name}! 👋` : `Hi, ${user.name}! 👋`)
                  : (isVi ? 'Chào bạn mới! 👋' : 'Welcome to LumiEdu! 👋')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isVi 
                  ? 'Đội ngũ hỗ trợ LumiEdu luôn sẵn sàng đồng hành cùng bạn.' 
                  : 'LumiEdu Support is here to assist your learning journey.'}
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl p-3 animate-shake">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Mail className="size-3.5" />
                {isVi ? 'Email của bạn' : 'Your Email'}
              </label>
              {user?.email && (
                <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  <Lock className="size-2.5" />
                  {isVi ? 'Đã xác thực' : 'Verified'}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!user?.email}
                className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200/50 dark:border-slate-800/60 bg-[#f5f5f7] dark:bg-[#1d1d1f] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                placeholder="example@domain.com"
                required
              />
            </div>
          </div>

          {/* Subject Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
              <FileText className="size-3.5" />
              {isVi ? 'Tiêu đề thư' : 'Subject'}
            </label>
            <div className="relative group">
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-sm pl-4 pr-10 py-3 rounded-xl border border-slate-200/50 dark:border-slate-800/60 bg-[#f5f5f7] dark:bg-[#1d1d1f] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 appearance-none cursor-pointer transition-all duration-200 font-medium"
                required
              >
                <option value="" disabled hidden>
                  {isVi ? 'Chọn chủ đề cần hỗ trợ...' : 'Select support category...'}
                </option>
                <option value={isVi ? 'Góp ý tính năng mới' : 'Feature Request'} className="dark:bg-[#1d1d1f]">
                  {isVi ? '💡 Góp ý tính năng mới' : '💡 Feature Request'}
                </option>
                <option value={isVi ? 'Báo cáo lỗi kỹ thuật' : 'Bug Report'} className="dark:bg-[#1d1d1f]">
                  {isVi ? '🐞 Báo cáo lỗi kỹ thuật' : '🐞 Bug Report'}
                </option>
                <option value={isVi ? 'Hỗ trợ tài khoản đăng nhập' : 'Account Support'} className="dark:bg-[#1d1d1f]">
                  {isVi ? '🔑 Hỗ trợ tài khoản đăng nhập' : '🔑 Account Support'}
                </option>
                <option value={isVi ? 'Vấn đề thanh toán & Gói cước' : 'Payment & Billing'} className="dark:bg-[#1d1d1f]">
                  {isVi ? '💳 Vấn đề thanh toán & Gói cước' : '💳 Payment & Billing'}
                </option>
                <option value={isVi ? 'Khác / Ý kiến đóng góp' : 'Other Feedback'} className="dark:bg-[#1d1d1f]">
                  {isVi ? '💬 Khác / Ý kiến đóng góp' : '💬 Other Feedback'}
                </option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-4 pointer-events-none text-slate-400 group-hover:text-slate-500 transition-colors" />
            </div>
          </div>

          {/* Message Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
              <MessageSquare className="size-3.5" />
              {isVi ? 'Nội dung phản hồi' : 'Message'}
            </label>
            <div className="relative group">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full text-sm px-4 py-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/60 bg-[#f5f5f7] dark:bg-[#1d1d1f] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200 font-medium resize-none"
                placeholder={isVi ? 'Mô tả chi tiết nội dung bạn muốn gửi tới Admin...' : 'Describe in details the message you want to send to Admin...'}
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-1/2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border-transparent text-slate-700 dark:text-slate-200 cursor-pointer font-bold transition-all py-3 active:scale-[0.98]"
              disabled={isSending}
            >
              {isVi ? 'Hủy' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-1/2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] transition-all py-3"
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>{isVi ? 'Đang gửi...' : 'Sending...'}</span>
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span>{isVi ? 'Gửi Thư' : 'Send Email'}</span>
                </>
              )}
            </Button>
          </div>

          {/* Branded Trust Badge Footer */}
          <div className="pt-4 border-t border-slate-150 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-3 text-indigo-500 dark:text-indigo-400 animate-pulse" />
              LumiEdu Support Hub
            </span>
            <span>{isVi ? 'Phản hồi trong vòng 2 giờ' : 'Replies in ~2 hours'}</span>
          </div>
        </form>
      )}
    </Modal>
  )
}
