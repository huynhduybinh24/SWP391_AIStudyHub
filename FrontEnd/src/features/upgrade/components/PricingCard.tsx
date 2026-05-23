import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

export interface PricingPlan {
  name: string
  price: string
  billing?: string
  yearlySavingText?: string
  description: string
  features: string[]
  buttonText: string
  buttonVariant: 'outline' | 'primary' | 'secondary'
  popular?: boolean
  isCurrent?: boolean
}

interface PricingCardProps {
  plan: PricingPlan
  index: number
  onCurrentPlanClick: () => void
  onUpgradeClick: () => void
  onContactSalesClick: () => void
}

export function PricingCard({
  plan,
  index,
  onCurrentPlanClick,
  onUpgradeClick,
  onContactSalesClick,
}: PricingCardProps) {
  const { t } = useTranslation()
  const isPro = plan.popular

  const handleButtonClick = () => {
    if (plan.isCurrent) {
      onCurrentPlanClick()
    } else if (plan.buttonVariant === 'primary') {
      onUpgradeClick()
    } else {
      onContactSalesClick()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
      whileHover={
        isPro
          ? { y: -8, scale: 1.03, transition: { duration: 0.25 } }
          : { y: -4, scale: 1.01, transition: { duration: 0.25 } }
      }
      className={cn(
        'relative flex flex-col justify-between rounded-[32px] bg-white dark:bg-slate-900 p-8 transition-all duration-300 shadow-sm border h-full select-none',
        isPro
          ? 'border-[#3155F6] dark:border-[#3155F6] shadow-xl shadow-blue-500/10 dark:shadow-blue-500/5 z-10 scale-[1.02] md:scale-100 lg:scale-[1.02]'
          : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md'
      )}
    >
      {/* Most Popular Badge */}
      {isPro && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#3155F6] text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm whitespace-nowrap z-20">
          {t.upgrade.popular}
        </div>
      )}

      <div className="space-y-6">
        {/* Header section */}
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
            {plan.name}
          </h3>
          
          {/* Price */}
          <div className="mt-4 flex items-baseline gap-1 text-slate-900 dark:text-white">
            <span className="text-4xl font-extrabold tracking-tight">
              {plan.price}
            </span>
            {plan.billing && (
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {plan.billing}
              </span>
            )}
          </div>

          {/* Yearly savings text */}
          {plan.yearlySavingText ? (
            <p className="mt-1.5 text-xs font-bold text-[#3155F6] dark:text-blue-400">
              {plan.yearlySavingText}
            </p>
          ) : (
            // Maintain spacing block
            <div className="h-4.5" />
          )}

          {/* Description */}
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed min-h-[40px]">
            {plan.description}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-800/60 w-full" />

        {/* Features List */}
        <ul className="space-y-4 flex-1">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              {isPro ? (
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#3155F6] text-white mt-0.5 shadow-sm">
                  <Check className="size-3" strokeWidth={3.5} />
                </div>
              ) : (
                <div className="flex size-5 shrink-0 items-center justify-center text-slate-400 dark:text-slate-500 mt-0.5">
                  <Check className="size-4" strokeWidth={2.5} />
                </div>
              )}
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 leading-snug">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Button Action */}
      <div className="mt-8">
        {plan.isCurrent ? (
          <button
            type="button"
            onClick={handleButtonClick}
            className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3.5 px-4 text-sm font-bold text-slate-400 dark:text-slate-500 transition-colors cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
            aria-label="Current Plan activated"
          >
            {plan.buttonText}
          </button>
        ) : plan.buttonVariant === 'primary' ? (
          <button
            type="button"
            onClick={handleButtonClick}
            className="w-full text-center block rounded-2xl bg-[#3155F6] py-4 px-4 text-sm font-bold text-white transition-all hover:bg-[#2563eb] shadow-md shadow-[#3155F6]/15 hover:shadow-lg hover:shadow-[#3155F6]/25 active:scale-[0.98] cursor-pointer"
            aria-label="Upgrade to Pro Plan"
          >
            {plan.buttonText}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleButtonClick}
            className="w-full rounded-2xl bg-[#e5eeff] dark:bg-blue-950/40 py-4 px-4 text-sm font-bold text-[#2563eb] dark:text-blue-400 transition-all hover:bg-[#d0e1ff] dark:hover:bg-blue-950/60 active:scale-[0.98] cursor-pointer"
            aria-label="Contact Sales for Institutional Plan"
          >
            {plan.buttonText}
          </button>
        )}
      </div>
    </motion.div>
  )
}
