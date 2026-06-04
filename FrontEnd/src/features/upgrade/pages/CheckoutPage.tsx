import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Lock, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { OrderSummary } from '../components/OrderSummary'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/axios'

export function CheckoutPage() {
  const toast = useToast()
  const { t, language } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [isPaying, setIsPaying] = useState(false)

  const handleStripeCheckout = async () => {
    if (!user) {
      toast.error(language === 'vi' ? 'Bạn cần đăng nhập để thực hiện thanh toán.' : 'Please sign in to proceed with checkout.')
      return
    }
    setIsPaying(true)
    try {
      const response = await apiClient.post('/billing/checkout', {
        userId: parseInt(user.id, 10),
        planId: 2, // Seeded Pro Plan
        paymentMethod: 'STRIPE'
      })
      const { paymentUrl } = response.data
      if (paymentUrl) {
        window.location.href = paymentUrl
      } else {
        toast.error(language === 'vi' ? 'Không tìm thấy link thanh toán Stripe' : 'Stripe checkout URL not found')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || (language === 'vi' ? 'Lỗi kết nối tạo link thanh toán Stripe' : 'Failed to connect to Stripe gateway'))
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className="min-h-[80vh] py-6 flex flex-col justify-center items-center bg-[#f8fafc] dark:bg-slate-950 p-2 md:p-8 rounded-2xl transition-colors duration-300">
      <motion.div
        key="checkout-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[1000px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[500px]">
          {/* Left Column: Stripe details */}
          <div className="lg:col-span-7 p-6 md:p-10 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Back to Plans Link */}
              <Link
                to="/dashboard/upgrade"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#2563eb] dark:text-slate-500 dark:hover:text-blue-400 no-underline transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                {t.upgrade.backToPlans}
              </Link>

              {/* Title & Subtitle */}
              <div className="space-y-1.5">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {language === 'vi' ? 'Thanh toán Đơn hàng' : 'Secure Checkout'}
                </h1>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {language === 'vi' ? 'Hoàn tất nâng cấp tài khoản của bạn qua cổng Stripe.' : 'Complete your upgrade using Stripe secure payment gateway.'}
                </p>
              </div>

              {/* Payment Method Details */}
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">
                    {language === 'vi' ? 'Phương thức thanh toán:' : 'Payment Method:'}
                  </span>
                  <span className="text-[#635bff] font-black tracking-wider text-sm">
                    Stripe (Card / Apple Pay)
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">
                    {language === 'vi' ? 'Cổng thanh toán:' : 'Gateway:'}
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">
                    Stripe Sandbox (Test Payment)
                  </span>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
                  {language === 'vi' 
                    ? '* Hệ thống sẽ chuyển hướng bạn tới trang thanh toán bảo mật của Stripe. Bạn có thể sử dụng các thẻ test do Stripe cung cấp.'
                    : '* You will be redirected to Stripe secure checkout. You can use standard Stripe test card numbers.'}
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <div className="space-y-4">
              <button
                type="button"
                disabled={isPaying}
                onClick={handleStripeCheckout}
                className="w-full bg-[#635bff] hover:bg-[#5851db] text-white py-4 px-4 rounded-xl font-extrabold flex items-center justify-center gap-2 select-none active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-[#635bff]/15 hover:shadow-lg disabled:pointer-events-none disabled:opacity-75 focus:outline-none"
              >
                {isPaying ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {language === 'vi' ? 'Đang chuyển hướng tới Stripe...' : 'Redirecting to Stripe...'}
                  </>
                ) : (
                  <>
                    <Lock className="size-4" />
                    <span>
                      {language === 'vi' ? 'Thanh toán bằng Stripe' : 'Pay with Stripe'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Order Summary (5 of 12 columns) */}
          <div className="lg:col-span-5 bg-slate-50/40 dark:bg-slate-950/20 border-t lg:border-t-0 lg:border-l border-slate-200/60 dark:border-slate-800/60 p-6 md:p-10">
            <OrderSummary />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default CheckoutPage
