import { Shield, CheckCircle2 } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'

interface OrderItem {
  id: string
  name: string
  description: string
  price: number
}

interface BillingSummary {
  items: OrderItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
}

const mockOrderData: BillingSummary = {
  items: [
    {
      id: 'pro_monthly',
      name: 'Pro Plan',
      description: 'Unlocks advanced AI Tutor and Analytics.',
      price: 200000.00,
    },
  ],
  subtotal: 200000.00,
  taxRate: 0.00, // 0%
  taxAmount: 0.00,
  total: 200000.00,
}

export function OrderSummary() {
  const { t, language } = useTranslation()
  const { subtotal, taxAmount, total } = mockOrderData

  const items = mockOrderData.items.map(item => {
    if (item.id === 'pro_monthly') {
      return {
        ...item,
        name: t.upgrade.proPlanMonthly,
        description: t.upgrade.proPlanMonthlyDesc
      }
    }
    return item
  })

  return (
    <div className="flex flex-col justify-between h-full space-y-8 select-none">
      <div className="space-y-6">
        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {t.upgrade.orderSummary}
        </h3>

        {/* Product details mapped from object array */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-start gap-4 bg-slate-50/40 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100/50 dark:border-slate-800/30">
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  {item.name}
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed max-w-[240px]">
                  {item.description}
                </p>
              </div>
              <span className="text-sm font-black text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-850 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                {item.price.toLocaleString('vi-VN')}đ
              </span>
            </div>
          ))}
        </div>

        {/* Features included list */}
        <div className="bg-gradient-to-br from-slate-50/50 to-indigo-50/10 dark:from-slate-900/30 dark:to-indigo-950/5 border border-slate-100 dark:border-slate-800/40 rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {language === 'vi' ? 'QUYỀN LỢI TÀI KHOẢN PRO:' : 'PRO PLAN INCLUDES:'}
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            {[
              language === 'vi' ? 'Trợ lý học tập AI 24/7 cao cấp' : '24/7 Advanced AI Study Tutor',
              language === 'vi' ? 'Báo cáo & Phân tích học tập chi tiết' : 'Detailed Learning Analytics Reports',
              language === 'vi' ? 'Không giới hạn dung lượng lưu trữ' : 'Unlimited workspace document index',
              language === 'vi' ? 'Hỗ trợ xuất tệp ghi chú PDF/Word' : 'Smart export of study notes'
            ].map((feat, idx) => (
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
            <span>{t.upgrade.subtotal}</span>
            <span className="text-slate-900 dark:text-slate-100 font-extrabold">{subtotal.toLocaleString('vi-VN')}đ</span>
          </div>
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
