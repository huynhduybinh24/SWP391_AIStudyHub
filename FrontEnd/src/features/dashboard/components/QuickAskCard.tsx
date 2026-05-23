import { useState } from 'react'
import { Bot, Send } from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function QuickAskCard() {
  const [inputText, setInputText] = useState('')
  const setChatPopupOpen = useUiStore((s) => s.setChatPopupOpen)
  const setInitialChatMessage = useUiStore((s) => s.setInitialChatMessage)

  const handleQuickAsk = (prompt: string) => {
    if (!prompt.trim()) return
    setInitialChatMessage(prompt)
    setChatPopupOpen(true)
    setInputText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleQuickAsk(inputText)
    }
  }

  return (
    <section className="col-span-4 space-y-4">
      <CardTitle className="normal-case tracking-normal text-base font-bold text-foreground">
        Quick Ask
      </CardTitle>
      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2 text-primary">
          <Bot className="size-5" />
          <span className="text-sm font-medium text-body">AI Assistant</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleQuickAsk('Summarize latest upload')}
            className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:border-blue-500/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Summarize latest upload
          </button>
          <button
            type="button"
            onClick={() => handleQuickAsk('Generate quiz from notes')}
            className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:border-blue-500/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Generate quiz from notes
          </button>
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Ask AI anything..." 
            className="flex-1"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button 
            size="icon" 
            aria-label="Send"
            onClick={() => handleQuickAsk(inputText)}
            disabled={!inputText.trim()}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </Card>
    </section>
  )
}
