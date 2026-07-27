import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileCode,
  ArrowLeft,
} from 'lucide-react'
import { useAiExecutionLogs } from '../hooks/usePrompts'
import { PromptVersionStatusBadge } from '../components/PromptStatusBadge'
import { ExecutionLogDetailModal } from '../components/ExecutionLogDetailModal'
import type { ExecutionStatus, AiExecutionLogSummary } from '../types/prompt'

export function AiExecutionLogListPage() {
  const [searchParams] = useSearchParams()

  const initialPromptCode = searchParams.get('promptCode') || ''

  // Filter state
  const [studentCode, setStudentCode] = useState('')
  const [featureType, setFeatureType] = useState('')
  const [promptCode, setPromptCode] = useState(initialPromptCode)
  const [promptVersion, setPromptVersion] = useState('')
  const [status, setStatus] = useState<ExecutionStatus | ''>('')
  const [page, setPage] = useState(0)

  const [selectedLog, setSelectedLog] = useState<AiExecutionLogSummary | undefined>()

  const filters = {
    studentCode: studentCode.trim() || undefined,
    featureType: featureType.trim() || undefined,
    promptCode: promptCode.trim() || undefined,
    promptVersion: promptVersion.trim() || undefined,
    status: status || undefined,
    page,
    size: 15,
  }

  const { data: pageData, isLoading, isError, error, refetch } = useAiExecutionLogs(filters)

  const logs = pageData?.content || []
  const totalPages = pageData?.totalPages || 0

  const handleResetFilters = () => {
    setStudentCode('')
    setFeatureType('')
    setPromptCode('')
    setPromptVersion('')
    setStatus('')
    setPage(0)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/admin/prompts"
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              AI Execution Audit Logs
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-14">
            Monitor production LLM requests, latency, token usage, and exact prompt version resolution.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
        >
          <RefreshCw className="w-4 h-4 text-blue-500" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Student code..."
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium dark:text-slate-200"
          />

          <input
            type="text"
            placeholder="Feature type (e.g. SUMMARY)..."
            value={featureType}
            onChange={(e) => setFeatureType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium dark:text-slate-200"
          />

          <input
            type="text"
            placeholder="Prompt code (e.g. DOCUMENT_SUMMARY)..."
            value={promptCode}
            onChange={(e) => setPromptCode(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-semibold dark:text-slate-200"
          />

          <input
            type="text"
            placeholder="Prompt version (e.g. v1.0.0)..."
            value={promptVersion}
            onChange={(e) => setPromptVersion(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-medium dark:text-slate-200"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ExecutionStatus | '')}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading execution logs...</p>
        </div>
      ) : isError ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 p-6 rounded-2xl border border-rose-200 dark:border-rose-800 text-center space-y-3 text-rose-700 dark:text-rose-300">
          <p className="text-sm font-semibold">Failed to load execution logs</p>
          <p className="text-xs">{(error as Error)?.message}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Execution Logs Found</p>
          <p className="text-xs text-slate-400">Try adjusting your search parameters.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Log ID / Student</th>
                  <th className="py-3.5 px-4">Feature</th>
                  <th className="py-3.5 px-4">Prompt Code & Version</th>
                  <th className="py-3.5 px-4">LLM Model</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Latency / Tokens</th>
                  <th className="py-3.5 px-4">Started At</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 space-y-0.5">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        #{log.id}
                      </span>
                      <div className="text-slate-500 text-[11px] truncate max-w-[120px]">
                        {log.studentCode || log.userName || `User #${log.userId || 'N/A'}`}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {log.featureType}
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {log.promptCode}
                      </div>
                      <div className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        {log.promptVersion}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {log.llmModel || log.llmProvider || 'Gemini'}
                    </td>

                    <td className="py-3.5 px-4">
                      <PromptVersionStatusBadge status={log.status} />
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 space-y-0.5">
                      <div>{log.latencyMs != null ? `${log.latencyMs} ms` : '-'}</div>
                      <div className="text-[10px] text-slate-400">
                        {log.tokenUsage != null ? `${log.tokenUsage} tok` : '-'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {log.startedAt ? new Date(log.startedAt).toLocaleString() : '-'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <span>
                Page {page + 1} of {totalPages} ({pageData?.totalElements} total logs)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log Detail Popup */}
      <ExecutionLogDetailModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(undefined)}
        log={selectedLog}
      />
    </div>
  )
}
