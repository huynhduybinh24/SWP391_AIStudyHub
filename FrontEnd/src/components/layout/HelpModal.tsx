import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { HelpCircle, Bot, BookOpen, Share2, Sparkles, Key } from 'lucide-react'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Study Hub - Help Center"
      description="Quick guide to boost your academic productivity with Focused Intelligence."
      className="max-w-xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex gap-3 p-3.5 rounded-xl border border-border dark:border-slate-800 bg-[#f8f9ff]/50 dark:bg-slate-900/50">
            <Bot className="size-5 text-[#3155F6] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-foreground dark:text-white">AI Chatbot</h4>
              <p className="text-xs text-muted dark:text-slate-400 mt-1">
                Ask questions, summarize documents, and generate quizzes in real-time.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-3.5 rounded-xl border border-border dark:border-slate-800 bg-[#f8f9ff]/50 dark:bg-slate-900/50">
            <BookOpen className="size-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-foreground dark:text-white">Smart Storage</h4>
              <p className="text-xs text-muted dark:text-slate-400 mt-1">
                Upload PDFs, slides, and syllabus files to extract custom study guides.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-3.5 rounded-xl border border-border dark:border-slate-800 bg-[#f8f9ff]/50 dark:bg-slate-900/50">
            <Share2 className="size-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-foreground dark:text-white">Collaboration</h4>
              <p className="text-xs text-muted dark:text-slate-400 mt-1">
                Share document folders and summaries with classmates instantly.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-3.5 rounded-xl border border-border dark:border-slate-800 bg-[#f8f9ff]/50 dark:bg-slate-900/50">
            <Sparkles className="size-5 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-foreground dark:text-white">Study Plans</h4>
              <p className="text-xs text-muted dark:text-slate-400 mt-1">
                Generate tailored calendars and task lists matching your test schedules.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 mb-2.5">
            <Key className="size-4 text-slate-500" />
            <h4 className="text-sm font-bold text-foreground dark:text-slate-200">Useful Shortcuts</h4>
          </div>
          <ul className="space-y-2 text-xs text-muted dark:text-slate-400">
            <li className="flex justify-between items-center">
              <span>Close modals / menus</span>
              <kbd className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono shadow-sm">ESC</kbd>
            </li>
            <li className="flex justify-between items-center">
              <span>Execute document or chat search</span>
              <kbd className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono shadow-sm">Enter</kbd>
            </li>
            <li className="flex justify-between items-center">
              <span>Toggle layout theme (Dark/Light)</span>
              <span className="text-[10px] font-semibold text-[#3155F6]">Top Header Sun/Moon Icon</span>
            </li>
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="rounded-xl border border-border dark:border-slate-800">
            Close
          </Button>
          <Button onClick={() => window.open('/help', '_blank')} className="bg-[#3155F6] hover:bg-[#2563eb] text-white rounded-xl">
            Go to Help Center
          </Button>
        </div>
      </div>
    </Modal>
  )
}
