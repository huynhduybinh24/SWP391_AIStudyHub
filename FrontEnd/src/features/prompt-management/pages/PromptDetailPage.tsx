import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  History,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Tag,
  FileCode,
  Edit3,
} from 'lucide-react'
import { usePrompt, usePromptVersions } from '../hooks/usePrompts'
import { PromptActiveBadge, PromptVersionStatusBadge } from '../components/PromptStatusBadge'

export function PromptDetailPage() {
  const { promptId } = useParams<{ promptId: string }>()
  const navigate = useNavigate()

  const { data: prompt, isLoading: isPromptLoading, isError, error } = usePrompt(promptId)
  const { data: versions = [], isLoading: isVersionsLoading } = usePromptVersions(promptId)

  const publishedVersion = versions.find((v) => v.status === 'PUBLISHED')

  if (isPromptLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading prompt details...</p>
      </div>
    )
  }

  if (isError || !prompt) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/40 p-6 rounded-2xl border border-rose-200 dark:border-rose-800 text-center space-y-3 text-rose-700 dark:text-rose-300">
        <p className="text-sm font-semibold">Prompt not found</p>
        <p className="text-xs">{(error as Error)?.message}</p>
        <Link
          to="/dashboard/admin/prompts"
          className="inline-flex items-center gap-1 px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Prompt List</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button & top bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard/admin/prompts"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Prompts</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to={`/dashboard/admin/ai-execution-logs?promptCode=${prompt.code}`}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
          >
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Execution Logs</span>
          </Link>

          <Link
            to={`/dashboard/admin/prompts/${prompt.id}/versions/new`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Version</span>
          </Link>
        </div>
      </div>

      {/* Main Metadata Overview Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{prompt.name}</h1>
              <PromptActiveBadge active={prompt.active} />
            </div>
            <div className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md inline-block">
              {prompt.code}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Category:</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {prompt.category}
            </span>
          </div>
        </div>

        {prompt.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {prompt.description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">Created By:</span>
            <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{prompt.createdByName || 'SYSTEM'}</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">Created At:</span>
            <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{prompt.createdAt ? new Date(prompt.createdAt).toLocaleString() : '-'}</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">Updated By:</span>
            <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{prompt.updatedByName || prompt.createdByName || 'SYSTEM'}</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">Total Versions:</span>
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-500" />
              <span>{versions.length} versions</span>
            </div>
          </div>
        </div>
      </div>

      {/* No Published Version Warning Banner */}
      {!publishedVersion && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-amber-900 dark:text-amber-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">This prompt currently has no published version</span>
            <p className="text-amber-700 dark:text-amber-300">
              AI Prompt Engine cannot execute this prompt until a version is reviewed and published to production.
            </p>
          </div>
        </div>
      )}

      {/* Current Published Version Card */}
      {publishedVersion && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Current Published Version: <span className="font-mono text-emerald-600 dark:text-emerald-400">{publishedVersion.version}</span>
              </h2>
            </div>
            <Link
              to={`/dashboard/admin/prompts/${prompt.id}/versions/${publishedVersion.id}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-500"
            >
              View Full Version Details →
            </Link>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono max-h-60 overflow-y-auto whitespace-pre-wrap dark:text-slate-300">
            {publishedVersion.markdownContent}
          </div>
        </div>
      )}

      {/* Version History Table Summary */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Version History</h3>
          </div>
          <span className="text-xs text-slate-500">Showing {versions.length} versions</span>
        </div>

        {versions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No versions created yet. Click "Create New Version" above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Change Type</th>
                  <th className="py-3 px-4">Summary</th>
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
                        to={`/dashboard/admin/prompts/${prompt.id}/versions/${v.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
