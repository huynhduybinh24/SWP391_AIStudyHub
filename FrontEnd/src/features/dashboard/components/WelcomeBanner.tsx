import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useProfileStore } from '@/features/profile/stores/profileStore'
import { useTranslation } from '@/context/LanguageContext'

interface WelcomeBannerProps {
  pendingPlans: number
  newSharedDocuments: number
  onNewPlanClick?: () => void
}

export function WelcomeBanner({ pendingPlans, newSharedDocuments, onNewPlanClick }: WelcomeBannerProps) {
  const { profile } = useProfileStore()
  const { t } = useTranslation()
  const firstName = profile?.name?.split(' ')[0] || 'there'

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
      <div>
        <h2 className="text-[28px] font-bold leading-tight text-foreground">
          {t.dashboard.title} {firstName}!
        </h2>
        <p className="mt-1 text-base text-body">
          {t.dashboard.welcomeSubtitle(pendingPlans, newSharedDocuments)}
        </p>
      </div>
      <Button className="gap-2" onClick={onNewPlanClick}>
        <Plus className="size-3" />
        {t.dashboard.newStudyPlan}
      </Button>
    </Card>
  )
}

