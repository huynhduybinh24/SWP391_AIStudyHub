import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface CustomSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  'aria-label'?: string
  'aria-labelledby'?: string
  id?: string
}

export function CustomSwitch({
  checked,
  onChange,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  id,
}: CustomSwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 flex items-center ${
        checked
          ? 'bg-[#2563eb] justify-end'
          : 'bg-[#e5e7eb] justify-start border border-slate-350 dark:border-slate-700'
      }`}
    >
      <motion.div
        layout
        className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm"
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {checked && (
          <Check className="h-3 w-3 text-[#2563eb]" strokeWidth={3.5} />
        )}
      </motion.div>
    </button>
  )
}
