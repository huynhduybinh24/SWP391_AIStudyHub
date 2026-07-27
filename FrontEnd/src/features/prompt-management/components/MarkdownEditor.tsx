import { useState } from 'react'

interface MarkdownEditorProps {
  value: string
  onChange: (val: string) => void
  readOnly?: boolean
}

export function MarkdownEditor({ value, onChange, readOnly = false }: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              activeTab === 'write'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Preview
          </button>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">Markdown (GFM)</span>
      </div>

      {activeTab === 'write' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          rows={14}
          placeholder="# Enter System Prompt template in Markdown..."
          className="w-full p-4 font-mono text-xs bg-slate-900 text-slate-100 dark:bg-slate-950 focus:outline-none resize-y leading-relaxed"
        />
      ) : (
        <div className="p-4 min-h-[300px] prose dark:prose-invert prose-xs max-w-none text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap">
          {value || <span className="text-slate-400 italic">No markdown content.</span>}
        </div>
      )}
    </div>
  )
}
