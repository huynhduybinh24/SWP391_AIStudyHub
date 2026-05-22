import { motion } from 'framer-motion'
import { Sun, Moon, Monitor, Palette } from 'lucide-react'
import { useSettingsStore, type ThemePreference } from '../stores/settingsStore'

export function InterfaceCard() {
  const { theme, setTheme } = useSettingsStore()

  const options: { value: ThemePreference; label: string; icon: React.ComponentType<any> }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <div className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/60 dark:border-slate-800/80 pb-4 mb-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[#E5EEFF] dark:bg-blue-950/50 text-[#2563EB]">
          <Palette className="size-5" />
        </div>
        <h2 className="text-lg font-semibold text-foreground dark:text-slate-100">Interface</h2>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted dark:text-slate-400 mb-3">Theme Preference</h3>
          <div className="grid grid-cols-3 gap-4">
            {options.map((opt) => {
              const Icon = opt.icon
              const isSelected = theme === opt.value

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={`relative flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 ${
                    isSelected
                      ? 'border-[#2563eb] bg-[#2563eb]/5 dark:bg-[#2563eb]/10'
                      : 'border-border dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeTheme"
                      className="absolute inset-0 rounded-xl border-2 border-[#2563eb] pointer-events-none"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  <div
                    className={`flex size-10 items-center justify-center rounded-full mb-3 ${
                      isSelected
                        ? 'bg-[#2563eb]/10 dark:bg-[#2563eb]/20 text-[#2563eb]'
                        : 'bg-slate-50 dark:bg-slate-800 text-[#737686] dark:text-slate-400'
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>
                  
                  <span
                    className={`text-sm font-semibold ${
                      isSelected
                        ? 'text-[#2563eb] dark:text-blue-400'
                        : 'text-[#737686] dark:text-slate-400'
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
