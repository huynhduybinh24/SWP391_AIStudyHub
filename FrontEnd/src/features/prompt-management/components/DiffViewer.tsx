import { GitCompare, Plus, Minus, ArrowRightLeft } from 'lucide-react'

export interface DiffLine {
  type: 'ADD' | 'DELETE' | 'UNCHANGED'
  oldLineNumber?: number
  newLineNumber?: number
  content: string
}

export interface PromptDiffResponse {
  fromVersionId: number
  fromVersionNumber: string
  toVersionId: number
  toVersionNumber: string
  promptCode: string
  promptName: string
  diffLines: DiffLine[]
  additionsCount?: number
  deletionsCount?: number
  unchangedCount?: number
}

interface DiffViewerProps {
  diff: PromptDiffResponse
  onSwapVersions?: () => void
}

export function DiffViewer({ diff, onSwapVersions }: DiffViewerProps) {
  const {
    fromVersionNumber,
    toVersionNumber,
    diffLines = [],
    additionsCount = 0,
    deletionsCount = 0,
  } = diff

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs space-y-4">
      {/* Header Info */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitCompare className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Comparing Version {fromVersionNumber} → Version {toVersionNumber}
            </h3>
            <div className="flex items-center gap-3 text-xs mt-0.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> {additionsCount} additions
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <Minus className="w-3.5 h-3.5" /> {deletionsCount} deletions
              </span>
            </div>
          </div>
        </div>

        {onSwapVersions && (
          <button
            type="button"
            onClick={onSwapVersions}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-600 transition-colors shadow-2xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Swap Versions</span>
          </button>
        )}
      </div>

      {/* Code Diff Display */}
      <div className="overflow-x-auto font-mono text-xs p-2">
        <table className="w-full text-left border-collapse">
          <tbody>
            {diffLines.map((line, index) => {
              const isAdd = line.type === 'ADD'
              const isDel = line.type === 'DELETE'

              const rowBg = isAdd
                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                : isDel
                  ? 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                  : 'text-slate-700 dark:text-slate-300'

              const prefix = isAdd ? '+' : isDel ? '-' : ' '

              return (
                <tr key={index} className={`hover:brightness-95 transition-colors ${rowBg}`}>
                  <td className="w-10 py-0.5 px-2 text-right text-[11px] text-slate-400 select-none border-r border-slate-200 dark:border-slate-800 font-mono">
                    {line.oldLineNumber || ''}
                  </td>
                  <td className="w-10 py-0.5 px-2 text-right text-[11px] text-slate-400 select-none border-r border-slate-200 dark:border-slate-800 font-mono">
                    {line.newLineNumber || ''}
                  </td>
                  <td className="w-6 py-0.5 px-1 text-center font-bold select-none">
                    {prefix}
                  </td>
                  <td className="py-0.5 px-2 whitespace-pre-wrap leading-relaxed">
                    {line.content}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
