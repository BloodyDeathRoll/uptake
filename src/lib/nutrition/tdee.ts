import { ACTIVITY_MULTIPLIERS, type ActivityLevel } from '@/lib/utils/constants'

/**
 * Calculates Total Daily Energy Expenditure.
 * TDEE = BMR × activity multiplier
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel]
  if (multiplier === undefined) {
    throw new Error(`Unknown activity level: ${activityLevel}`)
  }
  return Math.round(bmr * multiplier)
}
