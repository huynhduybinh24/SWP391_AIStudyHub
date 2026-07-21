import { HardDrive, Sparkles, BrainCircuit } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useTranslation } from '@/context/LanguageContext'
import { formatStorageSize } from '@/utils/storageFormat'
import { getCurrentUserStorageSummary } from '@/services/storageService'

interface WorkspaceStatsCardsProps {
  onViewAIReport: () => void
  onStorageCardClick?: () => void
  onActiveCardClick?: () => void
  activeCollaboratorsCount?: number
  filesCount?: number
  workspaceName?: string
}

export function WorkspaceStatsCards({
  onViewAIReport,
  onStorageCardClick,
  onActiveCardClick,
  activeCollaboratorsCount,
  filesCount,
  workspaceName
}: WorkspaceStatsCardsProps) {
  const { language, t } = useTranslation()

  // ── Storage data: same source as QuotaDetailsModal ──────────────────────
  const [storageSummary, setStorageSummary] = useState(() => getCurrentUserStorageSummary())

  useEffect(() => {
    const refresh = () => setStorageSummary(getCurrentUserStorageSummary())
    window.addEventListener('aiStudyHubUserChanged', refresh)
    return () => window.removeEventListener('aiStudyHubUserChanged', refresh)
  }, [])

  let { usedMb, totalMb, percentage: usedPercentage } = storageSummary
  if (usedMb === 0 && filesCount && filesCount > 0) {
    usedMb = Math.round(filesCount * 3.5 * 10) / 10
    const rawPercentage = (usedMb / totalMb) * 100
    usedPercentage = Math.min(Math.max(1, Math.round(rawPercentage)), 100)
  }

  // SVG Stroke parameters for dynamic circular progress
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (usedPercentage / 100) * circumference

  // Framer motion variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05
      }
    }
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 280,
        damping: 24,
        mass: 0.8
      }
    }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 gap-5 select-none text-left"
    >
      
      {/* 1. Storage Usage Card */}
      <motion.div 
        variants={cardVariants}
        whileHover={{ 
          y: -6, 
          scale: 1.015,
          boxShadow: '0 15px 35px -10px rgba(59, 130, 246, 0.15)',
          borderColor: 'rgba(59, 130, 246, 0.25)' 
        }}
        onClick={onStorageCardClick}
        className="group relative flex flex-col justify-between rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all duration-300 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black tracking-widest text-blue-500 uppercase dark:text-blue-400">
            {t.sharedFiles.statsStorage ? t.sharedFiles.statsStorage.toUpperCase() : 'SHARED QUOTA'}
          </span>
          <HardDrive className="size-4.5 text-blue-500 dark:text-blue-400 group-hover:rotate-12 transition-transform duration-300" />
        </div>

        <div className="flex items-center gap-4.5 mt-5">
          {/* Custom SVG Progress Circle */}
          <div className="relative size-12.5 flex items-center justify-center shrink-0">
            <svg className="size-full -rotate-90">
              <circle
                cx="25"
                cy="25"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="4"
                fill="none"
              />
              <motion.circle
                cx="25"
                cy="25"
                r={radius}
                className="stroke-blue-600 dark:stroke-blue-500"
                strokeWidth="4"
                fill="none"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: strokeDashoffset }}
                transition={{ duration: 1.0, ease: 'easeOut', delay: 0.3 }}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-black text-slate-855 dark:text-slate-100">
              {usedPercentage}%
            </span>
          </div>

          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{formatStorageSize(usedMb)}</span>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold mt-0.5">
              {t.sharedFiles.used} {formatStorageSize(usedMb)} {t.sharedFiles.usedOf} {formatStorageSize(totalMb)}
              <span className="ml-1 text-blue-400 dark:text-blue-500">(shared)</span>
            </p>
          </div>
        </div>

        {/* Wave Sparkline Chart */}
        <div className="mt-5 w-full h-8 overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity">
          <svg className="w-full h-full text-blue-500/80 dark:text-blue-400/80" viewBox="0 0 100 30" fill="none">
            <motion.path
              d="M0 25 C10 25, 15 5, 25 15 C35 25, 40 10, 50 20 C60 30, 65 5, 75 12 C85 20, 90 22, 100 15"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.5 }}
            />
          </svg>
        </div>
      </motion.div>

      {/* 2. Active Now Live Card */}
      <motion.div 
        variants={cardVariants}
        whileHover={{ 
          y: -6, 
          scale: 1.015,
          boxShadow: '0 15px 35px -10px rgba(16, 185, 129, 0.15)',
          borderColor: 'rgba(16, 185, 129, 0.25)' 
        }}
        onClick={onActiveCardClick}
        className="group relative flex flex-col justify-between rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all duration-300 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-550">
            {t.sharedFiles.activeNow.toUpperCase()}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100/30">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t.sharedFiles.live}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-3">
          {/* Avatar stack */}
          <div className="flex -space-x-2 group-hover:-space-x-0.5 transition-all duration-300 shrink-0">
            <div className="size-8.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-[#0fbf7c] text-white flex items-center justify-center font-bold text-xs">S</div>
            <div className="size-8.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-[#5f6ffc] text-white flex items-center justify-center font-bold text-xs">D</div>
            <div className="size-8.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-450 flex items-center justify-center font-extrabold text-[10px] select-none">
              +{Math.max(0, (activeCollaboratorsCount ?? 8) - 2)}
            </div>
          </div>

          <div>
            <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
              {activeCollaboratorsCount ?? 8}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">{t.sharedFiles.teamMembers}</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-6 leading-relaxed">
          {t.sharedFiles.activeEditing}
        </p>
      </motion.div>

      {/* 3. AI Group Study & Practice Quiz Assistant Card */}
      <motion.div 
        variants={cardVariants}
        whileHover={{ 
          y: -6, 
          scale: 1.015,
          boxShadow: '0 15px 35px -10px rgba(124, 58, 237, 0.3)',
          borderColor: 'rgba(124, 58, 237, 0.4)' 
        }}
        onClick={onViewAIReport}
        className="group relative flex flex-col justify-between rounded-[24px] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 dark:from-slate-900 dark:to-indigo-950 border border-indigo-900/40 dark:border-indigo-800/40 p-5 shadow-lg text-white cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="size-4 text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-black tracking-widest text-indigo-300 uppercase">
              {language === 'vi' ? 'TRỢ LÝ ÔN THI & QUIZ AI' : 'AI STUDY & QUIZ ASSISTANT'}
            </span>
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-200 leading-relaxed mt-3 mb-4">
          {typeof filesCount === 'number' && filesCount > 0
            ? (language === 'vi'
              ? `AI đã sẵn sàng tổng hợp kiến thức từ ${filesCount} tài liệu nhóm để tạo Đề thi thử (Quiz) & Báo cáo ôn tập.`
              : `AI is ready to synthesize knowledge from ${filesCount} group files into practice quizzes & study reports.`)
            : (language === 'vi'
              ? `Tải tài liệu vào nhóm để AI tự động trích xuất điểm thưởng thi, tạo Quiz luyện tập & Sơ đồ tư duy.`
              : `Upload group materials for AI to auto-generate practice quizzes, study mindmaps & key exam topics.`)}
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewAIReport();
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-extrabold text-[11px] py-2.5 px-4 rounded-xl shadow-md shadow-indigo-600/20 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Sparkles className="size-3.5 text-indigo-200" />
          <span>{language === 'vi' ? 'Tạo Quiz & Xem Phân Tích AI' : 'Generate Quiz & AI Report'}</span>
        </button>
      </motion.div>
      
    </motion.div>
  )
}

export default WorkspaceStatsCards
