import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, GitBranch, AlertCircle } from 'lucide-react'
import { usePrompt, usePromptVersions, useCreatePromptVersion } from '../hooks/usePrompts'
import { MarkdownEditor } from '../components/MarkdownEditor'
import type { ChangeType } from '../types/prompt'
import { useToast } from '@/components/ui/Toast'

export function CreatePromptVersionPage() {
  const { promptId } = useParams<{ promptId: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const { data: prompt, isLoading: isPromptLoading } = usePrompt(promptId)
  const { data: versions = [] } = usePromptVersions(promptId)
  const createVersionMutation = useCreatePromptVersion()

  const [basedOnVersionId, setBasedOnVersionId] = useState<string>('')
  const [markdownContent, setMarkdownContent] = useState('')
  const [changeType, setChangeType] = useState<ChangeType>('PATCH')
  const [changeSummary, setChangeSummary] = useState('')
  const [changeReason, setChangeReason] = useState('')
  const [formError, setFormError] = useState('')

  // Pre-fill markdown from selected base version
  useEffect(() => {
    if (versions.length > 0) {
      const published = versions.find((v) => v.status === 'PUBLISHED')
      const base = published || versions[0]
      if (base) {
        setBasedOnVersionId(String(base.id))
        setMarkdownContent(base.markdownContent)
      }
    }
  }, [versions])

  const handleBaseVersionChange = (idStr: string) => {
    setBasedOnVersionId(idStr)
    const found = versions.find((v) => String(v.id) === idStr)
    if (found) {
      setMarkdownContent(found.markdownContent)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!markdownContent.trim()) {
      setFormError('Markdown content cannot be empty.')
      return
    }
    if (!changeSummary.trim()) {
      setFormError('Change summary is required.')
      return
    }
    if (!changeReason.trim()) {
      setFormError('Change reason is required.')
      return
    }

    try {
      const newVersion = await createVersionMutation.mutateAsync({
        promptId: promptId!,
        data: {
          markdownContent: markdownContent.trim(),
          changeType,
          changeSummary: changeSummary.trim(),
          changeReason: changeReason.trim(),
          basedOnVersionId: basedOnVersionId ? Number(basedOnVersionId) : undefined,
        },
      })

      toast.success(`New draft version ${newVersion.version} created successfully!`)
      navigate(`/dashboard/admin/prompts/${promptId}/versions/${newVersion.id}`)
    } catch (err: any) {
      setFormError(err.message || 'Failed to create new version.')
    }
  }

  if (isPromptLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading prompt...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to={`/dashboard/admin/prompts/${promptId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {prompt?.name || 'Prompt Detail'}</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <GitBranch className="w-5 h-5 text-blue-500" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Create New Version for {prompt?.name}
              </h1>
              <p className="text-xs text-slate-400 font-mono">{prompt?.code}</p>
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Base Content Source
              </label>
              <select
                value={basedOnVersionId}
                onChange={(e) => handleBaseVersionChange(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-slate-200"
              >
                <option value="">-- Blank Content --</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    Version {v.version} ({v.status}) - {v.changeSummary}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Change Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={changeType}
                onChange={(e) => setChangeType(e.target.value as ChangeType)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold dark:text-slate-200"
              >
                <option value="PATCH">PATCH - Bugfix / Minor wording update</option>
                <option value="MINOR">MINOR - Variable addition / Feature update</option>
                <option value="MAJOR">MAJOR - Complete prompt rewrite / Structural change</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Change Summary <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Short summary of what changed..."
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-slate-200"
              />
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Change Reason <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Detailed rationale for this version update..."
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Markdown Editor */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Markdown Template Content
          </h2>
          <MarkdownEditor value={markdownContent} onChange={setMarkdownContent} />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            to={`/dashboard/admin/prompts/${promptId}`}
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createVersionMutation.isPending}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
          >
            {createVersionMutation.isPending ? 'Saving Version...' : 'Save as DRAFT Version'}
          </button>
        </div>
      </form>
    </div>
  )
}
