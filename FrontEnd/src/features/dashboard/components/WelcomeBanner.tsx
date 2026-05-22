import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useProfileStore } from '@/features/profile/stores/profileStore'

interface WelcomeBannerProps {
  pendingPlans: number
  newSharedDocuments: number
  onNewPlanClick?: () => void
}

export function WelcomeBanner({ pendingPlans, newSharedDocuments, onNewPlanClick }: WelcomeBannerProps) {
  const { profile } = useProfileStore()
  const firstName = profile?.name?.split(' ')[0] || 'there'

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
      <Button className="gap-2" onClick={onNewPlanClick}>
        <Plus className="size-3" />
        New Study Plan
      </Button>
    </Card>
  )
}
