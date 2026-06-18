import { useState } from 'react'
import { FileImage, FileText, Link as LinkIcon, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Card, CardTitle } from '@/components/ui/Card'
import type { DocumentItem } from '@/features/dashboard/types'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

const iconMap = {
  pdf: { icon: FileText, badge: 'pdf' as const, color: 'text-red-500' },
  word: { icon: FileText, badge: 'word' as const, color: 'text-blue-500' },
  image: { icon: FileImage, badge: 'image' as const, color: 'text-teal-500' },
}

function CopyLinkButton({ docId }: { docId: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/dashboard/documents/${docId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground"
      title={t.common.copyLink}
    >
      {copied ? <Check className="size-4 text-green-500" /> : <LinkIcon className="size-4" />}
    </button>
  )
}

interface RecentDocumentsProps {
  documents: DocumentItem[]
}

export function RecentDocuments({ documents }: RecentDocumentsProps) {
  const { t } = useTranslation()

  return (
    <section className="col-span-5 space-y-4">
      <div className="flex items-center justify-between">
        <CardTitle className="normal-case tracking-normal text-base font-bold text-foreground">
          {t.dashboard.recentDocuments}
        </CardTitle>
        <Link to="/dashboard/documents" className="text-sm text-primary hover:underline">
          {t.dashboard.viewAll}
        </Link>
      </div>
      <Card className="divide-y divide-slate-200 dark:divide-slate-800">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
            <p className="text-sm font-medium">{t.dashboard.noDocs}</p>
            <p className="text-xs mt-1 text-slate-400 dark:text-slate-500">{t.dashboard.uploadPrompt}</p>
          </div>
        ) : (
          documents.map((doc) => {
            const meta = iconMap[doc.type]
            const Icon = meta.icon
            return (
              <div key={doc.id} className="flex items-center gap-3 px-5 py-4">
                <Icon className={cn('size-5 shrink-0', meta.color)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium text-foreground">{doc.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={meta.badge}>{doc.course}</Badge>
                    <span className="text-sm text-muted">{doc.timestamp}</span>
                  </div>
                </div>
                <CopyLinkButton docId={doc.id} />
              </div>
            )
          })
        )}
      </Card>
    </section>
  )
}

