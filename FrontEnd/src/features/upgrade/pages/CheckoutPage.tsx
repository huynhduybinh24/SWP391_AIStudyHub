import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Loader2, CreditCard, Cpu } from 'lucide-react'
import { motion } from 'framer-motion'
import { OrderSummary } from '../components/OrderSummary'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/axios'

export function CheckoutPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const { t, language } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [searchParams] = useSearchParams()
  
  const planIdStr = searchParams.get('planId') || '2'
  const planId = parseInt(planIdStr, 10)

  const [isPaying, setIsPaying] = useState(false)
  const [estimate, setEstimate] = useState<any>(null)
  const [loadingEstimate, setLoadingEstimate] = useState(false)

  useEffect(() => {
    if (!user) return
    const fetchEstimate = async () => {
      setLoadingEstimate(true)
      try {
        const response = await apiClient.get('/billing/upgrade-estimate', {
          params: {
            userId: parseInt(user.id, 10),
            targetPlanId: planId
          }
        })
        setEstimate(response.data)
      } catch (err) {
        console.error('Failed to load upgrade estimate:', err)
      } finally {
        setLoadingEstimate(false)
      }
    }
    fetchEstimate()
  }, [user, planId])

  const handleStripeCheckout = async () => {
    if (!user) {
      toast.error(language === 'vi' ? 'Bạn cần đăng nhập để thực hiện thanh toán.' : 'Please sign in to proceed with checkout.')
      return
    }
    setIsPaying(true)
    try {
      const response = await apiClient.post('/billing/checkout', {
        userId: parseInt(user.id, 10),
        planId: planId,
        paymentMethod: 'STRIPE'
      })
      const { paymentUrl } = response.data
      
      if (paymentUrl === 'FREE_UPGRADE_SUCCESS') {
        toast.success(language === 'vi' ? 'Nâng cấp tài khoản thành công!' : 'Account upgraded successfully!')
        
        // Update local state and localStorage
        const currentUser = useAuthStore.getState().user
        if (currentUser) {
          const newPlan = planId === 3 ? 'institutional' : 'pro'
          useAuthStore.setState({
            user: {
              ...currentUser,
              plan: newPlan
            }
          })
          const localUserStr = localStorage.getItem('aiStudyHubCurrentUser')
          if (localUserStr) {
            try {
              const localUser = JSON.parse(localUserStr)
              localUser.plan = newPlan
              localStorage.setItem('aiStudyHubCurrentUser', JSON.stringify(localUser))
            } catch (e) {}
          }
        }
        navigate('/dashboard')
      } else if (paymentUrl) {
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
    <div className="relative min-h-[85vh] py-10 flex flex-col justify-center items-center p-3 md:p-10 rounded-3xl overflow-hidden transition-all duration-300">
      {/* Abstract background mesh glow spheres */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-indigo-400/10 dark:bg-indigo-650/5 blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-violet-400/10 dark:bg-violet-650/5 blur-[120px] -z-10 pointer-events-none" />

      <motion.div
        key="checkout-card"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[1040px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-150 dark:border-slate-800/80 rounded-3xl shadow-2xl shadow-indigo-950/5 dark:shadow-none overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[530px]">
          {/* Left Column: Stripe details */}
          <div className="lg:col-span-7 p-6 md:p-10 space-y-8 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Back to Plans Link */}
              <Link
                to="/dashboard/upgrade"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 no-underline transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                {t.upgrade.backToPlans}
              </Link>
 
              {/* Title & Subtitle */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    {language === 'vi' ? 'Đường truyền mã hóa 256-bit' : '256-bit SSL connection secured'}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3.5xl font-black text-slate-900 dark:text-white tracking-tight">
                  {language === 'vi' ? 'Thanh toán Đơn hàng' : 'Secure Checkout'}
                </h1>
                <p className="text-xs md:text-[13px] font-semibold text-slate-400 dark:text-slate-500 max-w-[480px] leading-relaxed">
                  {language === 'vi' ? 'Hoàn tất nâng cấp tài khoản của bạn thông qua cổng thanh toán bảo mật Stripe.' : 'Complete your upgrade using Stripe secure payment gateway.'}
                </p>
              </div>

              {/* Visual Mock Card Illustration */}
              <div className="relative group overflow-hidden bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 transition-all duration-300 hover:scale-[1.005] shadow-lg shadow-slate-950/20">
                {/* Decorative glowing gradient sphere */}
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 blur-2xl opacity-25 group-hover:opacity-40 transition-opacity duration-500" />
                
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">
                      Gateway Redirect
                    </span>
                    <h3 className="text-sm font-black text-slate-100 mt-2">
                      Stripe Live Terminal
                    </h3>
                  </div>
                  <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                    <Lock className="size-4 text-indigo-400" />
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-4">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Protocol</p>
                    <p className="font-mono text-xs text-slate-200">HTTPS / TLS 1.3</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Endpoint</p>
                    <p className="font-mono text-xs text-slate-200">api.stripe.com</p>
                  </div>
                </div>
              </div>

              {/* Payment Method Details */}
              <div className="bg-gradient-to-br from-indigo-50/20 to-violet-50/10 dark:from-indigo-950/5 dark:to-violet-950/5 border border-indigo-100/30 dark:border-indigo-900/10 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <CreditCard className="size-4 text-indigo-500" />
                    {language === 'vi' ? 'Phương thức thanh toán:' : 'Payment Method:'}
                  </span>
                  <span className="text-[#635bff] font-extrabold tracking-wide text-xs md:text-sm bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                    Stripe (Card / Apple Pay)
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Cpu className="size-4 text-violet-500" />
                    {language === 'vi' ? 'Cổng thanh toán:' : 'Gateway:'}
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold text-xs md:text-sm bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
                    Stripe Sandbox (Test Payment)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium pt-1.5 border-t border-slate-250/20 dark:border-slate-800/20">
                  {language === 'vi' 
                    ? '* Hệ thống sẽ chuyển hướng bạn tới giao diện thanh toán chính thức của Stripe. Bạn có thể sử dụng các thẻ test do Stripe cung cấp để thanh toán giả lập.'
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
                className="w-full bg-gradient-to-r from-[#635bff] to-[#4f46e5] hover:from-[#5851db] hover:to-[#4338ca] text-white py-4 px-4 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 select-none active:scale-[0.98] hover:scale-[1.005] transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-600/15 hover:shadow-xl hover:shadow-indigo-650/25 disabled:pointer-events-none disabled:opacity-75 focus:outline-none"
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
          <div className="lg:col-span-5 bg-[#fafbfc]/40 dark:bg-slate-950/25 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-850/80 p-6 md:p-10">
            <OrderSummary estimate={estimate} loadingEstimate={loadingEstimate} planId={planId} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default CheckoutPage
