export function formatStorageSize(sizeInMB: number): string {
  if (sizeInMB < 1024) {
    return `${parseFloat(sizeInMB.toFixed(1))} MB`
  }
  const sizeInGB = sizeInMB / 1024
  const formatted = parseFloat(sizeInGB.toFixed(1))
  return `${formatted} GB`
}

export interface StorageUsageCalculation {
  usedMB: number
  totalMB: number
  remainingMB: number
  percentage: number
  isOverLimit: boolean
}

export function calculateStorageUsage(usedMB: number, totalMB: number): StorageUsageCalculation {
  const safeUsedMB = Math.max(0, usedMB || 0)
  const safeTotalMB = Math.max(1, totalMB || 1)
  const rawPercentage = (safeUsedMB / safeTotalMB) * 100
  const percentage = safeUsedMB > 0 ? Math.min(Math.max(1, Math.round(rawPercentage)), 100) : 0
  const isOverLimit = rawPercentage > 100
  const remainingMB = Math.max(safeTotalMB - safeUsedMB, 0)

  return {
    usedMB: safeUsedMB,
    totalMB: safeTotalMB,
    remainingMB,
    percentage,
    isOverLimit
  }
}
