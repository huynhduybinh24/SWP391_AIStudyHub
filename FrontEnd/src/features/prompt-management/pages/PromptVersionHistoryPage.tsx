import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, History, Plus, GitCompare, RotateCcw } from 'lucide-react'
import { usePrompt, usePromptVersions } from '../hooks/usePrompts'
import { PromptVersionStatusBadge } from '../components/PromptStatusBadge'

export function PromptVersionHistoryPage() {
  const { promptId } = useParams<{ promptId: string }>()
  const { data: prompt } = usePrompt(promptId)
  const { data: versions = [], isLoading } = usePromptVersions(promptId)

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading version history...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to={`/dashboard/admin/prompts/${promptId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {prompt?.name || 'Prompt Detail'}</span>
        </Link>

        <Link
          to={`/dashboard/admin/prompts/${promptId}/versions/new`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Version</span>
        </Link>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-500" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Full Version History: {prompt?.name} ({prompt?.code})
            </h1>
          </div>
          <span className="text-xs text-slate-500 font-medium">{versions.length} total versions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Change Type</th>
                <th className="py-3 px-4">Change Summary</th>
                <th className="py-3 px-4">Created By</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {versions.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {v.version}
                  </td>
                  <td className="py-3.5 px-4">
                    <PromptVersionStatusBadge status={v.status} />
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    {v.changeType}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {v.changeSummary}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {v.createdByName || 'SYSTEM'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(v.createdAt!).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Link
                      to={`/dashboard/admin/prompts/${promptId}/versions/${v.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      View
                    </Link>

                    {v.previousVersionId && (
                      <Link
                        to={`/dashboard/admin/prompts/${promptId}/diff?fromVersionId=${v.previousVersionId}&toVersionId=${v.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 text-xs font-semibold rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
                      >
                        <GitCompare className="w-3 h-3" />
                        <span>Diff</span>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
