import { GitCompare, Plus, Minus, Equal, ArrowRightLeft } from 'lucide-react'
import type { PromptDiffResponse } from '../types/prompt'

interface DiffViewerProps {
  diff: PromptDiffResponse
  onSwapVersions?: () => void
}

export function DiffViewer({ diff, onSwapVersions }: DiffViewerProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm space-y-0">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{diff.promptName || diff.promptCode}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                {diff.promptCode}
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Comparing version <span className="text-blue-400 font-semibold">{diff.fromVersionNumber}</span> →{' '}
              <span className="text-emerald-400 font-semibold">{diff.toVersionNumber}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Counters */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
              <Plus className="w-3.5 h-3.5" /> +{diff.additionsCount}
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold">
              <Minus className="w-3.5 h-3.5" /> -{diff.deletionsCount}
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400">
              <Equal className="w-3.5 h-3.5" /> {diff.unchangedCount}
            </span>
          </div>

          {onSwapVersions && (
            <button
              type="button"
              onClick={onSwapVersions}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
              title="Swap From and To versions"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Swap</span>
            </button>
          )}
        </div>
      </div>

      {/* Diff Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <th className="w-12 py-2 px-3 text-right font-medium select-none border-r border-slate-200 dark:border-slate-800">Old</th>
              <th className="w-12 py-2 px-3 text-right font-medium select-none border-r border-slate-200 dark:border-slate-800">New</th>
              <th className="w-8 py-2 text-center font-medium select-none">+/-</th>
              <th className="py-2 px-4 text-left font-medium">Content</th>
            </tr>
          </thead>
          <tbody>
            {diff.diffLines.map((line, idx) => {
              const isAdd = line.type === 'ADD'
              const isDelete = line.type === 'DELETE'

              return (
                <tr
                  key={idx}
                  className={`border-b border-slate-100 dark:border-slate-800/40 transition-colors ${
                    isAdd
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                      : isDelete
                      ? 'bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <td className="w-12 py-1 px-3 text-right text-slate-400 dark:text-slate-500 select-none border-r border-slate-200/60 dark:border-slate-800/60">
                    {line.oldLineNumber ?? ''}
                  </td>
                  <td className="w-12 py-1 px-3 text-right text-slate-400 dark:text-slate-500 select-none border-r border-slate-200/60 dark:border-slate-800/60">
                    {line.newLineNumber ?? ''}
                  </td>
                  <td className="w-8 py-1 text-center font-bold select-none">
                    {isAdd ? (
                      <span className="text-emerald-600 dark:text-emerald-400">+</span>
                    ) : isDelete ? (
                      <span className="text-rose-600 dark:text-rose-400">-</span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600"> </span>
                    )}
                  </td>
                  <td className="py-1 px-4 whitespace-pre-wrap leading-relaxed">
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
