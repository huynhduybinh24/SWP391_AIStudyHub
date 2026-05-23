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
import { Play, Pause, RotateCcw, Plus, Clock, Sparkles } from 'lucide-react'
import { studyTracker } from '@/features/dashboard/services/studyTracker'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

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

export function WeeklyActivityChart() {
  const toast = useToast()
  const [trackerData, setTrackerData] = useState(() => studyTracker.initialize())
  const [isTracking, setIsTracking] = useState(false)
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (isTracking) {
      timerRef.current = window.setInterval(() => {
        setSecondsElapsed((prev) => {
          const next = prev + 1
          // Accumulate and sync to study tracker in real-time
          const updated = studyTracker.addStudyHours(1 / 3600)
          setTrackerData(updated)
          return next
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isTracking])

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleStartStop = () => {
    if (isTracking) {
      setIsTracking(false)
      toast.success(`Study session paused! Time: ${formatTime(secondsElapsed)}`)
    } else {
      setIsTracking(true)
      toast.success('Study session started! Focus mode activated. 🚀')
    }
  }

  const handleResetSession = () => {
    setIsTracking(false)
    setSecondsElapsed(0)
    toast.success('Session timer has been reset.')
  }

  const handleAddHours = (hours: number, label: string) => {
    const updated = studyTracker.addStudyHours(hours)
    setTrackerData(updated)
    toast.success(`Successfully added +${label} to today's study hours!`)
  }

  const handleResetAll = () => {
    setIsTracking(false)
    setSecondsElapsed(0)
    const updated = studyTracker.reset()
    setTrackerData(updated)
    toast.success('Reset study activity back to baseline!')
  }

  return (
    <section className="col-span-4 space-y-4 font-sans">
      <CardTitle className="normal-case tracking-normal text-base font-bold text-foreground flex items-center justify-between">
        <span>Weekly Activity</span>
        <button 
          onClick={handleResetAll}
          className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors bg-transparent border-0 cursor-pointer"
        >
          Reset Baseline
        </button>
      </CardTitle>
      <Card className="p-5 flex flex-col gap-5 overflow-hidden">
        {/* Total Hours Display */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-2xl font-black text-foreground tracking-tight select-none">
              {trackerData.weeklyHours.toFixed(2)} hrs studied
            </p>
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              trackerData.weeklyTrend.startsWith('+') 
                ? "text-green-600 bg-green-50 dark:bg-green-950/30" 
                : "text-rose-500 bg-rose-50 dark:bg-rose-950/30"
            )}>
              {trackerData.weeklyTrend}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-400">
            Daily average: {(trackerData.weeklyHours / 7).toFixed(1)} hrs
          </p>
        </div>

        {/* Activity Bar Chart */}
        <div className="h-[140px] w-full shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trackerData.weeklyActivity} barCategoryGap="20%">
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#737686', fontSize: 12, fontWeight: 600 }} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37, 99, 235, 0.05)', radius: 8 }} />
              <Bar dataKey="hours" fill="#3155F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 w-full my-1" />

        {/* Focus Stopwatch Component */}
        <div className="flex flex-col gap-3.5 bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={cn("size-4", isTracking ? "text-blue-600 animate-pulse" : "text-slate-400")} />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Live Focus Session</span>
            </div>
            {isTracking && (
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-green-500 animate-ping" />
                <span className="text-[10px] font-black text-green-600 uppercase tracking-wider">Tracking</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Glowing Stopwatch Screen */}
            <div className={cn(
              "font-mono text-xl font-bold tracking-wider select-none px-3.5 py-1.5 rounded-xl border transition-all duration-300",
              isTracking 
                ? "bg-blue-50/50 dark:bg-blue-950/20 text-[#3155F6] border-blue-200/50 dark:border-blue-800/40 shadow-sm shadow-blue-500/5" 
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-800/80"
            )}>
              {formatTime(secondsElapsed)}
            </div>

            {/* Stopwatch Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleStartStop}
                className={cn(
                  "font-bold text-xs h-9 rounded-xl shadow-sm px-4",
                  isTracking 
                    ? "bg-amber-500 hover:bg-amber-600 text-white" 
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                )}
              >
                {isTracking ? (
                  <>
                    <Pause className="size-3.5 mr-1.5 shrink-0" fill="currentColor" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="size-3.5 mr-1.5 shrink-0" fill="currentColor" /> Focus
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                size="icon"
                onClick={handleResetSession}
                className="size-9 rounded-xl border border-slate-200/60 dark:border-slate-800"
                aria-label="Reset session timer"
              >
                <RotateCcw className="size-3.5 text-slate-500" />
              </Button>
            </div>
          </div>
        </div>

        {/* Testing / Simulator buttons */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5 select-none">
            <Sparkles className="size-3 text-indigo-400" /> Fast-Simulate Study Time
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAddHours(0.5, '30 mins')}
              className="text-xs font-semibold h-8 rounded-lg flex items-center justify-center gap-1 border border-slate-200/60 dark:border-slate-800"
            >
              <Plus className="size-3 text-slate-400" /> 30 mins
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAddHours(1.0, '1 hour')}
              className="text-xs font-semibold h-8 rounded-lg flex items-center justify-center gap-1 border border-slate-200/60 dark:border-slate-800"
            >
              <Plus className="size-3 text-slate-400" /> 1 hour
            </Button>
          </div>
        </div>
      </Card>
    </section>
  )
}
