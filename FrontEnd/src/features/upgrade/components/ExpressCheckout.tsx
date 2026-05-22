import React from 'react'

export function ExpressCheckout() {
  return (
    <div className="space-y-3">
      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
        Express Checkout
      </span>
      <div className="grid grid-cols-3 gap-3">
        {/* Apple Pay */}
        <button
          type="button"
          onClick={() => alert('Apple Pay clicked')}
          className="flex h-11 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-850 font-bold transition-all text-sm select-none active:scale-[0.98] cursor-pointer"
        >
          {/* Apple Pay Logo SVG */}
          <span className="flex items-center gap-1">
            <svg className="size-4 fill-current mb-0.5" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.01 2.96 1.12.09 2.27-.57 2.94-1.39z" />
            </svg>
            Pay
          </span>
        </button>

        {/* Google Pay */}
        <button
          type="button"
          onClick={() => alert('Google Pay clicked')}
          className="flex h-11 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-850 font-bold transition-all text-sm select-none active:scale-[0.98] cursor-pointer"
        >
          {/* Google Pay Label */}
          <span className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-semibold tracking-tight">G</span>
            <span className="font-bold">Pay</span>
          </span>
        </button>

        {/* PayPal */}
        <button
          type="button"
          onClick={() => alert('PayPal clicked')}
          className="flex h-11 items-center justify-center rounded-xl bg-[#ffc439] hover:bg-[#f2b522] text-[#003087] font-bold transition-all text-sm select-none active:scale-[0.98] cursor-pointer shadow-sm shadow-[#ffc439]/10"
        >
          {/* PayPal Style Label */}
          <span className="italic font-extrabold tracking-tight">
            PayPal
          </span>
        </button>
      </div>
    </div>
  )
}
