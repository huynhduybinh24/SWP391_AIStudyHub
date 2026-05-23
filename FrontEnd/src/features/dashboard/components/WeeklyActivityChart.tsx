import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Card, CardTitle } from '@/components/ui/Card'
import type { WeeklyActivityDay } from '@/features/dashboard/types'
import { useTranslation } from '@/context/LanguageContext'

interface WeeklyActivityChartProps {
  data: WeeklyActivityDay[]
  totalHours: number
  trend: string
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 dark:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg border border-slate-700/50">
        <span className="font-bold">{payload[0].value.toFixed(2)}</span> hrs studied
      </div>
    )
  }
  return null
}

export function WeeklyActivityChart({ data, totalHours, trend }: WeeklyActivityChartProps) {
  const { t } = useTranslation()

  // Safely default if data is empty or undefined to prevent crashes
  const chartData = data || []
  const displayHours = typeof totalHours === 'number' ? totalHours : 0
  const displayTrend = trend || ''

  return (
    <section className="col-span-4 space-y-4">
      <CardTitle className="normal-case tracking-normal text-base font-bold text-foreground">
        {t.dashboard.weeklyActivity}
      </CardTitle>
      <Card className="p-5 flex flex-col justify-between min-h-[240px]">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-2xl font-bold text-foreground">
            {t.dashboard.hoursStudied(displayHours)}
          </p>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {displayTrend}
          </span>
        </div>
        
        <div className="h-[140px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }} barCategoryGap="20%">
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} 
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(49, 85, 246, 0.05)', radius: 8 }} />
              <Bar 
                dataKey="hours" 
                fill="#3155F6" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </section>
  )
}
export default WeeklyActivityChart
