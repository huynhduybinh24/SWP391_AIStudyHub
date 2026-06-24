import { useState } from 'react'
import { Bot, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/context/LanguageContext'

export function QuickAskCard() {
  const { t } = useTranslation()
  const [inputText, setInputText] = useState('')
  const navigate = useNavigate()

  const handleQuickAsk = (prompt: string) => {
    if (!prompt.trim()) return
    navigate('/dashboard/chat', { state: { initialPrompt: prompt } })
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
        {t.dashboard.quickAsk}
      </CardTitle>
      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2 text-primary">
          <Bot className="size-5" />
          <span className="text-sm font-medium text-body">{t.dashboard.aiAssistant}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleQuickAsk(t.dashboard.summarizeLatest)}
            className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:border-blue-500/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {t.dashboard.summarizeLatest}
          </button>
          <button
            type="button"
            onClick={() => handleQuickAsk(t.dashboard.generateQuiz)}
            className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:border-blue-500/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {t.dashboard.generateQuiz}
          </button>
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder={t.aiChatbot.placeholder} 
            className="flex-1"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button 
            size="icon" 
            aria-label={t.aiChatbot.send}
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

