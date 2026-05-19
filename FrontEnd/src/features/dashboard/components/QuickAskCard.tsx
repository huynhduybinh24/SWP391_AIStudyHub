import { Bot, Send } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function QuickAskCard() {
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
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-body hover:border-primary/30"
          >
            Summarize latest upload
          </button>
          <button
            type="button"
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-body hover:border-primary/30"
          >
            Generate quiz from notes
          </button>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Ask AI anything..." className="flex-1" />
          <Button size="icon" aria-label="Send">
            <Send className="size-4" />
          </Button>
        </div>
      </Card>
    </section>
  )
}
