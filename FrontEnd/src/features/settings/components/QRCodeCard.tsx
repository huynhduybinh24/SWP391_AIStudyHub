import React from 'react'

export function QRCodeCard() {
  return (
    <div className="flex justify-center my-5">
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm max-w-[280px] w-full flex flex-col items-center justify-center">
        {/* Smartphone mockup */}
        <div className="relative w-44 h-64 bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-md flex flex-col items-center p-3 overflow-hidden">
          {/* Speaker/Notch */}
          <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mb-3" />
          
          {/* Shield Icon inside circle */}
          <div className="size-8 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mb-2">
            <svg className="size-4 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          {/* QR Code Graphic */}
          <div className="relative size-24 bg-white p-1 rounded-lg border border-slate-100 flex items-center justify-center mb-2 shadow-inner">
            <svg className="size-full text-slate-800" viewBox="0 0 100 100">
              <rect x="0" y="0" width="100" height="100" fill="none" />
              {/* Outer anchor points */}
              <rect x="5" y="5" width="22" height="22" fill="currentColor" />
              <rect x="9.5" y="9.5" width="13" height="13" fill="white" />
              <rect x="12" y="12" width="8" height="8" fill="currentColor" />

              <rect x="73" y="5" width="22" height="22" fill="currentColor" />
              <rect x="77.5" y="9.5" width="13" height="13" fill="white" />
              <rect x="80" y="12" width="8" height="8" fill="currentColor" />

              <rect x="5" y="73" width="22" height="22" fill="currentColor" />
              <rect x="9.5" y="77.5" width="13" height="13" fill="white" />
              <rect x="12" y="80" width="8" height="8" fill="currentColor" />

              {/* Center shield graphic */}
              <rect x="42" y="42" width="16" height="16" fill="white" />
              <path d="M46 45v3c0 2.2 1.8 4 4 4s4-1.8 4-4v-3h-8z" fill="#2563EB" />
              <path d="M50 43.5l4 1.5v2h-8v-2l4-1.5z" fill="#2563EB" />

              {/* Random QR bits */}
              <rect x="32" y="5" width="12" height="4" fill="currentColor" />
              <rect x="50" y="5" width="8" height="8" fill="currentColor" />
              <rect x="62" y="5" width="4" height="12" fill="currentColor" />
              
              <rect x="32" y="15" width="4" height="16" fill="currentColor" />
              <rect x="42" y="15" width="8" height="4" fill="currentColor" />
              <rect x="55" y="18" width="12" height="4" fill="currentColor" />

              <rect x="32" y="32" width="8" height="4" fill="currentColor" />
              <rect x="46" y="32" width="16" height="4" fill="currentColor" />
              <rect x="68" y="32" width="10" height="4" fill="currentColor" />
              <rect x="84" y="32" width="10" height="10" fill="currentColor" />

              <rect x="5" y="32" width="4" height="12" fill="currentColor" />
              <rect x="15" y="36" width="12" height="4" fill="currentColor" />

              <rect x="5" y="52" width="8" height="8" fill="currentColor" />
              <rect x="18" y="52" width="12" height="4" fill="currentColor" />
              <rect x="32" y="48" width="4" height="16" fill="currentColor" />
              
              <rect x="68" y="45" width="4" height="16" fill="currentColor" />
              <rect x="78" y="48" width="16" height="4" fill="currentColor" />
              
              <rect x="88" y="58" width="6" height="10" fill="currentColor" />

              <rect x="32" y="68" width="16" height="4" fill="currentColor" />
              <rect x="54" y="68" width="8" height="12" fill="currentColor" />
              <rect x="68" y="68" width="12" height="4" fill="currentColor" />

              <rect x="32" y="80" width="4" height="12" fill="currentColor" />
              <rect x="42" y="78" width="12" height="4" fill="currentColor" />
              <rect x="42" y="88" width="16" height="4" fill="currentColor" />
              <rect x="64" y="80" width="8" height="12" fill="currentColor" />
              <rect x="78" y="80" width="4" height="12" fill="currentColor" />
              <rect x="88" y="78" width="6" height="16" fill="currentColor" />
            </svg>
          </div>

          {/* Subtexts */}
          <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 text-center tracking-tight leading-none mt-1">
            Scan to Authenticate.
          </span>
          <span className="text-[8px] font-semibold text-slate-400 dark:text-slate-500 text-center tracking-tight leading-none mt-0.5">
            Secure Your Account.
          </span>
        </div>
      </div>
    </div>
  )
}
