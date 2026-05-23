import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'
import {
  Upload,
  MessageSquare,
  BrainCircuit,
  BookOpen,
  Zap,
  Keyboard,
  FileText,
  X
} from 'lucide-react'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'tips' | 'shortcuts' | 'faq'>('tips')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { t } = useTranslation()

  const SHORTCUTS = [
    { keys: ['Ctrl', 'K'], label: t.helpCenter.shortcutSearch },
    { keys: ['Ctrl', 'U'], label: t.helpCenter.shortcutUpload },
    { keys: ['Ctrl', '/'], label: t.helpCenter.shortcutChat },
    { keys: ['Esc'],       label: t.helpCenter.shortcutClose },
    { keys: ['Ctrl', 'D'], label: t.helpCenter.shortcutDocs },
    { keys: ['Ctrl', 'H'], label: t.helpCenter.shortcutHome },
  ]

  const FAQ = [
    { q: t.helpCenter.faqQ1, a: t.helpCenter.faqA1 },
    { q: t.helpCenter.faqQ2, a: t.helpCenter.faqA2 },
    { q: t.helpCenter.faqQ3, a: t.helpCenter.faqA3 },
    { q: t.helpCenter.faqQ4, a: t.helpCenter.faqA4 },
    { q: t.helpCenter.faqQ5, a: t.helpCenter.faqA5 },
  ]

  const QUICK_TIPS = [
    { icon: Upload,        color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',      title: t.helpCenter.tipUploadTitle,  desc: t.helpCenter.tipUploadDesc, path: '/dashboard/upload' },
    { icon: MessageSquare, color: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400',  title: t.helpCenter.tipChatTitle,      desc: t.helpCenter.tipChatDesc, path: '/dashboard/chat' },
    { icon: BrainCircuit,  color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',title: t.helpCenter.tipQuizTitle,     desc: t.helpCenter.tipQuizDesc, path: '/dashboard/quizzes' },
    { icon: BookOpen,      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',    title: t.helpCenter.tipFlashTitle,        desc: t.helpCenter.tipFlashDesc, path: '/dashboard/documents' },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.helpCenter.title}
      description={t.helpCenter.subtitle}
      className="max-w-lg"
    >
      <div className="space-y-4 -mt-2">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 -mx-6 px-6">
          {(['tips', 'shortcuts', 'faq'] as const).map((tValue) => (
            <button
              key={tValue}
              onClick={() => setTab(tValue)}
              className={cn(
                'flex items-center gap-1.5 px-1 py-3 mr-5 text-xs font-bold border-b-2 -mb-px transition-all cursor-pointer',
                tab === tValue
                  ? 'border-[#2563eb] text-[#2563eb]'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              )}
            >
              {tValue === 'tips' && <Zap className="size-3.5" />}
              {tValue === 'shortcuts' && <Keyboard className="size-3.5" />}
              {tValue === 'faq' && <FileText className="size-3.5" />}
              {tValue === 'tips' ? t.helpCenter.quickStart : tValue === 'shortcuts' ? t.helpCenter.shortcuts : t.helpCenter.faq}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="pt-2">
          {/* Quick Tips Tab */}
          {tab === 'tips' && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.helpCenter.coreFeatures}</p>
              {QUICK_TIPS.map(({ icon: Icon, color, title, desc, path }) => (
                <button
                  key={title}
                  onClick={() => {
                    navigate(path)
                    onClose()
                  }}
                  className="w-full flex items-start text-left gap-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 hover:border-[#2563eb]/40 dark:hover:border-[#2563eb]/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 group cursor-pointer"
                >
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl group-hover:scale-110 transition-transform', color)}>
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#2563eb] transition-colors">{title}</h4>
                    <p className="mt-0.5 text-xs text-slate-550 dark:text-slate-400 leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-350 transition-colors">{desc}</p>
                  </div>
                </button>
              ))}
              <div className="rounded-xl bg-[#EEF2FF] dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 p-4 flex items-start gap-3 mt-2">
                <BrainCircuit className="size-5 text-[#4F46E5] dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-[#4338CA] dark:text-indigo-300 font-semibold leading-relaxed">
                  {t.helpCenter.tipText}
                </p>
              </div>
            </div>
          )}

          {/* Shortcuts Tab */}
          {tab === 'shortcuts' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.helpCenter.keyboardShortcuts}</p>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {SHORTCUTS.map(({ keys, label }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{label}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((k, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 shadow-sm font-mono"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Tab */}
          {tab === 'faq' && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.helpCenter.faqHeading}</p>
              {FAQ.map(({ q, a }, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-left bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 pr-4">{q}</span>
                    <span className={cn('text-slate-400 shrink-0 transition-transform duration-200', openFaq === idx && 'rotate-45')}>
                      <X className="size-4" />
                    </span>
                  </button>
                  {openFaq === idx && (
                    <div className="px-4 pb-4 pt-2 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 -mx-6 -mb-6 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 rounded-b-2xl">
          <p className="text-xs text-slate-400">{t.helpCenter.footerInfo}</p>
          <Button
            variant="secondary"
            onClick={onClose}
            className="rounded-xl text-xs font-semibold h-8 px-4"
          >
            {t.helpCenter.gotIt}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
