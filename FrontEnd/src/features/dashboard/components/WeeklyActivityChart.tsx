import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardTitle } from '@/components/ui/Card'
import type { WeeklyActivityDay } from '@/features/dashboard/types'

interface WeeklyActivityChartProps {
  data: WeeklyActivityDay[]
  totalHours: number
  trend: string
}

export function WeeklyActivityChart({ data, totalHours, trend }: WeeklyActivityChartProps) {
  return (
    <section className="col-span-4 space-y-4">
      <CardTitle className="normal-case tracking-normal text-base font-bold text-foreground">
        Weekly Activity
      </CardTitle>
      <Card className="p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-2xl font-bold text-foreground">{totalHours} hrs studied</p>
          <span className="text-sm font-medium text-green-600">{trend}</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} barCategoryGap="20%">
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#737686', fontSize: 12 }} />
            <YAxis hide />
            <Bar dataKey="hours" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </section>
  )
}
