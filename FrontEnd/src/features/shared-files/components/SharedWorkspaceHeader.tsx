import { Upload, UserPlus, Sparkles } from 'lucide-react'

interface SharedWorkspaceHeaderProps {
  onUploadClick: () => void
  onInviteClick: () => void
  onAIAnalyzeClick: () => void
  isAnalyzing: boolean
}

export function SharedWorkspaceHeader({
  onUploadClick,
  onInviteClick,
  onAIAnalyzeClick,
  isAnalyzing
}: SharedWorkspaceHeaderProps) {
  return (
    <div className="pt-2 text-left select-none">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        {/* Left Side: Title & Subtitle */}
        <div className="space-y-1.5 max-w-xl">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Shared Workspace
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-455">
            Collaborate with teammates and AI assistants in real time.
          </p>
        </div>

        {/* Right Side: Action buttons container */}
        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap shrink-0">
          {/* 1. Upload File Button */}
          <button
            type="button"
            onClick={onUploadClick}
            className="flex items-center justify-center gap-2 rounded-full bg-[#3155F6] hover:bg-blue-700 text-white font-black px-6 h-11 text-xs shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-200 cursor-pointer hover:scale-[1.02] shrink-0"
          >
            <Upload className="size-4 transition-transform group-hover:-translate-y-0.5" />
            <span>Upload File</span>
          </button>

          {/* 2. Invite Button */}
          <button
            type="button"
            onClick={onInviteClick}
            className="flex items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-slate-805 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-black px-6 h-11 text-xs shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 cursor-pointer hover:scale-[1.02] shrink-0"
          >
            <UserPlus className="size-4" />
            <span>Invite</span>
          </button>

          {/* 3. AI Analyze Button */}
          <button
            type="button"
            onClick={onAIAnalyzeClick}
            disabled={isAnalyzing}
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3155F6] to-[#7C3AED] hover:from-[#2563eb] hover:to-[#6d28d9] text-white font-black px-6 h-11 text-xs shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200 cursor-pointer hover:scale-[1.02] disabled:opacity-50 shrink-0"
          >
            <Sparkles className="size-4 animate-pulse text-indigo-200" />
            <span>{isAnalyzing ? 'Analyzing...' : 'AI Analyze'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SharedWorkspaceHeader
