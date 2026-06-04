import { Shield, CheckCircle2, Loader2 } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'

interface OrderSummaryProps {
  estimate?: {
    currentPlanName: string
    targetPlanName: string
    targetPlanPrice: number
    remainingDays: number
    discountAmount: number
    finalPrice: number
    isUpgradeAllowed: boolean
    message: string
  }
  loadingEstimate?: boolean
  planId?: number
}

export function OrderSummary({ estimate, loadingEstimate, planId = 2 }: OrderSummaryProps) {
  const { t, language } = useTranslation()

  if (loadingEstimate) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[300px] select-none">
        <Loader2 className="size-8 animate-spin text-indigo-650" />
        <p className="text-xs text-slate-450 mt-3 font-semibold">
          {language === 'vi' ? 'Đang tính toán giá trị khấu trừ...' : 'Calculating proration credits...'}
        </p>
      </div>
    )
  }

  const isPremium = planId === 3
  const planName = isPremium
    ? (language === 'vi' ? 'Gói Premium' : 'Premium Plan')
    : (language === 'vi' ? 'Gói Pro' : 'Pro Plan')

  const planDesc = isPremium
    ? (language === 'vi' ? 'Dung lượng 50GB, tối đa AI cao cấp nhất.' : '50GB storage limit & top-tier AI models.')
    : (language === 'vi' ? 'Dung lượng 5GB, trợ lý học tập AI nâng cao.' : '5GB storage limit & advanced AI study tools.')

  const planPrice = isPremium ? 300000 : 200000
  
  // Use estimate values if available, otherwise fallback
  const subtotal = estimate ? estimate.targetPlanPrice : planPrice
  const discountAmount = estimate ? estimate.discountAmount : 0
  const total = estimate ? estimate.finalPrice : planPrice
  const remainingDays = estimate ? estimate.remainingDays : 0

  const perks = isPremium
    ? [
        language === 'vi' ? 'Dung lượng lưu trữ 50 GB' : '50 GB storage limit',
        language === 'vi' ? 'AI thông minh cao cấp nhất (GPT-4o)' : 'Top-tier Smart AI Models (GPT-4o)',
        language === 'vi' ? 'Báo cáo phân tích chuyên sâu hàng tuần' : 'Weekly AI In-depth Analytics Reports',
        language === 'vi' ? 'Ưu tiên hỗ trợ 24/7' : 'Priority 24/7 Dedicated Support'
      ]
    : [
        language === 'vi' ? 'Dung lượng lưu trữ 5 GB' : '5 GB storage limit',
        language === 'vi' ? 'AI Chatbot nâng cao & phân tích sâu' : 'Advanced AI chatbot & deep analysis',
        language === 'vi' ? 'Chia sẻ tệp tin không giới hạn' : 'Unlimited file sharing',
        language === 'vi' ? 'Tốc độ tải xuống băng thông cao' : 'High speed download bandwidth'
      ]

  return (
    <div className="flex flex-col justify-between h-full space-y-8 select-none">
      <div className="space-y-6">
        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {t.upgrade.orderSummary}
        </h3>

        {/* Product details */}
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4 bg-slate-50/40 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100/50 dark:border-slate-800/30">
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {planName}
              </h4>
              <p className="text-xs text-slate-450 dark:text-slate-500 leading-relaxed max-w-[240px]">
                {planDesc}
              </p>
            </div>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-850 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
              {planPrice.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>

        {/* Features included list */}
        <div className="bg-gradient-to-br from-slate-50/50 to-indigo-50/10 dark:from-slate-900/30 dark:to-indigo-950/5 border border-slate-100 dark:border-slate-800/40 rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {language === 'vi' ? `QUYỀN LỢI GÓI ${planName.toUpperCase()}:` : `${planName.toUpperCase()} INCLUDES:`}
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            {perks.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-650 dark:text-slate-350">
                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 w-full" />

        {/* Calculation Details */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-slate-550 dark:text-slate-400 font-bold">
            <span>{language === 'vi' ? 'Giá trị gói mới:' : 'Target plan price:'}</span>
            <span className="text-slate-900 dark:text-slate-100 font-extrabold">{subtotal.toLocaleString('vi-VN')}đ</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="flex flex-col">
                <span>{language === 'vi' ? 'Khấu trừ gói cũ:' : 'Proration credit:'}</span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  ({language === 'vi' ? `Còn ${remainingDays} ngày gói cũ` : `${remainingDays} days remaining`})
                </span>
              </span>
              <span className="font-extrabold">-{discountAmount.toLocaleString('vi-VN')}đ</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 w-full" />

        {/* Total Due */}
        <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
          <span className="text-sm font-extrabold text-slate-850 dark:text-slate-200">
            {t.upgrade.totalDue}
          </span>
          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            {total.toLocaleString('vi-VN')}đ
          </span>
        </div>
      </div>

      {/* Security Info & Payment Logos */}
      <div className="space-y-5">
        {/* Safe Badge */}
        <div className="flex gap-3 bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/20 rounded-2xl p-4 text-slate-600 dark:text-slate-300">
          <Shield className="size-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-[11px] font-extrabold text-slate-850 dark:text-slate-200">
              {t.upgrade.secureCheckoutLabel}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              {t.upgrade.sslEncrypted}
            </p>
          </div>
        </div>

        {/* Payment logos mock */}
        <div className="flex justify-center items-center gap-4 text-[10px] font-black tracking-widest text-slate-400/80 dark:text-slate-650">
          <span>VISA</span>
          <span>MC</span>
          <span>AMEX</span>
          <span>DISC</span>
        </div>
      </div>
    </div>
  )
}
