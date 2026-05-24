import { useEffect, useRef } from 'react'
import { addTrackedSeconds, formatDateLocal, getTrackedSeconds } from '../utils/studyTime'

export function useStudyTimeTracker() {
  const lastActiveRef = useRef<number>(Date.now())
  const todayStrRef = useRef<string>(formatDateLocal(new Date()))

  useEffect(() => {
    // Keep date string fresh
    const dateInterval = setInterval(() => {
      todayStrRef.current = formatDateLocal(new Date())
    }, 60000)

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
        // Add 1 second of study time for today
        addTrackedSeconds(todayStrRef.current, 1)

        // Dispatch a custom event to notify components that study time has changed
        window.dispatchEvent(new CustomEvent('study-time-updated'))
      }
    }, 1000)

    // Cleanup
    return () => {
      clearInterval(dateInterval)
      clearInterval(trackingInterval)
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [])
}
