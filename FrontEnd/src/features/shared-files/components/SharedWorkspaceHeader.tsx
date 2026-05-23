import { Upload, UserPlus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

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
    <div className="space-y-4 pt-2 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Shared Workspace
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-450">
            Collaborate with teammates and AI assistants in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Upload File Button */}
          <Button
            type="button"
            onClick={onUploadClick}
            className="group flex items-center gap-2 rounded-2xl bg-[#3155F6] hover:bg-blue-700 text-white font-bold px-5 py-2.5 text-xs shadow-md shadow-blue-500/10 transition-all duration-200 h-[42px] cursor-pointer"
          >
            <Upload className="size-4 shrink-0 transition-transform group-hover:-translate-y-0.5" />
            <span>Upload File</span>
          </Button>

          {/* Invite Button */}
          <Button
            type="button"
            variant="secondary"
            onClick={onInviteClick}
            className="group flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold px-5 py-2.5 text-xs shadow-xs transition-all duration-200 h-[42px] cursor-pointer"
          >
            <UserPlus className="size-4 shrink-0 text-slate-450 dark:text-slate-400" />
            <span>Invite</span>
          </Button>

          {/* AI Analyze Button */}
          <Button
            type="button"
            onClick={onAIAnalyzeClick}
            disabled={isAnalyzing}
            className="group flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 text-xs shadow-md shadow-indigo-500/10 transition-all duration-200 h-[42px] cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="size-4 shrink-0 animate-pulse text-indigo-200" />
            <span>{isAnalyzing ? 'Analyzing...' : 'AI Analyze'}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SharedWorkspaceHeader
