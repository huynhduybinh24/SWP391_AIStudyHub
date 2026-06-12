import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from '@/context/LanguageContext'
import { useToast } from '@/components/ui/Toast'
import { Send, CheckCircle2, AlertCircle } from 'lucide-react'
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
      className="max-w-md"
    >
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center text-center py-8 px-4 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30 mb-5 shadow-inner">
            <CheckCircle2 className="size-9 animate-bounce" />
          </div>
          <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-2">
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
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold py-2.5 shadow-md shadow-blue-500/10 cursor-pointer"
          >
            {isVi ? 'Đóng cửa sổ' : 'Close Window'}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl p-3">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {isVi ? 'Email của bạn' : 'Your Email'}
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!user?.email}
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 disabled:opacity-60 transition-all font-medium"
                placeholder="example@domain.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {isVi ? 'Tiêu đề thư' : 'Subject'}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
              placeholder={isVi ? 'Góp ý tính năng, báo cáo lỗi...' : 'Feedback, report bug...'}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {isVi ? 'Nội dung phản hồi' : 'Message'}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium resize-none"
              placeholder={isVi ? 'Mô tả chi tiết nội dung bạn muốn gửi tới Admin...' : 'Describe in details the message you want to send to Admin...'}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-1/2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer font-bold"
              disabled={isSending}
            >
              {isVi ? 'Hủy' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-1/2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10"
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
        </form>
      )}
    </Modal>
  )
}
