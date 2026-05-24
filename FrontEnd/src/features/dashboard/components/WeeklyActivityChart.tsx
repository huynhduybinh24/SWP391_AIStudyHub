import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import type { WeeklyActivityDay } from '@/features/dashboard/types'
import { useTranslation } from '@/context/LanguageContext'
import { BarChart3, TrendingUp, TrendingDown, Clock } from 'lucide-react'

interface WeeklyActivityChartProps {
  data: WeeklyActivityDay[]
  totalHours: number
  trend: string
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/90 dark:bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-2xl text-xs font-semibold shadow-xl border border-white/10 flex items-center gap-2 select-none">
        <Clock className="size-3.5 text-[#3155F6] animate-pulse" />
        <div>
          <span className="font-extrabold text-sm text-white">
            {payload[0].value.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 ml-1">hrs studied</span>
        </div>
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

  const isPositive = !displayTrend.startsWith('-')

  return (
    <section className="col-span-4 space-y-4">
      {/* Premium Header with Icon and Live Indicator */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#3155F6] dark:text-blue-400">
            <BarChart3 className="size-4 stroke-[2.5]" />
          </div>
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight uppercase">
            {t.dashboard.weeklyActivity}
          </h2>
        </div>

        {/* Pulsing Green Active Session Dot */}
        <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/25 dark:border-emerald-500/15 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-400 select-none shadow-sm shadow-emerald-500/5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span>Tracking Live</span>
        </div>
      </div>

      {/* Premium Glassmorphic Card */}
      <Card className="p-6 flex flex-col justify-between min-h-[250px] relative overflow-hidden bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 shadow-lg shadow-slate-100/50 dark:shadow-none hover:shadow-xl dark:hover:border-slate-700/80 transition-all duration-300 rounded-[28px]">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Hours Studied & Trend Pill */}
        <div className="mb-4 flex items-center justify-between relative z-10">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Total Duration
            </p>
            <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              {displayHours.toFixed(1)}
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 ml-1.5">
                hrs studied
              </span>
            </p>
          </div>

          {/* Dynamic Trend Pill Badge */}
          {displayTrend && (
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold select-none ${
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="size-3.5 stroke-[3]" />
              ) : (
                <TrendingDown className="size-3.5 stroke-[3]" />
              )}
              <span>{displayTrend}</span>
            </div>
          )}
        </div>

        {/* High-Fidelity Custom Styled Recharts Bar Chart */}
        <div className="h-[140px] w-full mt-auto relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barCategoryGap="24%">
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3155F6" stopOpacity={1} />
                  <stop offset="60%" stopColor="#4f46e5" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.15} />
                </linearGradient>
                <linearGradient id="barHoverGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
              />
              <YAxis hide />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(49, 85, 246, 0.04)', radius: 10 }}
                animationDuration={200}
              />
              <Bar
                dataKey="hours"
                fill="url(#barGradient)"
                radius={[8, 8, 0, 0]}
                maxBarSize={30}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </section>
  )
}

export default WeeklyActivityChart
