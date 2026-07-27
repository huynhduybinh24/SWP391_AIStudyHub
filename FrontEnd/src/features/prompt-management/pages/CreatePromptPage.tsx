import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, AlertCircle } from 'lucide-react'
import { useCreatePrompt } from '../hooks/usePrompts'
import { MarkdownEditor } from '../components/MarkdownEditor'
import type { PromptCategory } from '../types/prompt'
import { useToast } from '@/components/ui/Toast'

export function CreatePromptPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const createMutation = useCreatePrompt()

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<PromptCategory>('CHAT')
  const [initialMarkdownContent, setInitialMarkdownContent] = useState('')
  const [changeSummary, setChangeSummary] = useState('Initial prompt creation')
  const [changeReason, setChangeReason] = useState('Create new system prompt template')

  const [formError, setFormError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) {
      setFormError('Prompt code is required.')
      return
    }
    if (!/^[A-Z0-9_]+$/.test(cleanCode)) {
      setFormError('Prompt code must contain only uppercase letters, numbers, and underscores.')
      return
    }
    if (!name.trim()) {
      setFormError('Prompt name is required.')
      return
    }
    if (!initialMarkdownContent.trim()) {
      setFormError('Initial markdown content is required.')
      return
    }

    try {
      const created = await createMutation.mutateAsync({
        code: cleanCode,
        name: name.trim(),
        description: description.trim(),
        category,
        initialMarkdownContent: initialMarkdownContent.trim(),
        changeSummary: changeSummary.trim(),
        changeReason: changeReason.trim(),
      })

      toast.success(`Prompt ${created.code} created successfully!`)
      navigate(`/dashboard/admin/prompts/${created.id}`)
    } catch (err: any) {
      setFormError(err.message || 'Failed to create prompt.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard/admin/prompts"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Prompts</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Create New System Prompt
            </h1>
          </div>

          {formError && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Prompt Code (UPPER_SNAKE_CASE) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. DOCUMENT_SUMMARY"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full font-mono text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-slate-200 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Prompt Display Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Document Summary Generator"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-slate-200 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PromptCategory)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-slate-200 font-medium"
              >
                <option value="CHAT">CHAT (Hỏi đáp / Chatbot)</option>
                <option value="GENERATION">GENERATION (Tạo nội dung / Quiz)</option>
                <option value="ACADEMIC">ACADEMIC (Học thuật)</option>
                <option value="EVALUATION">EVALUATION (Chấm điểm / Đánh giá)</option>
                <option value="MODERATION">MODERATION (Kiểm duyệt)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Description</label>
              <input
                type="text"
                placeholder="Brief description of purpose..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-slate-200 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Initial Markdown Content Editor */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Initial Version (v1.0.0 DRAFT) Markdown Content
          </h2>
          <MarkdownEditor
            value={initialMarkdownContent}
            onChange={setInitialMarkdownContent}
          />
        </div>

        {/* Submit action */}
        <div className="flex items-center justify-end gap-3">
          <Link
            to="/dashboard/admin/prompts"
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
          >
            {createMutation.isPending ? 'Creating Prompt...' : 'Create Prompt & Initial Version'}
          </button>
        </div>
      </form>
    </div>
  )
}
