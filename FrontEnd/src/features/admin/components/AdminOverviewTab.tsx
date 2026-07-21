import { useState, useEffect, useMemo } from 'react'
import {
  Users,
  Zap,
  Database,
  TrendingUp,
  Sparkles,
  FileText
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Card, CardContent } from '@/components/ui/Card'
import { useTheme } from '@/features/settings/components/ThemeProvider'
import { useTranslation } from '@/context/LanguageContext'

// Custom tooltip for registrations line chart
const RegistrationsTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md text-white px-3.5 py-2.5 rounded-2xl text-xs font-semibold shadow-xl border border-white/10 flex items-center gap-2.5 select-none animate-fade-in">
        <Users className="size-4 text-blue-400 animate-pulse" />
        <div>
          <span className="font-extrabold text-sm text-white">
            +{payload[0].value}
          </span>
          <span className="text-[10px] text-slate-400 ml-1.5 font-medium">new users</span>
        </div>
      </div>
    )
  }
  return null
}

// Custom tooltip for storage pie chart
const StoragePieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-slate-900 dark:bg-slate-950 text-white px-4 py-3 rounded-[12px] shadow-xl border border-white/10 flex flex-col gap-1.5 select-none animate-fade-in min-w-[180px] z-[100]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
          <span className="font-bold text-white text-[13px] leading-tight">{data.name}</span>
        </div>
        <div className="text-[12px] text-slate-300 pl-4.5 font-medium flex items-center mt-0.5">
          <span>{data.value} PDF Files</span>
          <span className="mx-2 text-slate-500">•</span>
          <span className="text-emerald-400 font-bold">{data.percentage}%</span>
        </div>
      </div>
    )
  }
  return null
}

import { AdminStats, AdminUser, AdminDocument } from '../services/adminService'

