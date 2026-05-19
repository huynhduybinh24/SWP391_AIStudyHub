import { FileImage, FileText, Link as LinkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Card, CardTitle } from '@/components/ui/Card'
import type { DocumentItem } from '@/features/dashboard/types'
import { cn } from '@/lib/utils'

const iconMap = {
  pdf: { icon: FileText, badge: 'pdf' as const, color: 'text-red-500' },
  word: { icon: FileText, badge: 'word' as const, color: 'text-blue-500' },
  image: { icon: FileImage, badge: 'image' as const, color: 'text-teal-500' },
}

interface RecentDocumentsProps {
  documents: DocumentItem[]
}

export function RecentDocuments({ documents }: RecentDocumentsProps) {
  return (
    <section className="col-span-5 space-y-4">
      <div className="flex items-center justify-between">
        <CardTitle className="normal-case tracking-normal text-base font-bold text-foreground">
          Recent Documents
        </CardTitle>
        <Link to="/documents" className="text-sm text-primary hover:underline">
          View All
        </Link>
      </div>
      <Card className="divide-y divide-border/50">
        {documents.map((doc) => {
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
              <LinkIcon className="size-4 shrink-0 text-muted" />
            </div>
          )
        })}
      </Card>
    </section>
  )
}
