import { useState, useEffect, useRef } from 'react'
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

  return (
    <section className="col-span-4 space-y-4">
      <CardTitle className="normal-case tracking-normal text-base font-bold text-foreground">
        {t.dashboard.weeklyActivity}
      </CardTitle>
      <Card className="p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-2xl font-bold text-foreground">{t.dashboard.hoursStudied(totalHours)}</p>
          <span className="text-sm font-medium text-green-600">{trend}</span>
        </div>
      </Card>
    </section>
  )
}

