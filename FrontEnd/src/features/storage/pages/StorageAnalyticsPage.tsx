import {
  ArrowLeft,
  PieChart as PieChartIcon,
  CheckCircle2,
  Folder,
  Users,
  Sparkles,
  MoreVertical
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useState, useEffect } from 'react'
import { useTheme } from '@/features/settings/components/ThemeProvider'
import { useAuthStore } from '@/stores/authStore'
import { env } from '@/config/env'
import { useMemo } from 'react'
import { useTranslation } from '@/context/LanguageContext'
import { storageService, type StorageAnalytics } from '@/services/storageService'
import { getStorageLimitByPlan } from '@/constants/storagePlans'
import { formatStorageSize, calculateStorageUsage } from '@/utils/storageFormat'

export function StorageAnalyticsPage() {
  const navigate = useNavigate()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)
  const [isMounted, setIsMounted] = useState(false)
  const { t } = useTranslation()
  
  const user = useAuthStore((s) => s.user)
  const isPro = user?.plan === 'pro'
  
  const [analyticsData, setAnalyticsData] = useState<StorageAnalytics | null>(null)

  useEffect(() => {
    if (user?.id) {
      storageService.getStorageAnalytics(Number(user.id))
        .then(data => {
          setAnalyticsData(data)
        })
        .catch(err => {
          console.error("Failed to fetch storage analytics:", err)
        })
    }
  }, [user?.id])

  const totalMb = getStorageLimitByPlan(user?.plan)
  const totalGb = totalMb / 1024

  const usedMb = analyticsData 
    ? analyticsData.totalUsedMb 
    : user?.plan === 'pro' 
      ? 2457.6 
      : (user?.plan === 'premium' || user?.plan === 'institutional' || user?.plan === 'enterprise')
        ? 8192
        : 8

  const usedGb = usedMb / 1024
  const usageInfo = calculateStorageUsage(usedMb, totalMb)
  const usedPercentage = usageInfo.percentage
  const freeGb = Number((usageInfo.remainingMB / 1024).toFixed(1))

  const barChartData = useMemo(() => {
    if (analyticsData && analyticsData.snapshots.length > 0) {
      return analyticsData.snapshots.map(s => {
        const dateParts = s.snapshotDate.split('-');
        const dateLabel = dateParts.length >= 3 ? `${dateParts[2]}/${dateParts[1]}` : s.snapshotDate;
        return {
          name: dateLabel,
          value: Number((s.totalUsedMb / 1024).toFixed(3))
        }
      });
    }
    const getLocalizedMonthName = (month: string) => {
      switch (month) {
        case 'Jan': return t.storageAnalytics.jan
        case 'Feb': return t.storageAnalytics.feb
        case 'Mar': return t.storageAnalytics.mar
        case 'Apr': return t.storageAnalytics.apr
        case 'May': return t.storageAnalytics.may
        case 'Jun': return t.storageAnalytics.jun
        default: return month
      }
    }
    const isPremium = user?.plan === 'premium' || user?.plan === 'institutional' || user?.plan === 'enterprise'
    if (isPremium) {
      return [
        { name: getLocalizedMonthName('Jan'), value: 1.2 },
        { name: getLocalizedMonthName('Feb'), value: 2.5 },
        { name: getLocalizedMonthName('Mar'), value: 4.8 },
        { name: getLocalizedMonthName('Apr'), value: 6.2 },
        { name: getLocalizedMonthName('May'), value: 7.5 },
        { name: getLocalizedMonthName('Jun'), value: usedGb },
      ]
    }
    if (isPro) {
      return [
        { name: getLocalizedMonthName('Jan'), value: 0.5 },
        { name: getLocalizedMonthName('Feb'), value: 0.8 },
        { name: getLocalizedMonthName('Mar'), value: 1.2 },
        { name: getLocalizedMonthName('Apr'), value: 1.6 },
        { name: getLocalizedMonthName('May'), value: 2.0 },
        { name: getLocalizedMonthName('Jun'), value: usedGb },
      ]
    }
    // Free plan
    return [
      { name: getLocalizedMonthName('Jan'), value: 0.001 },
      { name: getLocalizedMonthName('Feb'), value: 0.002 },
      { name: getLocalizedMonthName('Mar'), value: 0.003 },
      { name: getLocalizedMonthName('Apr'), value: 0.005 },
      { name: getLocalizedMonthName('May'), value: 0.006 },
      { name: getLocalizedMonthName('Jun'), value: usedGb },
    ]
  }, [analyticsData, isPro, user?.plan, usedGb, t])

  const pieChartData = useMemo(() => {
    const getPieItemName = (name: string) => {
      switch (name) {
        case 'Documents': return t.storageExplorer.documents
        case 'Media': return t.storageAnalytics.media
        case 'Audio': return t.storageAnalytics.audio || 'Audio'
        case 'Other': return t.storageExplorer.other
        default: return name
      }
    }
    if (analyticsData) {
      const breakdown = analyticsData.categoryBreakdown;
      return [
        { name: getPieItemName('Documents'), value: breakdown["Document"] ? breakdown["Document"] / 1024 : 0, color: '#2563eb' },
        { name: getPieItemName('Media'), value: breakdown["Media"] ? breakdown["Media"] / 1024 : 0, color: '#0d9488' },
        { name: getPieItemName('Audio'), value: breakdown["Audio"] ? breakdown["Audio"] / 1024 : 0, color: '#f59e0b' },
        { name: getPieItemName('Other'), value: breakdown["Other"] ? breakdown["Other"] / 1024 : 0, color: '#8b5cf6' },
      ].filter(item => item.value > 0);
    }
    const isPremium = user?.plan === 'premium' || user?.plan === 'institutional' || user?.plan === 'enterprise'
    if (isPremium) {
      return [
        { name: getPieItemName('Documents'), value: 4.8, color: '#2563eb' },
        { name: getPieItemName('Media'), value: 2.4, color: '#0d9488' },
        { name: getPieItemName('Other'), value: 0.8, color: '#8b5cf6' },
      ]
    }
    if (isPro) {
      return [
        { name: getPieItemName('Documents'), value: 1.4, color: '#2563eb' },
        { name: getPieItemName('Media'), value: 0.7, color: '#0d9488' },
        { name: getPieItemName('Other'), value: 0.3, color: '#8b5cf6' },
      ]
    }
    // Free plan (usedMb = 8)
    return [
      { name: getPieItemName('Documents'), value: 0.0048, color: '#2563eb' },
      { name: getPieItemName('Media'), value: 0.0024, color: '#0d9488' },
      { name: getPieItemName('Other'), value: 0.0008, color: '#8b5cf6' },
    ]
  }, [analyticsData, isPro, user?.plan, t])

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 200)
    return () => clearTimeout(timer)
  }, [])

  const onPieEnter = (_: unknown, index: number) => {
    if (typeof index === 'number') {
      setActiveIndex(index)
    }
  }

  const onPieLeave = () => {
    setActiveIndex(undefined)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-10">
      {/* Header Area */}
      <div>
        <Link 
          to="/dashboard/storage" 
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="size-4" />
          {t.storageAnalytics.backToStorage}
        </Link>
        <div>
          <h1 className="text-[32px] font-bold text-foreground leading-tight">{t.storageAnalytics.title}</h1>
          <p className="text-muted mt-2 text-sm">
            {t.storageAnalytics.subtitle}
          </p>
        </div>
      </div>
 
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-4">
              <span className="text-[13px] font-semibold text-muted-foreground">{t.storageAnalytics.totalUsed}</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                <PieChartIcon className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <div className="text-[28px] font-bold text-foreground leading-none">{usedGb} GB</div>
              <div className="mt-4 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${usedPercentage}%` }}></div>
              </div>
              <p className="text-[11px] text-muted mt-2 font-medium">{t.storageAnalytics.ofTotalText(totalGb)}</p>
            </div>
          </CardContent>
        </Card>
 
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-4">
              <span className="text-[13px] font-semibold text-muted-foreground">{t.storageAnalytics.freeSpace}</span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="text-[28px] font-bold text-foreground leading-none">{freeGb} GB</div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-3 font-medium">{t.storageAnalytics.availableUploads}</p>
            </div>
          </CardContent>
        </Card>
 
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-4">
              <span className="text-[13px] font-semibold text-muted-foreground">{t.storageAnalytics.totalFiles}</span>
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                <Folder className="size-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="text-[28px] font-bold text-foreground leading-none">{analyticsData ? analyticsData.totalFiles : '1,204'}</div>
              <p className="text-[11px] text-muted mt-3 font-medium">{t.storageAnalytics.thisWeekText(analyticsData ? analyticsData.totalFiles : 12)}</p>
            </div>
          </CardContent>
        </Card>
 
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-4">
              <span className="text-[13px] font-semibold text-muted-foreground">{t.storageAnalytics.sharedItems}</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                <Users className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <div className="text-[28px] font-bold text-foreground leading-none">86</div>
              <p className="text-[11px] text-muted mt-3 font-medium">{t.storageAnalytics.activeSharingLinks}</p>
            </div>
          </CardContent>
        </Card>
      </div>
 
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Usage Over Time */}
        <Card className="lg:col-span-2 border-border flex flex-col min-h-[350px]">
          <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between border-b-0 space-y-0">
            <CardTitle className="text-base font-bold">{t.storageAnalytics.usageOverTime}</CardTitle>
            <button className="text-muted hover:text-foreground">
              <MoreVertical className="size-5" />
            </button>
          </CardHeader>
          <CardContent className="p-6 pt-4 flex-1 flex flex-col min-h-0">
            <div className="w-full h-[240px] [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none">
              {isMounted && (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ outline: 'none' }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                      tickFormatter={(value) => `${value}G`}
                      domain={[0, totalGb]}
                      ticks={isPro ? [0, 10, 20, 30, 40, 50] : [0, 2, 4, 6, 8, 10]}
                    />
                    <Tooltip 
                      cursor={{ fill: isDark ? '#0f172a' : '#f8fafc' }}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        color: isDark ? '#f8fafc' : '#0f172a'
                      }}
                      formatter={(value: any) => [`${value} GB`, t.storageAnalytics.storageUsed]}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#2563eb" 
                      radius={[4, 4, 0, 0]} 
                      barSize={40}
                    >
                      {barChartData.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === barChartData.length - 1 ? '#2563eb' : (isDark ? '#1e3a8a' : '#93c5fd')} 
                          className="cursor-pointer outline-none focus:outline-none hover:opacity-80"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
 
        {/* File Type Distribution */}
        <Card className="border-border flex flex-col min-h-[350px]">
          <CardHeader className="p-6 pb-2 border-b-0 space-y-0">
            <CardTitle className="text-base font-bold">{t.storageAnalytics.typeDistribution}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-4 flex-1 flex flex-col min-h-0">
            <div className="w-[180px] h-[180px] relative mx-auto mb-8 [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none">
              {isMounted && (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart style={{ outline: 'none' }}>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        color: isDark ? '#f8fafc' : '#0f172a'
                      }}
                      formatter={(value: any) => [`${value} GB`, t.storageAnalytics.size]}
                    />
                    <Pie
                      data={pieChartData}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                      onMouseEnter={onPieEnter}
                      onMouseLeave={onPieLeave}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          className="cursor-pointer outline-none focus:outline-none transition-opacity duration-300"
                          style={{
                            opacity: activeIndex === undefined || activeIndex === index ? 1 : 0.5,
                            outline: 'none'
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-2xl font-bold text-foreground">
                  {activeIndex !== undefined && pieChartData[activeIndex] ? pieChartData[activeIndex].value : usedGb}
                </span>
                <span className="text-[10px] text-muted font-medium mt-0.5">
                  {activeIndex !== undefined ? t.storageAnalytics.gbUsed : t.storageAnalytics.gbTotal}
                </span>
              </div>
            </div>
 
            <div className="flex flex-col gap-4 mt-auto">
              {pieChartData.map((item, index) => (
                <div 
                  key={item.name}
                  className={`flex items-center justify-between text-[13px] transition-opacity duration-300 ${activeIndex !== undefined && activeIndex !== index ? 'opacity-50' : 'opacity-100'}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                >
                  <div className="flex items-center gap-2 cursor-pointer">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-foreground font-medium">
                      {item.name} 
                      {item.name === t.storageExplorer.documents && <span className="text-muted font-normal">{t.storageAnalytics.documentsDesc}</span>}
                      {item.name === t.storageAnalytics.media && <span className="text-muted font-normal">{t.storageAnalytics.mediaDesc}</span>}
                      {item.name === t.storageExplorer.other && <span className="text-muted font-normal">{t.storageAnalytics.otherDesc}</span>}
                    </span>
                  </div>
                  <span className="text-muted font-medium">{item.value} GB</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
 
      {/* AI Storage Insights */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0 flex flex-col sm:flex-row items-center">
          <div className="p-6 flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
              <Sparkles className="size-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-[15px]">{t.storageAnalytics.aiInsights}</h3>
              <p className="text-muted text-[13px] mt-1 leading-relaxed max-w-3xl">
                {t.storageAnalytics.insightsDesc(isPro ? '4.2 GB' : '0.4 GB')}
              </p>
            </div>
          </div>
          <div className="p-6 pt-0 sm:pt-6 shrink-0 w-full sm:w-auto">
            <Button 
              variant="primary" 
              className="w-full sm:w-auto bg-[#2563eb] hover:bg-[#1d4ed8] dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-colors"
              onClick={() => navigate('/dashboard/storage/cleanup')}
            >
              {t.storageAnalytics.reviewFiles}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