export function AdminOverviewTab({
  stats,
  users: _users,
  documents: _documents
}: {
  stats: AdminStats | null
  users: AdminUser[]
  documents: AdminDocument[]
}) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const { t, language } = useTranslation()
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>(undefined)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 200)
    return () => clearTimeout(timer)
  }, [])

  // Line Chart Data: New registrations per day (last 7 days from DB)
  const registrationsData = useMemo(() => {
    const counts = stats?.newRegistrationsLast7Days || [0, 0, 0, 0, 0, 0, 0]
    const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const viWeekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    const today = new Date()
    return counts.map((count, i) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - i))
      const dayIndex = date.getDay()
      const label = language === 'vi' ? (viWeekdayLabels[dayIndex]) : (weekdayLabels[dayIndex])
      return { day: label, count: Number(count) }
    })
  }, [stats, language])

  // Pie Chart Data: AI PDF Processing Status Distribution (real data & fallback)
  const storageData = useMemo(() => {
    let analyzedCount = 0
    let pendingCount = 0
    let flaggedCount = 0
    let standardCount = 0

    if (_documents.length > 0) {
      analyzedCount = _documents.filter(d => d.aiStatus === 'analyzed' && !d.isFlagged && d.status === 'approved').length
      pendingCount = _documents.filter(d => d.status === 'pending').length
      flaggedCount = _documents.filter(d => d.isFlagged || d.status === 'rejected').length
      standardCount = Math.max(0, _documents.length - (analyzedCount + pendingCount + flaggedCount))
    } else if (stats) {
      pendingCount = stats.pendingDocuments || 0
      flaggedCount = stats.flaggedDocuments || 0
      analyzedCount = stats.aiProcessedDocuments || Math.max(0, stats.totalDocuments - pendingCount - flaggedCount)
      standardCount = Math.max(0, stats.totalDocuments - analyzedCount - pendingCount - flaggedCount)
    }

    const total = (analyzedCount + pendingCount + flaggedCount + standardCount) || 1
    const pct = (v: number) => Math.round((v / total) * 100)

    return [
      { name: language === 'vi' ? '✨ Đã phân tích AI' : '✨ AI Analyzed', value: analyzedCount, percentage: pct(analyzedCount), color: '#3b82f6' },
      { name: language === 'vi' ? '⏳ Đang chờ kiểm duyệt' : '⏳ Pending Review', value: pendingCount, percentage: pct(pendingCount), color: '#f59e0b' },
      { name: language === 'vi' ? '🚫 Bị từ chối / Gắn cờ' : '🚫 Flagged & Rejected', value: flaggedCount, percentage: pct(flaggedCount), color: '#ef4444' },
      { name: language === 'vi' ? '📚 PDF Lưu trữ cơ bản' : '📚 Standard PDF', value: standardCount, percentage: pct(standardCount), color: '#10b981' }
    ]
  }, [stats, _documents, language])

  const storageUsedMb = useMemo(() => {
    if (_documents && _documents.length > 0) {
      const docSum = _documents.reduce((acc, d) => acc + (d.sizeMB || 0), 0)
      if (docSum > 0) return docSum
    }
    if (stats && stats.storageUsedGB) {
      return stats.storageUsedGB * 1024
    }
    return 0
  }, [stats, _documents])

  const usedPercentText = useMemo(() => {
    if (storageUsedMb <= 0 || !stats || !stats.storageLimitGB) return '0%'
    const limitMb = stats.storageLimitGB * 1024
    const rawPct = (storageUsedMb / limitMb) * 100
    if (rawPct > 0 && rawPct < 0.1) {
      return `${rawPct.toFixed(2)}%`
    }
    return `${rawPct.toFixed(1)}%`
  }, [storageUsedMb, stats])

  const progressBarWidth = useMemo(() => {
    if (storageUsedMb <= 0 || !stats || !stats.storageLimitGB) return 0
    const limitMb = stats.storageLimitGB * 1024
    const rawPct = (storageUsedMb / limitMb) * 100
    return Math.min(100, Math.max(rawPct, 2.5))
  }, [storageUsedMb, stats])

  const capacityText = useMemo(() => {
    if (!stats || !stats.storageLimitGB) return '0 GB'
    const limitGB = stats.storageLimitGB
    if (limitGB >= 1024) {
      return `${(limitGB / 1024).toFixed(1)} TB`
    }
    return `${limitGB.toFixed(1)} GB`
  }, [stats])

  const formattedUsedCapacity = useMemo(() => {
    if (storageUsedMb < 1024) {
      return `${storageUsedMb.toFixed(1)} MB`
    }
    return `${(storageUsedMb / 1024).toFixed(2)} GB`
  }, [storageUsedMb])

  const proPercentage = useMemo(() => {
    if (!stats || !stats.totalUsers) return '0%'
    return `${((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1)}%`
  }, [stats])

  const totalPdfCount = useMemo(() => {
    return storageData.reduce((acc, curr) => acc + curr.value, 0)
  }, [storageData])

  return (
    <div className="space-y-6">
      {/* 4 KPI Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Total Users */}
        <Card className="relative overflow-hidden group hover:shadow-lg dark:hover:border-slate-700/80 transition-all duration-300 rounded-[24px]">
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {t.admin.totalUsers}
                </p>
                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  {stats?.totalUsers || 0}
                </h4>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Users className="size-5" />
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-1.5 text-xs">
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                <TrendingUp className="size-3.5" />
                +12%
              </span>
              <span className="text-slate-400 dark:text-slate-500 font-medium">
                {t.admin.timePeriod}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Premium Users */}
        <Card className="relative overflow-hidden group hover:shadow-lg dark:hover:border-slate-700/80 transition-all duration-300 rounded-[24px]">
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {t.admin.premiumUsers}
                </p>
                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  {stats?.premiumUsers || 0}
                </h4>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400">
                <Zap className="size-5" />
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-1.5 text-xs">
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10">
                <Sparkles className="size-3.5" />
                {proPercentage}
              </span>
              <span className="text-slate-400 dark:text-slate-500 font-medium">
                {t.admin.proAccounts}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Used Capacity */}
        <Card className="relative overflow-hidden group hover:shadow-lg dark:hover:border-slate-700/80 transition-all duration-300 rounded-[24px]">
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex items-start justify-between">
              <div className="space-y-1 w-[calc(100%-40px)]">
                <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                  {t.admin.usedCapacity}
                </p>
                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  {formattedUsedCapacity}
                </h4>
              </div>
              <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 shrink-0">
                <Database className="size-5" />
              </div>
            </div>
            
            <div className="mt-4 space-y-1.5">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-violet-600 dark:bg-violet-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${progressBarWidth}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 dark:text-slate-500">
                <span>{usedPercentText} {t.admin.capacityUsedRatio}</span>
                <span>{capacityText} {t.admin.capacityTotal}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* KPI 4: Total Files */}
        <Card className="relative overflow-hidden group hover:shadow-lg dark:hover:border-slate-700/80 transition-all duration-300 rounded-[24px]">
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {language === 'vi' ? 'TỔNG SỐ TỆP TIN' : 'TOTAL FILES'}
                </p>
                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  {stats?.totalDocuments || 0}
                </h4>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400">
                <FileText className="size-5" />
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-1.5 text-xs">
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                <TrendingUp className="size-3.5" />
                +8.4%
              </span>
              <span className="text-slate-400 dark:text-slate-500 font-medium">
                {language === 'vi' ? 'so với tháng trước' : 'vs last month'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistical Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart: Student registrations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Users className="size-4 stroke-[2.5]" />
              </div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight uppercase">
                {t.admin.newRegistrations}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/25 dark:border-emerald-500/15 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-400 select-none shadow-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>{t.admin.trackingLive}</span>
            </div>
          </div>

          <Card className="p-6 relative overflow-hidden bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 shadow-lg dark:shadow-none hover:shadow-xl transition-all duration-300 rounded-[28px] h-[340px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="mb-4 flex items-center justify-between relative z-10">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Total registrations
                </p>
                <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  {(stats?.newRegistrationsLast7Days || []).reduce((a, b) => a + b, 0).toLocaleString()}
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 ml-1.5">
                    {language === 'vi' ? 'tuần này' : 'this week'}
                  </span>
                </p>
              </div>
            </div>

            <div className="h-[210px] w-full mt-auto relative z-10">
              {isMounted && (
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={registrationsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lineGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3155F6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#3155F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                    />
                    <Tooltip
                      content={<RegistrationsTooltip />}
                      cursor={{ stroke: isDark ? '#334155' : '#cbd5e1', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                      animationDuration={200}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3155F6"
                      strokeWidth={3}
                      dot={{ r: 4, stroke: '#3155F6', strokeWidth: 2, fill: isDark ? '#0f172a' : '#ffffff' }}
                      activeDot={{ r: 6, stroke: '#3155F6', strokeWidth: 2, fill: '#3155F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Pie Chart: AI PDF Status distribution */}
        <div className="space-y-4">
          <div className="flex items-center px-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-955/50 text-blue-600 dark:text-blue-400">
                <Sparkles className="size-4 stroke-[2.5]" />
              </div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight uppercase">
                {language === 'vi' ? 'Phân bổ Trạng thái AI PDF' : 'AI PDF Processing Status'}
              </h2>
            </div>
          </div>

          <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-lg dark:shadow-none hover:shadow-xl transition-all duration-300 rounded-[28px] h-[340px] flex flex-col justify-between">
            <div className="relative w-[160px] h-[160px] mx-auto shrink-0 flex items-center justify-center">
              {isMounted && (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Tooltip 
                      content={<StoragePieTooltip />} 
                      offset={35}
                      wrapperStyle={{ zIndex: 100, pointerEvents: 'none' }}
                      allowEscapeViewBox={{ x: true, y: true }}
                    />
                    <Pie
                      data={storageData}
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(undefined)}
                    >
                      {storageData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          className="cursor-pointer outline-none focus:outline-none transition-all duration-300"
                          style={{
                            opacity: activePieIndex === undefined || activePieIndex === index ? 1 : 0.45,
                            transform: activePieIndex === index ? 'scale(1.04)' : 'scale(1)',
                            transformOrigin: 'center'
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
              
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                  {activePieIndex !== undefined ? storageData[activePieIndex].value : totalPdfCount}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider mt-0.5">
                  {activePieIndex !== undefined ? 'PDFs' : (language === 'vi' ? 'TỔNG TỆP PDF' : 'TOTAL PDFs')}
                </span>
              </div>
            </div>

            {/* List labels */}
            <div className="space-y-2 mt-4 max-h-[120px] overflow-y-auto pr-1 no-scrollbar">
              {storageData.map((item, index) => (
                <div
                  key={item.name}
                  className={`flex items-center justify-between text-[12px] transition-all duration-200 cursor-pointer ${
                    activePieIndex !== undefined && activePieIndex !== index ? 'opacity-40' : 'opacity-100'
                  }`}
                  onMouseEnter={() => setActivePieIndex(index)}
                  onMouseLeave={() => setActivePieIndex(undefined)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700 dark:text-slate-300 font-bold truncate max-w-[140px]">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 font-extrabold">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
