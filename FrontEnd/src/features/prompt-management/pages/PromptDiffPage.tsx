import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, GitCompare, ArrowRightLeft } from 'lucide-react'
import { usePrompt, usePromptVersions, usePromptDiff } from '../hooks/usePrompts'
import { DiffViewer } from '../components/DiffViewer'

export function PromptDiffPage() {
  const { promptId } = useParams<{ promptId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: prompt } = usePrompt(promptId)
  const { data: versions = [] } = usePromptVersions(promptId)

  const initialFrom = searchParams.get('fromVersionId') || ''
  const initialTo = searchParams.get('toVersionId') || ''

  const [fromVersionId, setFromVersionId] = useState<string>(initialFrom)
  const [toVersionId, setToVersionId] = useState<string>(initialTo)

  // Auto-set default versions if not provided in URL
  useEffect(() => {
    if (versions.length >= 2 && (!fromVersionId || !toVersionId)) {
      const sorted = [...versions].sort((a, b) => a.id - b.id)
      const toVer = sorted[sorted.length - 1]
      const fromVer = sorted[sorted.length - 2]
      setFromVersionId(String(fromVer.id))
      setToVersionId(String(toVer.id))
    } else if (versions.length === 1 && (!fromVersionId || !toVersionId)) {
      setFromVersionId(String(versions[0].id))
      setToVersionId(String(versions[0].id))
    }
  }, [versions])

  const { data: diff, isLoading, isError, error } = usePromptDiff(
    promptId,
    fromVersionId,
    toVersionId,
  )

  const handleSwap = () => {
    const temp = fromVersionId
    setFromVersionId(toVersionId)
    setToVersionId(temp)
    setSearchParams({ fromVersionId: toVersionId, toVersionId: temp })
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to={`/dashboard/admin/prompts/${promptId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {prompt?.name || 'Prompt Detail'}</span>
        </Link>
      </div>

      {/* Version Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <GitCompare className="w-5 h-5 text-blue-500" />
          <h1 className="text-base font-bold text-slate-900 dark:text-white">
            Compare Prompt Versions ({prompt?.code})
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400">From Version (Original)</label>
            <select
              value={fromVersionId}
              onChange={(e) => {
                setFromVersionId(e.target.value)
                setSearchParams({ fromVersionId: e.target.value, toVersionId })
              }}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-semibold dark:text-slate-200"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  Version {v.version} ({v.status}) - {v.changeSummary}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSwap}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 self-end sm:self-center transition-colors"
            title="Swap From and To"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <div className="space-y-1">
            <label className="font-semibold text-slate-600 dark:text-slate-400">To Version (Modified)</label>
            <select
              value={toVersionId}
              onChange={(e) => {
                setToVersionId(e.target.value)
                setSearchParams({ fromVersionId, toVersionId: e.target.value })
              }}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-semibold dark:text-slate-200"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  Version {v.version} ({v.status}) - {v.changeSummary}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Diff Output */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Computing version diff...</p>
        </div>
      ) : isError || !diff ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 p-6 rounded-2xl border border-rose-200 dark:border-rose-800 text-center space-y-2 text-rose-700 dark:text-rose-300 text-xs">
          <p className="font-bold">Failed to load version diff</p>
          <p>{(error as Error)?.message || 'Please select valid versions.'}</p>
        </div>
      ) : (
        <DiffViewer diff={diff} onSwapVersions={handleSwap} />
      )}
    </div>
  )
}
