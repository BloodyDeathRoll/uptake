import type { Sex } from '@/lib/utils/constants'

interface BMRParams {
  weight: number  // kg
  height: number  // cm
  age: number
  sex: Sex | null
}

/**
 * Calculates Basal Metabolic Rate using the Mifflin-St Jeor equation.
 * - Male:   10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
 * - Female: 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
 * - Other/null: uses male formula as default
 */
export function calculateBMR({ weight, height, age, sex }: BMRParams): number {
  if (weight <= 0) throw new Error('Weight must be positive')
  if (height <= 0) throw new Error('Height must be positive')
  if (age <= 0) throw new Error('Age must be positive')

  const base = 10 * weight + 6.25 * height - 5 * age
  // Mifflin-St Jeor constants: male +5, female -161
  const adjustment = sex === 'female' ? -161 : 5
  return base + adjustment
}
