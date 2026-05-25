const LOCAL_STORAGE_KEY = 'study_hub_study_time'

export interface DailyStudyTime {
  [dateStr: string]: number // seconds
}

export function getStudyTimeData(): DailyStudyTime {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (e) {
    console.error('Error reading study time from localStorage', e)
    return {}
  }
}

export function saveStudyTimeData(data: DailyStudyTime): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Error saving study time to localStorage', e)
  }
}

export function getTrackedSeconds(dateStr: string): number {
  const data = getStudyTimeData()
  return data[dateStr] || 0
}

export function addTrackedSeconds(dateStr: string, seconds: number): number {
  const data = getStudyTimeData()
  const current = data[dateStr] || 0
  const updated = current + seconds
  data[dateStr] = updated
  saveStudyTimeData(data)
  return updated
}

export function getCurrentWeekDays() {
  const current = new Date()
  const day = current.getDay()
  // distance to Monday: if Sunday (0), we go back 6 days. Otherwise, 1 - day
  const distanceToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(current)
  monday.setDate(current.getDate() + distanceToMonday)

  const days = []
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const date = String(d.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${date}`
    days.push({
      dateStr,
      label: labels[i],
      index: i
    })
  }
  return days
}

// Format YYYY-MM-DD for a given Date object in local time
export function formatDateLocal(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}
