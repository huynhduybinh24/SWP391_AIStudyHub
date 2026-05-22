import { motion } from 'framer-motion'
import { Sun, Moon, Palette } from 'lucide-react'
import { useTheme, type Theme } from './ThemeProvider'

// Custom CircleHalf icon for the System theme preference
function CircleHalfIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v20" />
      <path d="M12 18A6 6 0 0 0 12 6v12z" fill="currentColor" />
    </svg>
  )
}

interface InterfaceCardProps {
  currentTheme?: Theme
  onThemeChange?: (theme: Theme) => void
}

export function InterfaceCard({ currentTheme, onThemeChange }: InterfaceCardProps) {
  const { theme: contextTheme, setTheme: contextSetTheme } = useTheme()

  const activeTheme = currentTheme ?? contextTheme

  const options: { value: Theme; label: string; icon: React.ComponentType<any> }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: CircleHalfIcon },
  ]

  const handleThemeChange = (value: Theme) => {
    if (onThemeChange) {
      onThemeChange(value)
    } else {
      contextSetTheme(value)
    }
  }

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
              const isSelected = activeTheme === opt.value

              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  onClick={() => handleThemeChange(opt.value)}
                  aria-pressed={isSelected}
                  aria-label={`${opt.label} Theme`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`relative flex flex-col items-center justify-center rounded-xl border p-4 text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563eb]/45 hover:shadow-sm transition-shadow duration-200 ${
                    isSelected
                      ? 'border-[#2563eb] bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/10 font-bold shadow-sm'
                      : 'border-border dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-transparent font-normal'
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
                    className={`flex size-10 items-center justify-center rounded-full mb-3 transition-colors ${
                      isSelected
                        ? 'bg-[#2563eb]/10 dark:bg-[#2563eb]/20 text-[#2563eb]'
                        : 'bg-slate-50 dark:bg-slate-800 text-[#737686] dark:text-slate-400'
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>
                  
                  <span
                    className={`text-sm transition-colors ${
                      isSelected
                        ? 'text-[#2563eb] dark:text-blue-400'
                        : 'text-[#737686] dark:text-slate-400'
                    }`}
                  >
                    {opt.label}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
