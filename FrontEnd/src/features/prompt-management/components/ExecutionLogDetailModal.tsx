import { Modal } from '@/components/ui/Modal'
import { Link } from 'react-router-dom'
import { PromptVersionStatusBadge } from './PromptStatusBadge'
import { Activity, Clock, Cpu, User, FileText, AlertTriangle, ExternalLink } from 'lucide-react'
import type { AiExecutionLogSummary } from '../types/prompt'

interface ExecutionLogDetailModalProps {
  isOpen: boolean
  onClose: () => void
  log?: AiExecutionLogSummary
}

export function ExecutionLogDetailModal({ isOpen, onClose, log }: ExecutionLogDetailModalProps) {
  if (!log) return null

  const formatJson = (jsonStr?: string) => {
    if (!jsonStr) return 'N/A'
    try {
      const parsed = JSON.parse(jsonStr)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return jsonStr
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`AI Execution Log #${log.id}`}>
      <div className="space-y-5 pt-2 max-h-[80vh] overflow-y-auto pr-1">
        {/* Status Header */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Feature: {log.featureType}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Request ID: {log.requestId || 'N/A'}
              </p>
            </div>
          </div>
          <PromptVersionStatusBadge status={log.status} />
        </div>

        {/* Reported by User Banner */}
        {log.flagged && (
          <div className="p-4 bg-rose-500/10 border-2 border-rose-500/30 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
                <span>REPORTED BY USER (AI ANSWER HAS ISSUE)</span>
              </span>

              {log.promptId && (
                <Link
                  to={`/dashboard/admin/prompts/${log.promptId}/versions/new`}
                  onClick={onClose}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1"
                >
                  <span>Fix Prompt (New Version)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-rose-200 dark:border-rose-900 text-slate-800 dark:text-slate-200">
              <div className="font-semibold text-rose-700 dark:text-rose-300 text-[11px] mb-1">
                Student Report Reason:
              </div>
              <p className="font-medium text-xs whitespace-pre-wrap">{log.reportReason || 'No reason provided.'}</p>
              {log.reportedAt && (
                <div className="text-[10px] text-slate-400 mt-1">
                  Reported on: {new Date(log.reportedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error message if failed */}
        {log.status === 'FAILED' && log.errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Execution Error Message:</span>
            </div>
            <p className="font-mono bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900">
              {log.errorMessage}
            </p>
          </div>
        )}

        {/* Prompt Link & Version info */}
        <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-500" />
              <span>Executed System Prompt</span>
            </span>

            {log.promptId && log.promptVersionId ? (
              <Link
                to={`/dashboard/admin/prompts/${log.promptId}/versions/${log.promptVersionId}`}
                onClick={onClose}
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-500"
              >
                <span>View Exact Prompt Version</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono">
            <div>
              <span className="text-slate-500 block text-[11px]">Prompt Code:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{log.promptCode}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Prompt Version:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{log.promptVersion}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">Student:</span>
            <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
              {log.studentCode || log.userName || `User #${log.userId || 'N/A'}`}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">LLM Model:</span>
            <div className="font-mono font-medium text-slate-800 dark:text-slate-200 truncate">
              {log.llmModel || log.llmProvider || 'Gemini'}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">Latency:</span>
            <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {log.latencyMs != null ? `${log.latencyMs} ms` : 'N/A'}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">Token Usage:</span>
            <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {log.tokenUsage != null ? `${log.tokenUsage} tokens` : 'N/A'}
            </div>
          </div>
        </div>

        {/* AI Output Reference (Raw Response text) */}
        {log.outputReference && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              AI Output Reference (Raw Response)
            </label>
            <div className="p-3 bg-slate-950 text-emerald-400 text-xs font-mono rounded-xl max-h-48 overflow-y-auto whitespace-pre-wrap border border-slate-800">
              {log.outputReference}
            </div>
          </div>
        )}

        {/* Metadata section */}
        {log.inputMetadata && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Input Metadata (JSON)
            </label>
            <pre className="p-3 bg-slate-900 text-slate-200 text-xs font-mono rounded-xl overflow-x-auto max-h-48">
              {formatJson(log.inputMetadata)}
            </pre>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
          <span>Started: {log.startedAt ? new Date(log.startedAt).toLocaleString() : '-'}</span>
          <span>Completed: {log.completedAt ? new Date(log.completedAt).toLocaleString() : '-'}</span>
        </div>
      </div>
    </Modal>
  )
}
