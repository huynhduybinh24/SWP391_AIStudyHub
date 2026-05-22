export type FilterTab = 'All' | 'Active' | 'Completed' | 'Upcoming' | 'AI Generated'

export type ProgressSegment = {
  label: string
  value: number   // 0-100
}

export type Milestone = {
  month: string
  day: number
  title: string
  time: string
}

export type StudyPlan = {
  id: string
  title: string
  description: string
  isAiGenerated: boolean
  status: 'Active' | 'Completed' | 'Upcoming'
  documents: number
  hoursEst: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  overallProgress: number
  segments: ProgressSegment[]
  milestone: Milestone
}
