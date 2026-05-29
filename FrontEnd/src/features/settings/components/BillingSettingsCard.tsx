import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Calendar, RefreshCw, AlertCircle, ShieldAlert, Sparkles, Ban, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from '@/context/LanguageContext'
import { useToast } from '@/components/ui/Toast'
import { Link } from 'react-router-dom'
import { userNotificationService } from '@/features/notifications/services/userNotificationService'

export function BillingSettingsCard() {
  const { user } = useAuthStore()
  const { language } = useTranslation()
  const toast = useToast()

  const [isAutoRenew, setIsAutoRenew] = useState(true)
  const [expiryDate, setExpiryDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Credit Card (Visa ending in 4242)')
  const [simulating, setSimulating] = useState(false)
  const [isTeacherGranted, setIsTeacherGranted] = useState(false)

  const userEmail = user?.email || 'user@example.com'
  const isTeacher = user?.role?.toLowerCase() === 'teacher' || user?.role?.toLowerCase() === 'instructor'

  // Load persistence details
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isGranted = localStorage.getItem(`aiStudyHubSubIsTeacherGranted:${userEmail}`) === 'true'
      setIsTeacherGranted(isGranted)
    }

    if (user?.plan === 'pro') {
      const storedAutoRenew = localStorage.getItem(`aiStudyHubSubAutoRenew:${userEmail}`)
      const storedExpiry = localStorage.getItem(`aiStudyHubSubExpiry:${userEmail}`)
      const storedPayment = localStorage.getItem(`aiStudyHubSubPayment:${userEmail}`)

      if (storedAutoRenew !== null) {
        setIsAutoRenew(storedAutoRenew === 'true')
      } else {
        const defaultAutoRenew = isTeacher ? 'false' : 'true'
        localStorage.setItem(`aiStudyHubSubAutoRenew:${userEmail}`, defaultAutoRenew)
        setIsAutoRenew(!isTeacher)
      }

      if (storedExpiry) {
        setExpiryDate(storedExpiry)
      } else {
        const days = isTeacher ? 365 : 30
        const defaultExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString(
          language === 'vi' ? 'vi-VN' : 'en-US',
          { year: 'numeric', month: 'long', day: 'numeric' }
        )
        localStorage.setItem(`aiStudyHubSubExpiry:${userEmail}`, defaultExpiry)
        setExpiryDate(defaultExpiry)
      }

      if (storedPayment) {
        setPaymentMethod(storedPayment)
      } else {
        const defaultPayment = isTeacher 
          ? (language === 'vi' ? 'Tài trợ (Chương trình Hợp tác)' : 'Sponsorship (Partnership Program)')
          : 'Credit Card (Visa ending in 4242)'
        localStorage.setItem(`aiStudyHubSubPayment:${userEmail}`, defaultPayment)
        setPaymentMethod(defaultPayment)
      }
    }
  }, [user?.plan, userEmail, language, isTeacher])

  // Cancel or Enable Auto-Renew
  const handleToggleAutoRenew = () => {
    const newVal = !isAutoRenew
    setIsAutoRenew(newVal)
    localStorage.setItem(`aiStudyHubSubAutoRenew:${userEmail}`, newVal ? 'true' : 'false')

    if (newVal) {
      toast.success(
        language === 'vi'
          ? 'Đã bật tính năng tự động gia hạn gói Pro thành công!'
          : 'Successfully enabled automatic renewal for Pro subscription!'
      )
    } else {
      toast.warning(
        language === 'vi'
          ? 'Đã hủy tính năng tự động gia hạn. Gói Pro sẽ hết hạn vào cuối chu kỳ thanh toán.'
          : 'Automatic renewal disabled. Your Pro plan will expire at the end of the billing cycle.'
      )
    }
  }

  // Developer Simulation: 1 Month Expires
  const handleSimulateExpiry = async () => {
    setSimulating(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (isAutoRenew && !isTeacher) {
      // Simulate Auto-Renewal Success
      const nextExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString(
        language === 'vi' ? 'vi-VN' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      )
      localStorage.setItem(`aiStudyHubSubExpiry:${userEmail}`, nextExpiry)
      setExpiryDate(nextExpiry)

      // Send System Notification
      const title = language === 'vi' ? 'Gia hạn gói Pro thành công!' : 'Pro Subscription Renewed!'
      const msg = language === 'vi'
        ? `Gói Pro của bạn đã tự động gia hạn thêm 1 tháng qua ${paymentMethod}. Cảm ơn bạn đã đồng hành cùng LUMIedu!`
        : `Your Pro plan has successfully auto-renewed for 1 month via ${paymentMethod}. Thank you for staying with us!`
      
      userNotificationService.addUserNotification({
        type: 'system',
        title,
        message: msg,
        targetUserEmail: userEmail
      })

      toast.success(
        language === 'vi'
          ? 'Gói Pro của bạn đã được gia hạn tự động thành công thêm 1 tháng!'
          : 'Successfully auto-renewed your Pro subscription for 1 month!'
      )
    } else {
      // Auto-renewal is OFF or is a Teacher -> Downgrade user to free!
      const currentUser = useAuthStore.getState().user
      if (currentUser) {
        useAuthStore.setState({
          user: {
            ...currentUser,
            plan: 'free'
          }
        })

        // Save in localStorage `aiStudyHubCurrentUser`
        const localUserStr = localStorage.getItem('aiStudyHubCurrentUser')
        if (localUserStr) {
          try {
            const localUser = JSON.parse(localUserStr)
            localUser.plan = 'free'
            localStorage.setItem('aiStudyHubCurrentUser', JSON.stringify(localUser))
          } catch (e) {}
        }
      }

      // Also update mock database in aiStudyHubUsers
      const storedUsers = localStorage.getItem('aiStudyHubUsers')
      if (storedUsers) {
        try {
          const parsedUsers = JSON.parse(storedUsers)
          const updatedUsers = parsedUsers.map((u: any) =>
            u.email?.toLowerCase() === userEmail.toLowerCase() ? { ...u, plan: 'free' } : u
          )
          localStorage.setItem('aiStudyHubUsers', JSON.stringify(updatedUsers))
          window.dispatchEvent(new Event('storage'))
          window.dispatchEvent(new Event('aiStudyHubUsersUpdated'))
        } catch (e) {}
      }

      // Send System Notification
      const title = language === 'vi' ? 'Gói Pro đã hết hạn' : 'Pro Subscription Expired'
      const msg = language === 'vi'
        ? (isTeacher
            ? 'Tài khoản Pro của bạn được tài trợ theo chương trình hợp tác giảng viên đã hết hạn. Bạn có thể viết thư cho Admin hoặc gửi lại biểu mẫu hợp tác để được hỗ trợ gia hạn.'
            : 'Gói Pro của bạn đã hết hạn và tính năng tự động gia hạn đã bị tắt. Tài khoản của bạn đã được chuyển về gói Miễn phí (10 GB).')
        : (isTeacher
            ? 'Your Pro account sponsored under the teacher partnership program has expired. You can email the Admin or resubmit the partnership form to request a renewal.'
            : 'Your Pro plan has expired with auto-renewal off. Your account has been reverted to the Free tier (10 GB).')

      userNotificationService.addUserNotification({
        type: 'system',
        title,
        message: msg,
        targetUserEmail: userEmail
      })

      toast.warning(
        language === 'vi'
          ? 'Gói Pro đã hết hạn. Tài khoản của bạn đã được chuyển về gói Miễn phí.'
          : 'Pro subscription expired. Reverted to Free plan.'
      )
    }
    setSimulating(false)
  }

  if (user?.role?.toLowerCase() === 'admin') {
    return null
  }

  return (
    <div className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-6 shadow-sm">
      {/* Title Header */}
      <div className="flex items-center gap-2 border-b border-border/60 dark:border-slate-800/80 pb-4 mb-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-100 dark:border-amber-900/30">
          <CreditCard className="size-5" />
        </div>
        <h2 className="text-lg font-semibold text-foreground dark:text-slate-100">
          {language === 'vi' ? 'Gói dịch vụ & Thanh toán' : 'Billing & Subscription'}
        </h2>
      </div>

      {user?.plan === 'pro' ? (
        <div className="space-y-6">
          {/* Active Pro subscription banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1 z-10">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center size-5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] uppercase select-none">
                  👑
                </span>
                <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {isTeacher ? (language === 'vi' ? 'LUMIedu TEACHER PRO' : 'LUMIedu TEACHER PRO') : 'LUMIedu PRO MEMBER'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-normal">
                {isTeacher ? (
                  language === 'vi'
                    ? 'Gói Pro cao cấp được cấp riêng cho Đối tác Giảng viên của LUMIedu (Miễn phí 1 năm).'
                    : 'Premium Pro plan granted specifically for LUMIedu Teacher Partners (Free for 1 year).'
                ) : (
                  language === 'vi'
                    ? 'Tận hưởng 50 GB dung lượng, không giới hạn các tính năng AI nâng cao.'
                    : 'Enjoy 50 GB premium cloud storage and unrestricted access to advanced AI modules.'
                )}
              </p>
            </div>
            <div className="px-4 py-1.5 rounded-xl bg-amber-500 text-white font-extrabold text-xs shadow-md shadow-amber-500/15 select-none z-10 border border-amber-400">
              {language === 'vi' ? 'Đang hoạt động' : 'Active'}
            </div>
            {/* Ambient Background decoration */}
            <div className="absolute right-0 top-0 size-32 bg-amber-500/5 dark:bg-amber-400/5 blur-3xl pointer-events-none rounded-full" />
          </div>

          {/* Details Table */}
          <div className="bg-slate-50/50 dark:bg-slate-950/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-4 text-xs font-semibold">
            {/* Expiry Date */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <Calendar className="size-4" />
                <span>{language === 'vi' ? 'Thời hạn gói' : 'Subscription Term'}</span>
              </div>
              <div className="text-right">
                <p className="text-slate-800 dark:text-slate-200 font-extrabold">{expiryDate}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                  {isTeacher ? (
                    language === 'vi'
                      ? 'Được tài trợ bởi LUMIedu Partnership'
                      : 'Sponsored by LUMIedu Partnership'
                  ) : isAutoRenew ? (
                    language === 'vi' ? `Tự động gia hạn vào ${expiryDate}` : `Auto-renews on ${expiryDate}`
                  ) : (
                    language === 'vi' ? 'Sẽ hết hạn vào ngày này' : 'Will expire on this date'
                  )}
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* Payment Method */}
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <CreditCard className="size-4" />
                <span>{language === 'vi' ? 'Phương thức thanh toán' : 'Payment Method'}</span>
              </div>
              <span className="text-slate-800 dark:text-slate-200 font-bold">
                {isTeacher ? (language === 'vi' ? 'Tài trợ (Chương trình Hợp tác)' : 'Sponsorship (Partnership Program)') : paymentMethod}
              </span>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* Renewal status */}
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <RefreshCw className="size-4" />
                <span>{language === 'vi' ? 'Trạng thái gia hạn' : 'Renewal Status'}</span>
              </div>
              {isTeacher ? (
                <span className="px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                  {language === 'vi' ? 'Gia hạn qua Email' : 'Renew via Email'}
                </span>
              ) : (
                <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase border ${
                  isAutoRenew
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 bor          {/* Action buttons */}
          {!isTeacher && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleToggleAutoRenew}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  isAutoRenew
                    ? 'bg-rose-55 dark:bg-rose-950/20 hover:bg-rose-100 border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-450'
                    : 'bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 border-blue-200 dark:border-blue-900/30 text-blue-600 dark:text-blue-405'
                }`}
              >
                {isAutoRenew ? (
                  <>
                    <Ban className="size-3.5" />
                    {language === 'vi' ? 'Hủy tự động gia hạn' : 'Cancel Auto-Renewal'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    {language === 'vi' ? 'Kích hoạt lại gia hạn' : 'Enable Auto-Renewal'}
                  </>
                )}
              </button>

              {/* Developer Simulator Button */}
              <button
                onClick={handleSimulateExpiry}
                disabled={simulating}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-black bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-100 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 border border-slate-750"
              >
                <Sparkles className={`size-3.5 text-amber-400 ${simulating && 'animate-spin'}`} />
                {simulating
                  ? (language === 'vi' ? 'Đang mô phỏng...' : 'Simulating...')
                  : (language === 'vi' ? 'Mô phỏng hết hạn (1 tháng)' : 'Simulate 1-Month Expiry')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Free subscription tier banner */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center size-5 rounded-full bg-slate-400 text-white font-extrabold text-[10px] uppercase select-none">
                  ⚡
                </span>
                <span className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isTeacher ? (language === 'vi' ? 'GÓI ĐỐI TÁC HẾT HẠN' : 'PARTNERSHIP EXPIRED') : (language === 'vi' ? 'GÓI MIỄN PHÍ' : 'FREE TIER MEMBER')}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 leading-normal">
                {isTeacher ? (
                  language === 'vi'
                    ? 'Tài khoản Pro của bạn (cấp theo chương trình hợp tác giảng viên) đã hết thời hạn sử dụng.'
                    : 'Your Pro account (granted under the teacher partnership program) has expired.'
                ) : (
                  language === 'vi'
                    ? 'Dung lượng lưu trữ 10 GB và giới hạn lượt sử dụng các tính năng thông minh AI hàng ngày.'
                    : 'Storage limit of 10 GB and standard daily request limits for basic AI summaries.'
                )}
              </p>
            </div>
            <div className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-extrabold text-xs select-none">
              {isTeacher ? (language === 'vi' ? 'Hết hạn' : 'Expired') : (language === 'vi' ? 'Mặc định' : 'Default')}
            </div>
          </div>

          {/* Upgrade prompt or Email Admin renewal link for teachers */}
          {isTeacher ? (
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 p-5 flex flex-col md:flex-row justify-between items-center gap-5 animate-fade-in">
              <div className="space-y-1.5 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-1.5 text-[#2563EB] dark:text-blue-400 font-extrabold text-sm">
                  <Sparkles className="size-4 text-amber-500 animate-pulse" />
                  <span>{language === 'vi' ? 'Gia hạn gói Pro Giảng viên' : 'Renew Teacher Pro Plan'}</span>
                </div>
                <p className="text-xs font-semibold text-slate-505 dark:text-slate-400 leading-relaxed max-w-md">
                  {language === 'vi'
                    ? 'Gói tài trợ Giảng viên của bạn đã hết hạn. Bạn có thể gửi lại biểu mẫu hợp tác để tiếp tục nhận tài trợ gói Pro miễn phí, hoặc nâng cấp thanh toán ngay.'
                    : 'Your Teacher partnership sponsorship has expired. You can resubmit the partnership form to continue your free Pro access, or upgrade instantly via payment.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                <Link
                  to="/partnership"
                  className="px-5 py-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-550/10 hover:shadow-lg transition-all no-underline inline-block active:scale-[0.98] text-center"
                >
                  {language === 'vi' ? 'Gửi biểu mẫu' : 'Send Partnership Form'}
                </Link>
                <Link
                  to="/dashboard/upgrade"
                  className="px-5 py-3.5 rounded-xl text-xs font-black bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm transition-all no-underline inline-block active:scale-[0.98] text-center dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700"
                >
                  {language === 'vi' ? 'Thanh toán' : 'Payment / Upgrade'}
                </Link>
              </div>
            </div>
          ) : (
            /* Upgrade prompt and premium link */
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 p-5 flex flex-col md:flex-row justify-between items-center gap-5">
              <div className="space-y-1.5 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-1.5 text-[#2563EB] dark:text-blue-400 font-extrabold text-sm">
                  <Sparkles className="size-4 text-amber-500 animate-pulse" />
                  <span>{language === 'vi' ? 'Mở khóa toàn năng với PRO' : 'Unlock Everything with PRO'}</span>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                  {language === 'vi'
                    ? 'Nâng cấp ngay hôm nay để nhận thêm 40 GB lưu trữ, tạo flashcard không giới hạn và phân tích tài liệu thông minh.'
                    : 'Upgrade today to instantly get +40 GB storage space, unlimited card creation, and deep document search AI.'}
                </p>
              </div>
              <Link
                to="/dashboard/upgrade"
                className="w-full md:w-auto text-center px-6 py-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/10 hover:shadow-lg transition-all no-underline inline-block active:scale-[0.98]"
              >
                {language === 'vi' ? 'Nâng cấp lên gói PRO' : 'Upgrade to PRO Plan'}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Subtle Tester Only Trigger Button */}
      {isTeacher && user?.plan === 'pro' && (
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleSimulateExpiry}
            disabled={simulating}
            className="text-[10px] text-slate-400 hover:text-red-500 font-bold bg-transparent border-none cursor-pointer transition-colors flex items-center gap-1 active:scale-[0.98] outline-none"
          >
            <Sparkles className="size-3 text-amber-500" />
            {language === 'vi' ? '[Tester Only] Mô phỏng gói Giảng viên hết hạn' : '[Tester Only] Simulate Teacher Expiry'}
          </button>
        </div>
      )}
    </div>
  )
}
