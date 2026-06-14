import { useMemo, useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  HardDrive,
  Users,
  MessageSquare,
  Zap,
  BarChart3,
  Layers,
  ArrowUpRight
} from 'lucide-react'
import { AdminStats } from '../services/adminService'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Card, CardContent } from '@/components/ui/Card'
import { useTranslation } from '@/context/LanguageContext'
import { useTheme } from '@/features/settings/components/ThemeProvider'

const formatMonth = (label: string, lang: string) => {
  const cleanLabel = label.trim().toLowerCase();
  
  const translations: Record<string, Record<string, string>> = {
    vi: {
      jan: 'Thg 1', feb: 'Thg 2', mar: 'Thg 3', apr: 'Thg 4', may: 'Thg 5', jun: 'Thg 6',
      jul: 'Thg 7', aug: 'Thg 8', sep: 'Thg 9', oct: 'Thg 10', nov: 'Thg 11', dec: 'Thg 12'
    },
    ja: {
      jan: '1月', feb: '2月', mar: '3月', apr: '4月', may: '5月', jun: '6月',
      jul: '7月', aug: '8月', sep: '9月', oct: '10月', nov: '11月', dec: '12月'
    },
    ko: {
      jan: '1월', feb: '2월', mar: '3월', apr: '4월', may: '5월', jun: '6월',
      jul: '7월', aug: '8월', sep: '9월', oct: '10월', nov: '11월', dec: '12월'
    }
  };

  const langMap = translations[lang];
  if (!langMap) return label;

  for (const key in langMap) {
    if (cleanLabel.startsWith(key)) {
      return langMap[key];
    }
  }
  return label;
};

// Custom tooltips
const TrafficTooltip = ({ active, payload, language }: any) => {
  if (active && payload && payload.length) {
    const pageViewsText = language === 'vi' ? 'Lượt xem trang' : language === 'ja' ? 'ページビュー' : language === 'ko' ? '페이지 뷰' : 'Page Views';
    const aiQueriesText = language === 'vi' ? 'Yêu cầu AI' : language === 'ja' ? 'AIクエリ' : language === 'ko' ? 'AI 쿼리' : 'AI Queries';
    return (
      <div className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md text-white px-3.5 py-2.5 rounded-2xl text-xs font-semibold shadow-xl border border-white/10 flex flex-col gap-1 select-none animate-fade-in">
        <span className="text-slate-400 font-bold mb-1">{payload[0].payload.name}</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>{pageViewsText}: <span className="font-extrabold">{payload[0].value.toLocaleString()}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{aiQueriesText}: <span className="font-extrabold">{payload[1].value.toLocaleString()}</span></span>
        </div>
      </div>
    )
  }
  return null
}

const ModulesTooltip = ({ active, payload, language }: any) => {
  if (active && payload && payload.length) {
    const interactionsText = language === 'vi' ? 'tương tác' : language === 'ja' ? 'インタラクション' : language === 'ko' ? '상호작용' : 'interactions';
    return (
      <div className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md text-white px-3.5 py-2.5 rounded-2xl text-xs font-semibold shadow-xl border border-white/10 flex items-center gap-2 select-none animate-fade-in">
        <MessageSquare className="size-4 text-violet-400" />
        <div>
          <span className="font-extrabold">{payload[0].value.toLocaleString()}</span>
          <span className="text-[10px] text-slate-450 ml-1.5 font-medium">{interactionsText}</span>
        </div>
      </div>
    )
  }
  return null
}

interface AdminAnalyticsTabProps {
  stats?: AdminStats | null
}

