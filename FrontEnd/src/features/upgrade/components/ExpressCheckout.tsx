import { motion } from 'framer-motion'

interface ExpressCheckoutProps {
  selectedProvider: 'apple' | 'google' | 'paypal' | null
  onSelectProvider: (provider: 'apple' | 'google' | 'paypal', event?: React.MouseEvent) => void
  disabled?: boolean
}

export function ExpressCheckout({
  selectedProvider,
  onSelectProvider,
  disabled = false,
}: ExpressCheckoutProps) {
  const providers = [
    {
      id: 'apple' as const,
      name: 'Apple Pay',
      ariaLabel: 'Pay with Apple Pay',
      icon: (
        <svg className="size-4 fill-current mb-0.5" viewBox="0 0 24 24">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.01 2.96 1.12.09 2.27-.57 2.94-1.39z" />
        </svg>
      ),
      label: 'Apple Pay',
    },
    {
      id: 'google' as const,
      name: 'Google Pay',
      ariaLabel: 'Pay with Google Pay',
      icon: null,
      label: (
        <span className="flex items-center gap-0.5">
          <span className="text-[#4285F4] dark:text-[#4285F4] font-extrabold tracking-tight">G</span>
          <span className="font-bold">Pay</span>
        </span>
      ),
    },
    {
      id: 'paypal' as const,
      name: 'PayPal',
      ariaLabel: 'Pay with PayPal',
      icon: null,
      label: <span className="italic font-extrabold tracking-tight">PayPal</span>,
    },
  ]

  return (
    <div className="space-y-3">
      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
        Express Checkout
      </span>
      <div className="grid grid-cols-3 gap-3">
        {providers.map((p) => {
          const isSelected = selectedProvider === p.id

          // Dynamic selected / unselected styling as requested
          const buttonStyle = isSelected
            ? 'bg-[#fbbf24] hover:bg-[#f59e0b] border-[#d97706] text-black dark:text-black ring-2 ring-[#fbbf24]/50 shadow-sm shadow-[#fbbf24]/20 font-bold'
            : 'bg-white hover:bg-slate-50/80 dark:bg-slate-900 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'

          return (
            <motion.button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={(e) => onSelectProvider(p.id, e)}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              aria-pressed={isSelected}
              aria-label={p.ariaLabel}
              className={`flex h-11 items-center justify-center rounded-xl border font-bold transition-all text-sm select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563eb] ${buttonStyle}`}
            >
              <span className="flex items-center gap-1">
                {p.icon}
                {p.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
