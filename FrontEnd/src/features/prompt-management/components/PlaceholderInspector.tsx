import { useMemo } from 'react'
import { AlertCircle, CheckCircle2, Code2, Tag } from 'lucide-react'

interface PlaceholderInspectorProps {
  content: string
}

export function PlaceholderInspector({ content }: PlaceholderInspectorProps) {
  const { variables, warnings } = useMemo(() => {
    const vars: string[] = []
    const warns: string[] = []
    const regex = /\{\{([^}]+)\}\}/g
    let match: RegExpExecArray | null

    const seen = new Set<string>()

    while ((match = regex.exec(content)) !== null) {
      const raw = match[1].trim()
      if (!raw) {
        warns.push('Empty placeholder found: {{}}')
        continue
      }
      if (!/^[a-zA-Z0-9_]+$/.test(raw)) {
        warns.push(`Invalid placeholder syntax: {{${raw}}}. Only alphanumeric and underscores allowed.`)
      }
      if (seen.has(raw)) {
        // Repeated occurrence - valid, but note if needed
      } else {
        seen.add(raw)
        vars.push(raw)
      }
    }

    // Check for unclosed braces {{
    const openBraces = (content.match(/\{\{/g) || []).length
    const closeBraces = (content.match(/\}\}/g) || []).length
    if (openBraces !== closeBraces) {
      warns.push(`Unmatched braces detected: ${openBraces} opening '{{' vs ${closeBraces} closing '}}'`)
    }

    return { variables: vars, warnings: warns }
  }, [content])

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <Code2 className="w-4 h-4 text-blue-500" />
          <span>Placeholder Inspector</span>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
          {variables.length} variables detected
        </span>
      </div>

      {warnings.length > 0 && (
        <div className="space-y-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Syntax Warnings ({warnings.length})</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {variables.length === 0 ? (
        <div className="text-xs text-slate-400 dark:text-slate-500 italic flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
          <span>No <code>{'{{variable}}'}</code> placeholders found in markdown.</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {variables.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-xs"
            >
              <Tag className="w-3 h-3 text-blue-500" />
              <span>{'{{' + v + '}}'}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
