import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from '@/context/LanguageContext'

interface SharedFilesTabsProps {
  activeTab: 'all' | 'with-me' | 'by-me'
  onChangeTab: (tab: 'all' | 'with-me' | 'by-me') => void
}

export function SharedFilesTabs({ activeTab, onChangeTab }: SharedFilesTabsProps) {
  const { language } = useTranslation()
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)

  const tabs = [
    {
      id: 'all' as const,
      label: language === 'vi' ? 'Tất cả tài liệu' : (language === 'ja' ? 'すべてのファイル' : (language === 'ko' ? '모든 파일' : 'All Files'))
    },
    {
      id: 'with-me' as const,
      label: language === 'vi' ? 'Được chia sẻ với tôi' : (language === 'ja' ? '共有されたファイル' : (language === 'ko' ? '공유받은 파일' : 'Shared with me'))
    },
    {
      id: 'by-me' as const,
      label: language === 'vi' ? 'Tôi chia sẻ' : (language === 'ja' ? '自分が sở hữu/chia sẻ' : (language === 'ko' ? '내가 공유한 파일' : 'Shared by me'))
    }
  ]

  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800 relative select-none w-full">
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              className={`relative py-3.5 px-5 text-sm font-bold transition-all duration-300 focus:outline-none cursor-pointer rounded-2xl ${
                isActive
                  ? 'text-[#3155F6] dark:text-blue-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {/* Hover Pill Background */}
              {hoveredTab === tab.id && (
                <motion.div
                  layoutId="sharedTabHoverPill"
                  className="absolute inset-0 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 z-0"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <span className="relative z-10">{tab.label}</span>

              {/* Active Underline Bar */}
              {isActive && (
                <motion.div
                  layoutId="activeSharedTabUnderline"
                  initial={false}
                  className="absolute bottom-[-1px] left-3 right-3 h-[3.5px] bg-gradient-to-r from-[#3155F6] to-indigo-500 dark:from-blue-500 dark:to-indigo-400 rounded-full z-20 shadow-[0_2px_8px_rgba(49,85,246,0.35)] dark:shadow-[0_2px_8px_rgba(59,130,246,0.3)]"
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SharedFilesTabs
