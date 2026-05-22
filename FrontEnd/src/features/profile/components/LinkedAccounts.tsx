import { useProfileStore } from '../stores/profileStore'
import { motion } from 'framer-motion'

export function LinkedAccounts() {
  const { linkedAccounts, toggleAccountConnection } = useProfileStore()

  const getBrandIcon = (id: string) => {
    switch (id) {
      case 'google':
        return (
          <svg className="size-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )
      case 'microsoft':
        return (
          <svg className="size-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0h11v11H0z" fill="#F25022" />
            <path d="M12 0h11v11H12z" fill="#7FBA00" />
            <path d="M0 12h11v11H0z" fill="#00A4EF" />
            <path d="M12 12h11v11H12z" fill="#FFB900" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-100 dark:border-slate-800/80">
      <h3 className="text-base font-bold text-[#0b1c30] dark:text-white mb-4">Linked Accounts</h3>
      <div className="space-y-4">
        {linkedAccounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f5f7ff]/50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700/80 transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm shrink-0 border border-slate-100 dark:border-slate-700">
                {getBrandIcon(account.id)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {account.name}
                </span>
                {account.connected && account.email && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate max-w-[150px]">
                    {account.email}
                  </span>
                )}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleAccountConnection(account.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                account.connected
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
                  : 'bg-slate-150 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {account.connected ? 'Connected' : 'Connect'}
            </motion.button>
          </div>
        ))}
      </div>
    </div>
  )
}
