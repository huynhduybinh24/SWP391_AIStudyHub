import { motion } from 'framer-motion'
import { useTranslation } from '@/context/LanguageContext'

interface SharedFilesTabsProps {
  activeTab: 'all' | 'with-me' | 'by-me'
  onChangeTab: (tab: 'all' | 'with-me' | 'by-me') => void
}

export function SharedFilesTabs({ activeTab, onChangeTab }: SharedFilesTabsProps) {
  const { language } = useTranslation()

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
      label: language === 'vi' ? 'Tôi chia sẻ' : (language === 'ja' ? '自分が所有/共有' : (language === 'ko' ? '내가 공유한 파일' : 'Shared by me'))
    }
  ]

  return (
    <div className="flex border-b border-slate-250 dark:border-slate-800">
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
