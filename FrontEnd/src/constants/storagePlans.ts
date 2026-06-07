export const STORAGE_PLAN_LIMITS_MB = {
  FREE: 1024,
  PRO: 5120,
  PREMIUM: 51200,
} as const

export type StoragePlan = keyof typeof STORAGE_PLAN_LIMITS_MB

export function normalizeStoragePlan(plan?: string): StoragePlan {
  const normalized = plan?.toUpperCase()
  if (normalized === "PRO") return "PRO"
  if (normalized === "PREMIUM" || normalized === "INSTITUTIONAL" || normalized === "ENTERPRISE") return "PREMIUM"
  return "FREE"
}

export function getStorageLimitByPlan(plan?: string): number {
  return STORAGE_PLAN_LIMITS_MB[normalizeStoragePlan(plan)]
}
