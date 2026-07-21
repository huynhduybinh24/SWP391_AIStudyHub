import { useEffect, useRef, useState } from 'react'
// @ts-ignore
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
  const [error, setError] = useState<{ message: string; originalCode: string; sanitizedCode: string } | null>(null)

  useEffect(() => {
    if (!containerRef.current || !code) return

    setError(null)
    containerRef.current.innerHTML = ''

    const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`
    
    // Clean up code: remove markdown code block fences if any
    let cleanedCode = code.trim()
    cleanedCode = cleanedCode.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '')

    // Replace ampersands (&) with 'and' to prevent Mermaid's double-encoding SVG render bug
    cleanedCode = cleanedCode.replace(/&amp;/gi, 'and').replace(/&/g, 'and')

    // Double check it has mindmap keyword
    if (!cleanedCode.trim().toLowerCase().startsWith('mindmap')) {
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
      
      let matched = false
      
      // 1. Shapes with ID prefix (e.g. root((Text)))
      for (const pattern of [
        { regex: /^([a-zA-Z0-9_-]+)\s*\(\((.*)\)\)$/, format: (id: string, text: string) => `${id}((${text}))` },
        { regex: /^([a-zA-Z0-9_-]+)\s*\{\{(.*)\\}\}$/, format: (id: string, text: string) => `${id}{{${text}}}` },
        { regex: /^([a-zA-Z0-9_-]+)\s*\[(.*)\]$/, format: (id: string, text: string) => `${id}[${text}]` },
        { regex: /^([a-zA-Z0-9_-]+)\s*\((.*)\)$/, format: (id: string, text: string) => `${id}(${text})` },
        { regex: /^([a-zA-Z0-9_-]+)\s*\{(.*)\}$/, format: (id: string, text: string) => `${id}{${text}}` },
        { regex: /^([a-zA-Z0-9_-]+)\s*\)(.*)\($/, format: (id: string, text: string) => `${id})${text}(` }
      ]) {
        const m = content.match(pattern.regex)
        if (m) {
          const id = m[1]
          let innerText = m[2].trim()
          if (innerText.includes(' ') && !innerText.startsWith('"') && !innerText.endsWith('"')) {
            innerText = `"${innerText}"`
          }
          content = pattern.format(id, innerText)
          matched = true
          break
        }
      }

      // 2. Shapes without ID prefix (e.g. ((Text)))
      if (!matched) {
        for (const pattern of [
          { regex: /^\(\((.*)\)\)$/, format: (text: string) => `((${text}))` },
          { regex: /^\{\{(.*)\\}\}$/, format: (text: string) => `{{${text}}}` },
          { regex: /^\[(.*)\]$/, format: (text: string) => `[${text}]` },
          { regex: /^\((.*)\)$/, format: (text: string) => `(${text})` },
          { regex: /^\{(.*)\}$/, format: (text: string) => `{${text}}` },
          { regex: /^\)(.*)\($/, format: (text: string) => `)${text}(` }
        ]) {
          const m = content.match(pattern.regex)
          if (m) {
            let innerText = m[1].trim()
            if (innerText.includes(' ') && !innerText.startsWith('"') && !innerText.endsWith('"')) {
              innerText = `"${innerText}"`
            }
            content = pattern.format(innerText)
            matched = true
            break
          }
        }
      }
      
      // 3. Fallback for nodes without shapes
      if (!matched && !content.startsWith('"') && !content.endsWith('"')) {
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
        setError({
          message: err?.message || String(err),
          originalCode: code,
          sanitizedCode: cleanedCode
        })
        const badEl = document.getElementById(id)
        if (badEl) badEl.remove()
      }
    }

    renderDiagram()
  }, [code])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <p className="text-sm font-semibold text-rose-500">Không thể vẽ sơ đồ tư duy. Vui lòng thử lại.</p>
        <p className="text-[11px] text-rose-450 mt-1 font-mono text-left w-full break-words max-h-[80px] overflow-y-auto bg-rose-50/30 p-2 rounded-lg border border-rose-100/20">
          Lỗi: {error.message}
        </p>
        <div className="text-left text-xs mt-3 w-full">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Mã nguồn đã xử lý:</span>
          <pre className="mt-1 p-3 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-x-auto max-w-full max-h-[150px] font-mono text-slate-500">
            {error.sanitizedCode}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex justify-center bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-inner overflow-x-auto min-h-[300px]">
      <div ref={containerRef} className="mermaid w-full max-w-full flex justify-center" />
    </div>
  )
}
