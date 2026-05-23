export interface WeeklyActivityDay {
  day: string
  hours: number
}

export interface StudyTrackerData {
  weeklyHours: number
  weeklyTrend: string
  weeklyActivity: WeeklyActivityDay[]
}

const STORAGE_KEY = 'ai_study_hub_weekly_study_tracker'

const DEFAULT_ACTIVITY: WeeklyActivityDay[] = [
  { day: 'M', hours: 2 },
  { day: 'T', hours: 3 },
  { day: 'W', hours: 5 },
  { day: 'T', hours: 1.5 },
  { day: 'F', hours: 2 },
  { day: 'S', hours: 0.5 },
  { day: 'S', hours: 0 },
]

export const studyTracker = {
  // Get current day abbreviation compatible with our list
  getCurrentDayAbbreviation(): string {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    const dayIndex = new Date().getDay()
    return days[dayIndex]
  },

  // Initialize data if it doesn't exist
  initialize(): StudyTrackerData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (err) {
      console.error('Failed to read study tracker data', err)
    }

    const initialData: StudyTrackerData = {
      weeklyHours: 14,
      weeklyTrend: '+2 hrs',
      weeklyActivity: [...DEFAULT_ACTIVITY],
    }
    this.save(initialData)
    return initialData
  },

  save(data: StudyTrackerData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (err) {
      console.error('Failed to save study tracker data', err)
    }
  },

  // Add study hours to today
  addStudyHours(hours: number): StudyTrackerData {
    const data = this.initialize()
    const todayAbbr = this.getCurrentDayAbbreviation()

    // Update today's hours
    data.weeklyActivity = data.weeklyActivity.map((day) => {
      if (day.day === todayAbbr) {
        return {
          ...day,
          hours: Math.round((day.hours + hours) * 100) / 100, // round to 2 decimal places
        }
      }
      return day
    })

    // Recalculate total hours
    const total = data.weeklyActivity.reduce((acc, cur) => acc + cur.hours, 0)
    data.weeklyHours = Math.round(total * 100) / 100

    // Recalculate trend (compare to baseline of 12 hours)
    const diff = data.weeklyHours - 12
    data.weeklyTrend = diff >= 0 ? `+${diff.toFixed(1)} hrs` : `-${Math.abs(diff).toFixed(1)} hrs`

    this.save(data)
    return data
  },

  // Reset to default baseline for testing
  reset(): StudyTrackerData {
    const initialData: StudyTrackerData = {
      weeklyHours: 14,
      weeklyTrend: '+2 hrs',
      weeklyActivity: [...DEFAULT_ACTIVITY],
    }
    this.save(initialData)
    return initialData
  },
}
