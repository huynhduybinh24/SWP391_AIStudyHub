import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/stores/authStore'

interface WelcomeBannerProps {
  pendingPlans: number
  newSharedDocuments: number
}

export function WelcomeBanner({ pendingPlans, newSharedDocuments }: WelcomeBannerProps) {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.name.split(' ')[0] ?? 'there'

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
      <div>
        <h2 className="text-[28px] font-bold leading-tight text-foreground">
          Welcome back, {firstName}!
        </h2>
        <p className="mt-1 text-base text-body">
          You have {pendingPlans} study plans pending and {newSharedDocuments} new shared
          documents to review.
        </p>
      </div>
      <Button className="gap-2">
        <Plus className="size-3" />
        New Study Plan
      </Button>
    </Card>
  )
}
