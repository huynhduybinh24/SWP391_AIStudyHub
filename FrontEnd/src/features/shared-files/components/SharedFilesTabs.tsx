import { motion } from 'framer-motion'

interface SharedFilesTabsProps {
  activeTab: 'with-me' | 'by-me'
  onChangeTab: (tab: 'with-me' | 'by-me') => void
}

export function SharedFilesTabs({ activeTab, onChangeTab }: SharedFilesTabsProps) {
  const tabs = [
    { id: 'with-me' as const, label: 'Shared With Me' },
    { id: 'by-me' as const, label: 'Shared By Me' }
  ]

  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`relative py-4 px-6 text-sm font-bold transition-colors focus:outline-none cursor-pointer ${
              isActive
                ? 'text-[#3155F6] dark:text-blue-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            {isActive && (
              <motion.div
                layoutId="activeSharedTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3155F6] dark:bg-blue-500"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default SharedFilesTabs
