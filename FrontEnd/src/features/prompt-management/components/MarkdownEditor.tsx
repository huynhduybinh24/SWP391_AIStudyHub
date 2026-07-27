import { useState } from 'react'
import { Eye, Edit3, Save, Send, Columns, Lock } from 'lucide-react'
import { PlaceholderInspector } from './PlaceholderInspector'

interface MarkdownEditorProps {
  value: string
  onChange?: (val: string) => void
  readOnly?: boolean
  onSaveDraft?: () => void
  onSubmitReview?: () => void
  isSaving?: boolean
  isSubmitting?: boolean
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  onSaveDraft,
  onSubmitReview,
  isSaving = false,
  isSubmitting = false,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'split' | 'edit' | 'preview'>('split')

  return (
    <div className="space-y-4">
      {/* Header bar with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-md">
        <div className="flex items-center gap-2">
          {readOnly ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg">
              <Lock className="w-3.5 h-3.5" /> Read-Only Mode
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg">
              <Edit3 className="w-3.5 h-3.5" /> Draft Editor
            </span>
          )}
        </div>

        {/* View Switcher Buttons */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('split')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'split' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'edit' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'preview' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="flex items-center gap-2">
            {onSaveDraft && (
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={isSaving || isSubmitting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
              </button>
            )}
            {onSubmitReview && (
              <button
                type="button"
                onClick={onSubmitReview}
                disabled={isSaving || isSubmitting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Review'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Editor Body */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Code / Text Area */}
        {(activeTab === 'split' || activeTab === 'edit') && (
          <div className={`flex flex-col space-y-2 ${activeTab === 'edit' ? 'md:col-span-2' : ''}`}>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Markdown Source
            </label>
            <textarea
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              readOnly={readOnly}
              rows={20}
              placeholder="Type your markdown template here using {{variable}} placeholders..."
              className="w-full font-mono text-sm p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-slate-100 resize-y shadow-xs"
            />
          </div>
        )}

        {/* Rendered Preview */}
        {(activeTab === 'split' || activeTab === 'preview') && (
          <div className={`flex flex-col space-y-2 ${activeTab === 'preview' ? 'md:col-span-2' : ''}`}>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Rendered Preview
            </label>
            <div className="w-full min-h-[460px] p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-auto dark:text-slate-200 prose dark:prose-invert max-w-none text-sm leading-relaxed shadow-xs">
              <pre className="whitespace-pre-wrap font-sans font-normal text-slate-800 dark:text-slate-200">
                {value || <span className="text-slate-400 italic">Markdown content is empty</span>}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Placeholder Inspector */}
      <PlaceholderInspector content={value} />
    </div>
  )
}
