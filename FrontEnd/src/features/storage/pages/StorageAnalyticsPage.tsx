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

const barChartData = [
  { name: 'Jan', value: 12 },
  { name: 'Feb', value: 18 },
  { name: 'Mar', value: 25 },
  { name: 'Apr', value: 32 },
  { name: 'May', value: 38 },
  { name: 'Jun', value: 45.2 },
]

const pieChartData = [
  { name: 'Documents', value: 22.1, color: '#2563eb' },
  { name: 'Media', value: 15.5, color: '#0d9488' },
  { name: 'Other', value: 7.6, color: '#8b5cf6' },
]

export function StorageAnalyticsPage() {
  const navigate = useNavigate()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
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
          Back to Cloud Storage
        </Link>
        <div>
          <h1 className="text-[32px] font-bold text-foreground leading-tight">Storage Analytics</h1>
          <p className="text-muted mt-2 text-sm">
            Understand how your study files use cloud storage.
          </p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-4">
              <span className="text-[13px] font-semibold text-muted-foreground">Total Used</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                <PieChartIcon className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <div className="text-[28px] font-bold text-foreground leading-none">45.2 GB</div>
              <div className="mt-4 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: '45.2%' }}></div>
              </div>
              <p className="text-[11px] text-muted mt-2 font-medium">of 100 GB Total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-4">
              <span className="text-[13px] font-semibold text-muted-foreground">Free Space</span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="text-[28px] font-bold text-foreground leading-none">54.8 GB</div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-3 font-medium">Available for new uploads</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-4">
              <span className="text-[13px] font-semibold text-muted-foreground">Total Files</span>
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                <Folder className="size-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="text-[28px] font-bold text-foreground leading-none">1,204</div>
              <p className="text-[11px] text-muted mt-3 font-medium">+12 this week</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-4">
              <span className="text-[13px] font-semibold text-muted-foreground">Shared Items</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                <Users className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <div className="text-[28px] font-bold text-foreground leading-none">86</div>
              <p className="text-[11px] text-muted mt-3 font-medium">Active sharing links</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Usage Over Time */}
        <Card className="lg:col-span-2 border-border flex flex-col min-h-[350px]">
          <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between border-b-0 space-y-0">
            <CardTitle className="text-base font-bold">Storage Usage Over Time</CardTitle>
            <button className="text-muted hover:text-foreground">
              <MoreVertical className="size-5" />
            </button>
          </CardHeader>
          <CardContent className="p-6 pt-4 flex-1 flex flex-col min-h-0">
            <div className="w-full h-[240px] [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
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
                      domain={[0, 50]}
                      ticks={[0, 10, 20, 30, 40, 50]}
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
                      formatter={(value: any) => [`${value} GB`, 'Storage Used']}
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
            <CardTitle className="text-base font-bold">File Type Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-4 flex-1 flex flex-col min-h-0">
            <div className="w-[180px] h-[180px] relative mx-auto mb-8 [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart style={{ outline: 'none' }}>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        color: isDark ? '#f8fafc' : '#0f172a'
                      }}
                      formatter={(value: any) => [`${value} GB`, 'Size']}
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
                  {activeIndex !== undefined && pieChartData[activeIndex] ? pieChartData[activeIndex].value : '45.2'}
                </span>
                <span className="text-[10px] text-muted font-medium mt-0.5">
                  {activeIndex !== undefined ? 'GB Used' : 'GB Total'}
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
                      {item.name === 'Documents' && <span className="text-muted font-normal"> (PDF, Docx)</span>}
                      {item.name === 'Media' && <span className="text-muted font-normal"> (Video, Audio)</span>}
                      {item.name === 'Other' && <span className="text-muted font-normal"> (Zips, Code)</span>}
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
              <h3 className="font-bold text-foreground text-[15px]">AI Storage Insights</h3>
              <p className="text-muted text-[13px] mt-1 leading-relaxed max-w-3xl">
                We noticed you have 4.2 GB of duplicate study guides from last semester and several large video files that haven&apos;t been opened in 6 months.
              </p>
            </div>
          </div>
          <div className="p-6 pt-0 sm:pt-6 shrink-0 w-full sm:w-auto">
            <Button 
              variant="primary" 
              className="w-full sm:w-auto bg-[#2563eb] hover:bg-[#1d4ed8] dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-colors"
              onClick={() => navigate('/dashboard/storage/cleanup')}
            >
              Review Files
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
