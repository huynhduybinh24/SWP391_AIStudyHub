import { Link } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/Card'

interface StorageWidgetProps {
  usedGb: number
  totalGb: number
}

export function StorageWidget({ usedGb, totalGb }: StorageWidgetProps) {
  const percent = Math.round((usedGb / totalGb) * 100)
  const circumference = 2 * Math.PI * 28
  const offset = circumference - (percent / 100) * circumference

  return (
    <section className="col-span-4 space-y-4">
      <CardTitle>Storage</CardTitle>
      <Card className="flex items-center gap-5 p-5">
        <div className="relative size-16 shrink-0">
          <svg className="size-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#e5eeff" strokeWidth="6" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#2563eb"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
            {percent}%
          </span>
        </div>
        <div>
          <p className="text-base text-body">
            {usedGb} GB of {totalGb} GB used
          </p>
          <Link to="/dashboard/storage" className="mt-2 block text-base text-primary hover:underline">
            Manage Storage
          </Link>
        </div>
      </Card>
    </section>
  )
}