export function AdminAnalyticsTab({ stats }: AdminAnalyticsTabProps) {
  const { language } = useTranslation()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 200)
    return () => clearTimeout(timer)
  }, [])

  // Traffic / Requests data (last 6 months)
  const trafficData = useMemo(() => {
    const rawData = (() => {
      if (stats?.monthlyTrafficLabels && stats?.monthlyPageViews && stats?.monthlyAiQueries) {
        return stats.monthlyTrafficLabels.map((label, idx) => ({
          name: label,
          pv: stats.monthlyPageViews[idx] || 0,
          ai: stats.monthlyAiQueries[idx] || 0
        }))
      }
      return [
        { name: 'Dec', pv: 45000, ai: 12000 },
        { name: 'Jan', pv: 52000, ai: 15400 },
        { name: 'Feb', pv: 49000, ai: 14200 },
        { name: 'Mar', pv: 63000, ai: 19800 },
        { name: 'Apr', pv: 78000, ai: 24500 },
        { name: 'May', pv: 92450, ai: 31200 }
      ]
    })()

    return rawData.map(item => ({
      ...item,
      name: formatMonth(item.name, language)
    }))
  }, [stats, language])

  // Module usage stats data
  const moduleUsageData = useMemo(() => {
    return [
      { 
        name: language === 'vi' ? 'Trò chuyện AI' : language === 'ja' ? 'AIチャット' : language === 'ko' ? 'AI 챗봇' : 'AI Chatbot', 
        value: stats?.aiChatInteractions ?? 85240 
      },
      { 
        name: language === 'vi' ? 'Lưu trữ tệp' : language === 'ja' ? 'ファイル保存' : language === 'ko' ? '파일 저장소' : 'File Storage', 
        value: stats?.fileStorageInteractions ?? 64205 
      },
      { 
        name: language === 'vi' ? 'Kế hoạch học' : language === 'ja' ? '学習計画' : language === 'ko' ? '학습 계획' : 'Study Plans', 
        value: stats?.studyPlanInteractions ?? 38450 
      },
      { 
        name: language === 'vi' ? 'Quản lý tài liệu' : language === 'ja' ? 'ドキュメント' : language === 'ko' ? '문서 관리' : 'Documents', 
        value: stats?.quizInteractions ?? 29400 
      }
    ]
  }, [language, stats])

  return (
    <div className="space-y-6 select-none text-left">
      {/* Visual Analytics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Engagement Rate */}
        <Card className="relative overflow-hidden group hover:shadow-lg dark:hover:border-slate-700/80 transition-all duration-300 rounded-[24px]">
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {language === 'vi' ? 'Tỷ lệ tương tác' : 'Engagement Rate'}
                </p>
                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  {stats?.engagementRate ? `${stats.engagementRate.toFixed(1)}%` : '84.2%'}
                </h4>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400">
                <Users className="size-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs">
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                <TrendingUp className="size-3.5" />
                +5.4%
              </span>
              <span className="text-slate-400 dark:text-slate-500 font-medium">
                {language === 'vi' ? 'so với tháng trước' : 'vs last month'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Avg response time */}
        <Card className="relative overflow-hidden group hover:shadow-lg dark:hover:border-slate-700/80 transition-all duration-300 rounded-[24px]">
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {language === 'vi' ? 'Tốc độ phản hồi AI' : 'Avg AI Response'}
                </p>
                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  {stats?.avgAiResponseTime ? `${stats.avgAiResponseTime.toFixed(2)}s` : '1.18s'}
                </h4>
              </div>
              <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-955/40 text-violet-600 dark:text-violet-400">
                <Zap className="size-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs">
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                <TrendingDown className="size-3.5" />
                -120ms
              </span>
              <span className="text-slate-400 dark:text-slate-500 font-medium">
                {language === 'vi' ? 'tối ưu hóa mô hình' : 'faster engine inference'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Storage utilization */}
        <Card className="relative overflow-hidden group hover:shadow-lg dark:hover:border-slate-700/80 transition-all duration-300 rounded-[24px]">
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex items-start justify-between">
              <div className="space-y-1 w-[calc(100%-40px)]">
                <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                  {language === 'vi' ? 'Hiệu suất lưu trữ' : 'Storage Efficiency'}
                </p>
                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  {stats?.storageEfficiency ? `${stats.storageEfficiency.toFixed(1)}%` : '98.1%'}
                </h4>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-955/40 text-amber-500 dark:text-amber-450 shrink-0">
                <HardDrive className="size-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs">
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10">
                <ArrowUpRight className="size-3.5" />
                {stats?.tempFilesCleanedGb ? `${stats.tempFilesCleanedGb.toFixed(1)} GB` : '982 GB'}
              </span>
              <span className="text-slate-400 dark:text-slate-500 font-medium">
                {language === 'vi' ? 'giải phóng rác tự động' : 'temp files auto cleaned'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Conversion rate */}
        <Card className="relative overflow-hidden group hover:shadow-lg dark:hover:border-slate-700/80 transition-all duration-300 rounded-[24px]">
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {language === 'vi' ? 'Tỷ lệ Pro Conversion' : 'Pro Conversion Rate'}
                </p>
                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  {stats?.proConversionRate ? `${stats.proConversionRate.toFixed(1)}%` : '25.2%'}
                </h4>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-955/40 text-emerald-600 dark:text-emerald-450">
                <TrendingUp className="size-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs">
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                <TrendingUp className="size-3.5" />
                +1.8%
              </span>
              <span className="text-slate-400 dark:text-slate-500 font-medium">
                {language === 'vi' ? 'so với tháng trước' : 'vs last month'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Graphs section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly System Traffic */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-955/50 text-blue-600 dark:text-blue-400">
              <BarChart3 className="size-4 stroke-[2.5]" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight uppercase">
              {language === 'vi' ? 'Lưu lượng truy cập hệ thống' : 'System Traffic & AI Requests'}
            </h2>
          </div>

          <Card className="p-6 relative overflow-hidden bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/50 shadow-lg dark:shadow-none hover:shadow-xl transition-all duration-300 rounded-[28px] h-[350px]">
            <div className="h-[300px] w-full relative z-10">
              {isMounted && (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pvGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="aiGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                    />
                    <Tooltip content={<TrafficTooltip language={language} />} />
                    <Area
                      type="monotone"
                      dataKey="pv"
                      name="Page Views"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#pvGlow)"
                    />
                    <Area
                      type="monotone"
                      dataKey="ai"
                      name="AI Queries"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#aiGlow)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Module breakdown */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-955/50 text-violet-600 dark:text-violet-400">
              <Layers className="size-4 stroke-[2.5]" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight uppercase">
              {language === 'vi' ? 'Tương tác theo phân hệ' : 'Interactions by Module'}
            </h2>
          </div>

          <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-lg dark:shadow-none hover:shadow-xl transition-all duration-300 rounded-[28px] h-[350px] flex flex-col justify-between">
            <div className="h-[280px] w-full mt-auto">
              {isMounted && (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={moduleUsageData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                    />
                    <Tooltip content={<ModulesTooltip language={language} />} />
                    <Bar
                      dataKey="value"
                      fill="#8b5cf6"
                      radius={[10, 10, 0, 0]}
                      maxBarSize={45}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
