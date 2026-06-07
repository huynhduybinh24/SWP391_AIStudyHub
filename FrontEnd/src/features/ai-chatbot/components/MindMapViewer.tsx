import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'forest',
  securityLevel: 'loose',
  mindmap: {
    useMaxWidth: true,
  }
})

interface MindMapViewerProps {
  code: string
}

export function MindMapViewer({ code }: MindMapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current || !code) return

    setError(null)
    containerRef.current.innerHTML = ''

    const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`
    
    // Clean up code: remove markdown code block fences if any
    let cleanedCode = code.trim()
    if (cleanedCode.startsWith('```')) {
      cleanedCode = cleanedCode.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '')
    }
    // Double check it has mindmap keyword
    if (!cleanedCode.startsWith('mindmap')) {
      cleanedCode = 'mindmap\n' + cleanedCode
    }

    // Smart sanitization for spaces in node names
    const lines = cleanedCode.split('\n')
    const sanitizedLines = lines.map(line => {
      const match = line.match(/^(\s*)(.*)$/)
      if (!match) return line
      const indent = match[1]
      let content = match[2].trim()
      
      if (!content || content === 'mindmap') return line
      
      // If content has spaces, is not already quoted, and doesn't contain shape brackets
      if (content.includes(' ') && 
          !content.startsWith('"') && 
          !content.endsWith('"') && 
          !content.includes('((') && 
          !content.includes('))') && 
          !content.includes('[') && 
          !content.includes(']') && 
          !content.includes('(') && 
          !content.includes(')') && 
          !content.includes('{') && 
          !content.includes('}')) {
        content = `"${content}"`
      }
      return `${indent}${content}`
    })
    cleanedCode = sanitizedLines.join('\n')

    const renderDiagram = async () => {
      try {
        const { svg } = await mermaid.render(id, cleanedCode)
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
        }
      } catch (err: any) {
        console.error('Mermaid render error:', err)
        setError('Không thể vẽ sơ đồ tư duy. Vui lòng thử lại.')
        const badEl = document.getElementById(id)
        if (badEl) badEl.remove()
      }
    }

    renderDiagram()
  }, [code])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <p className="text-sm font-semibold text-rose-500">{error}</p>
        <pre className="text-left text-xs mt-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-x-auto max-w-full max-h-[150px] font-mono text-slate-500">
          {code}
        </pre>
      </div>
    )
  }

  return (
    <div className="w-full flex justify-center bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-inner overflow-x-auto min-h-[300px]">
      <div ref={containerRef} className="mermaid w-full max-w-full flex justify-center" />
    </div>
  )
}
