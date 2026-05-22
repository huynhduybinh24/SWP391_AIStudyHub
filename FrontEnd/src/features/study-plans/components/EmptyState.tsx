import { BookOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e5eeff] bg-white py-16 px-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e5eeff]">
        <BookOpen className="size-8 text-[#2557E8]" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-foreground">No study plans found</h3>
      <p className="mt-2 text-sm text-muted max-w-xs">
        Create your first study plan to organize your learning journey and track your progress.
      </p>
      <Button
        onClick={onAdd}
        variant="primary"
        className="mt-6 bg-[#2557E8] hover:bg-[#1d4ed8] text-white"
      >
        <Plus className="size-4" /> Create Study Plan
      </Button>
    </div>
  )
}
