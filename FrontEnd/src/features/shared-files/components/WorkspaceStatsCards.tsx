import { HardDrive, Sparkles } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'

interface WorkspaceStatsCardsProps {
  onViewAIReport: () => void
  onStorageCardClick?: () => void
  onActiveCardClick?: () => void
}

export function WorkspaceStatsCards({
  onViewAIReport,
  onStorageCardClick,
  onActiveCardClick
}: WorkspaceStatsCardsProps) {
  const { t } = useTranslation()

  // SVG Stroke parameters for 24% circular progress
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (24 / 100) * circumference

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 select-none text-left">
      
      {/* 1. Storage Usage Card */}
      <div 
        onClick={onStorageCardClick}
        className="group relative flex flex-col justify-between rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-blue-500/20 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-550">
            {t.settings.interface === "Interface" || !t.settings.interface ? "STORAGE" : t.dashboard.storage.toUpperCase()}
          </span>
          <HardDrive className="size-4.5 text-blue-500 dark:text-blue-400" />
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
              <circle
                cx="25"
                cy="25"
                r={radius}
                className="stroke-blue-600 dark:stroke-blue-500 transition-all duration-500"
                strokeWidth="4"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-black text-slate-855 dark:text-slate-100">
              24%
            </span>
          </div>

          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">12.4</span>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-550 ml-0.5">GB</span>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold mt-0.5">
              {t.sharedFiles.used} 12.4 GB {t.sharedFiles.usedOf} 50 GB
            </p>
          </div>
        </div>

        {/* Wave Sparkline Chart */}
        <div className="mt-5 w-full h-8 overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity">
          <svg className="w-full h-full text-blue-500/80 dark:text-blue-400/80" viewBox="0 0 100 30" fill="none">
            <path
              d="M0 25 C10 25, 15 5, 25 15 C35 25, 40 10, 50 20 C60 30, 65 5, 75 12 C85 20, 90 22, 100 15"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* 2. Active Now Live Card */}
      <div 
        onClick={onActiveCardClick}
        className="group relative flex flex-col justify-between rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-blue-500/20 cursor-pointer"
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
          <div className="flex -space-x-2 shrink-0">
            <div className="size-8.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-[#0fbf7c] text-white flex items-center justify-center font-bold text-xs">S</div>
            <div className="size-8.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-[#5f6ffc] text-white flex items-center justify-center font-bold text-xs">D</div>
            <div className="size-8.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-450 flex items-center justify-center font-extrabold text-[10px] select-none">
              +6
            </div>
          </div>

          <div>
            <span className="text-xl font-black text-slate-900 dark:text-white leading-none">8</span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">{t.sharedFiles.teamMembers}</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-6 leading-relaxed">
          {t.sharedFiles.activeEditing}
        </p>
      </div>

      {/* 3. AI Workspace Guard Card */}
      <div 
        className="group relative flex flex-col justify-between rounded-[24px] bg-slate-950 dark:bg-slate-900 border border-slate-900 dark:border-slate-800 p-5 shadow-lg text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-4 text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-550 uppercase">
              {t.sharedFiles.aiGuard.toUpperCase()}
            </span>
          </div>
        </div>

        <p className="text-xs font-bold text-slate-200 leading-relaxed mt-4.5 mb-5">
          {t.sharedFiles.aiGuardDesc}
        </p>

        <button
          type="button"
          onClick={onViewAIReport}
          className="w-full bg-slate-850 hover:bg-slate-800 active:scale-[0.98] border border-slate-800 dark:border-slate-700 hover:border-slate-700 text-slate-100 font-extrabold text-[11px] py-2.5 px-4 rounded-xl shadow-xs transition-all duration-200 cursor-pointer"
        >
          {t.sharedFiles.viewAIReport}
        </button>
      </div>
      
    </div>
  )
}

export default WorkspaceStatsCards
