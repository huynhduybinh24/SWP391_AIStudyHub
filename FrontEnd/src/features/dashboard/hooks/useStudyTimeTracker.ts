import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { DashboardData } from '../types'
import { addTrackedSeconds, formatDateLocal } from '../utils/studyTime'

export function useStudyTimeTracker() {
  const queryClient = useQueryClient()
  const lastActiveRef = useRef<number>(Date.now())

  useEffect(() => {
    // Event listeners to detect user activity
    const handleActivity = () => {
      lastActiveRef.current = Date.now()
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll']
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Track elapsed seconds
    const trackingInterval = setInterval(() => {
      // Only count time if tab is visible and active
      if (document.hidden) return

      const now = Date.now()
      const inactiveDuration = now - lastActiveRef.current

      // If user was active within the last 60 seconds
      if (inactiveDuration < 60000) {
        const todayStr = formatDateLocal(new Date())
        // Add 1 second of study time for today
        const updatedSeconds = addTrackedSeconds(todayStr, 1)

        // Update React Query Cache for real-time UI updates
        queryClient.setQueryData<DashboardData>(['dashboard'], (oldData) => {
          if (!oldData) return oldData

          const updatedWeeklyActivity = oldData.weeklyActivity.map((day) => {
            if (day.dateStr === todayStr) {
              return {
                ...day,
                hours: Number((updatedSeconds / 3600).toFixed(2)),
              }
            }
            return day
          })

          const totalWeeklyHours = updatedWeeklyActivity.reduce((acc, curr) => acc + curr.hours, 0)
          const formattedTotalWeeklyHours = Number(totalWeeklyHours.toFixed(1))

          const diff = formattedTotalWeeklyHours - 12
          const weeklyTrend = diff >= 0 ? `+${diff.toFixed(1)} hrs` : `-${Math.abs(diff).toFixed(1)} hrs`

          return {
            ...oldData,
            weeklyHours: formattedTotalWeeklyHours,
            weeklyTrend,
            weeklyActivity: updatedWeeklyActivity,
          }
        })

        // Dispatch a custom event to notify components that study time has changed
        window.dispatchEvent(new CustomEvent('study-time-updated'))
      }
    }, 1000)

    // Cleanup
    return () => {
      clearInterval(trackingInterval)
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [queryClient])
}
