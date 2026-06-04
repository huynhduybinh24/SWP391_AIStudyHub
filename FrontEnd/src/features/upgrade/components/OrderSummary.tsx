import { Shield } from 'lucide-react'
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
  const { t } = useTranslation()
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
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {t.upgrade.orderSummary}
        </h3>

        {/* Product details mapped from object array */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {item.name}
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed max-w-[240px]">
                  {item.description}
                </p>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {item.price.toLocaleString('vi-VN')}đ
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200/60 dark:border-slate-800/80 w-full" />

        {/* Calculation Details */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 font-semibold">
            <span>{t.upgrade.subtotal}</span>
            <span className="text-slate-800 dark:text-slate-200">{subtotal.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 font-semibold">
            <span>{t.upgrade.tax}</span>
            <span className="text-slate-800 dark:text-slate-200">{taxAmount.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200/60 dark:border-slate-800/80 w-full" />

        {/* Total Due */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {t.upgrade.totalDue}
          </span>
          <span className="text-2xl font-extrabold text-[#2563eb] dark:text-blue-400">
            {total.toLocaleString('vi-VN')}đ
          </span>
        </div>
      </div>

      {/* Security Info & Payment Logos */}
      <div className="space-y-5">
        {/* Safe Badge */}
        <div className="flex gap-3 bg-blue-50/45 dark:bg-blue-950/20 border border-blue-100/70 dark:border-blue-950/40 rounded-2xl p-4 text-slate-600 dark:text-slate-300">
          <Shield className="size-5 text-[#2563eb] dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold">
              {t.upgrade.secureCheckoutLabel}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              {t.upgrade.sslEncrypted}
            </p>
          </div>
        </div>

        {/* Payment logos mock */}
        <div className="flex justify-center items-center gap-4 text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-600">
          <span>VISA</span>
          <span>MC</span>
          <span>AMEX</span>
          <span>DISC</span>
        </div>
      </div>
    </div>
  )
}
