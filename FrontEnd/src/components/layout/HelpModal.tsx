import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
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

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], label: 'Open global search' },
  { keys: ['Ctrl', 'U'], label: 'Upload new document' },
  { keys: ['Ctrl', '/'], label: 'Open AI chat assistant' },
  { keys: ['Esc'],       label: 'Close any open modal' },
  { keys: ['Ctrl', 'D'], label: 'Go to My Documents' },
  { keys: ['Ctrl', 'H'], label: 'Go to Dashboard home' },
]

const FAQ = [
  {
    q: 'Làm thế nào để upload tài liệu học?',
    a: 'Nhấn nút "Upload New" ở trang Documents, hoặc dùng phím tắt Ctrl + U. Hỗ trợ PDF, DOCX, TXT, PNG, PPTX tối đa 50MB.',
  },
  {
    q: 'AI phân tích tài liệu mất bao lâu?',
    a: 'Thường dưới 30 giây cho tài liệu dưới 10MB. Sau khi xử lý, bạn sẽ thấy badge "ANALYZED" và có thể tạo flashcard, tóm tắt ngay lập tức.',
  },
  {
    q: 'Flashcard và Quiz hoạt động như thế nào?',
    a: 'Mở bất kỳ tài liệu đã phân tích, chọn tab "Flashcards" để ôn bài, hoặc nhấn "Start Quiz" trong trang Subject để làm bài kiểm tra AI tự tạo từ nội dung tài liệu.',
  },
  {
    q: 'Tôi có thể chat với AI về tài liệu không?',
    a: 'Có! Ở mỗi tài liệu, nhấn icon chat (💬) hoặc chọn "Chat with AI" trong menu. AI sẽ trả lời các câu hỏi dựa trên nội dung tài liệu đó.',
  },
  {
    q: 'Giới hạn lưu trữ là bao nhiêu?',
    a: 'Gói Free có 100MB cloud storage. Nâng cấp lên Pro để có 10GB và không giới hạn số tài liệu phân tích AI mỗi tháng.',
  },
]

const QUICK_TIPS = [
  { icon: Upload,        color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',      title: 'Upload & Analyze',  desc: 'Tải tài liệu lên và AI sẽ tự động tạo tóm tắt, flashcard ngay lập tức.', path: '/dashboard/upload' },
  { icon: MessageSquare, color: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400',  title: 'Chat with AI',      desc: 'Hỏi AI về bất kỳ nội dung nào trong tài liệu — như có gia sư riêng 24/7.', path: '/dashboard/chat' },
  { icon: BrainCircuit,  color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',title: 'Practice Quiz',     desc: 'Kiểm tra kiến thức với bộ đề trắc nghiệm AI tạo từ tài liệu của bạn.', path: '/dashboard/quizzes' },
  { icon: BookOpen,      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',    title: 'Flashcards',        desc: 'Ôn tập hiệu quả với hệ thống thẻ flashcard tương tác, lật thẻ xem đáp án.', path: '/dashboard/documents' },
]

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'tips' | 'shortcuts' | 'faq'>('tips')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Help Center"
      description="AI Study Hub — Quick Reference"
      className="max-w-lg"
    >
      <div className="space-y-4 -mt-2">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 -mx-6 px-6">
          {(['tips', 'shortcuts', 'faq'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex items-center gap-1.5 px-1 py-3 mr-5 text-xs font-bold border-b-2 -mb-px transition-all cursor-pointer',
                tab === t
                  ? 'border-[#2563eb] text-[#2563eb]'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              )}
            >
              {t === 'tips' && <Zap className="size-3.5" />}
              {t === 'shortcuts' && <Keyboard className="size-3.5" />}
              {t === 'faq' && <FileText className="size-3.5" />}
              {t === 'tips' ? 'Quick Start' : t === 'shortcuts' ? 'Shortcuts' : 'FAQ'}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="pt-2">
          {/* Quick Tips Tab */}
          {tab === 'tips' && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">4 tính năng cốt lõi</p>
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
                  💡 <strong>Mẹo:</strong> Upload tài liệu và AI sẽ tự tạo tóm tắt + flashcard trong vài giây. Không cần cài đặt gì thêm!
                </p>
              </div>
            </div>
          )}

          {/* Shortcuts Tab */}
          {tab === 'shortcuts' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Keyboard shortcuts</p>
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
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Câu hỏi thường gặp</p>
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
          <p className="text-xs text-slate-400">AI Study Hub v1.0 — SWP391 Project</p>
          <Button
            variant="secondary"
            onClick={onClose}
            className="rounded-xl text-xs font-semibold h-8 px-4"
          >
            Got it!
          </Button>
        </div>
      </div>
    </Modal>
  )
}
