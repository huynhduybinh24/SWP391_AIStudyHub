import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CreateStudyPlanModal } from '../components/CreateStudyPlanModal'
import { STUDY_PLANS } from '../data/mockData'
import { FilterTab } from '../types'
import { StudyPlanCard } from '../components/StudyPlanCard'
import { FilterTabs } from '../components/FilterTabs'
import { StatsStrip } from '../components/StatsStrip'
import { EmptyState } from '../components/EmptyState'

export function StudyPlansPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('All')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredPlans = STUDY_PLANS.filter((plan) => {
    if (activeTab === 'All') return true
    if (activeTab === 'AI Generated') return plan.isAiGenerated
    return plan.status === activeTab
  })

  return (
    <>
      {/* ── Page wrapper ─────────────────────────── */}
      <div className="flex flex-col gap-6 pb-10">

        {/* ── Header ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Study Plans</h1>
            <p className="text-muted mt-1 text-sm">
              Manage your personalized learning journeys and academic goals.
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            className="shrink-0 bg-[#2557E8] hover:bg-[#1d4ed8] text-white shadow-sm"
          >
            <Plus className="size-4" />
            Create Plan
          </Button>
        </div>

        {/* ── Stats strip ──────────────────────────── */}
        <StatsStrip plans={STUDY_PLANS} />

        {/* ── Filter tabs ──────────────────────────── */}
        <FilterTabs active={activeTab} onChange={setActiveTab} />

        {/* ── Plan cards ───────────────────────────── */}
        <div className="flex flex-col gap-4">
          {filteredPlans.length === 0 ? (
            <EmptyState onAdd={() => setIsModalOpen(true)} />
          ) : (
            filteredPlans.map((plan) => (
              <StudyPlanCard key={plan.id} plan={plan} />
            ))
          )}
        </div>
      </div>

      {/* ── Create Study Plan Modal ───────────────── */}
      <CreateStudyPlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
