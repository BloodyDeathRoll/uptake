import type { GoalType } from '@/lib/utils/constants'

export interface NutrientTargets {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  sugar_g: number
  saturated_fat_g: number
  sodium_mg: number
  water_ml: number
  protein_per_kg: number
  net_carbs_g?: number
  custom_targets?: Record<string, number>
}

/**
 * Calculates daily nutrient targets based on goal type.
 * All targets derived from TDEE and body weight.
 */
export function calculateTargets(
  goalType: GoalType,
  tdee: number,
  weightKg: number,
  customTargets?: Partial<NutrientTargets>
): NutrientTargets {
  switch (goalType) {
    case 'muscle_gain': {
      const protein_per_kg = 2.2
      const protein_g = Math.round(weightKg * protein_per_kg)
      const calories = tdee + 300
      const fat_g = Math.round((calories * 0.25) / 9)
      const carbs_g = Math.round((calories - protein_g * 4 - fat_g * 9) / 4)
      return { calories, protein_g, carbs_g, fat_g, fiber_g: 30, sugar_g: 50, saturated_fat_g: Math.round(fat_g * 0.3), sodium_mg: 2300, water_ml: 3000, protein_per_kg }
    }
    case 'athlete_cut': {
      const protein_per_kg = 2.4
      const protein_g = Math.round(weightKg * protein_per_kg)
      const calories = tdee - 400
      const fat_g = Math.round((calories * 0.25) / 9)
      const carbs_g = Math.round((calories - protein_g * 4 - fat_g * 9) / 4)
      return { calories, protein_g, carbs_g, fat_g, fiber_g: 30, sugar_g: 30, saturated_fat_g: Math.round(fat_g * 0.3), sodium_mg: 2300, water_ml: 3500, protein_per_kg }
    }
    case 'weight_loss': {
      const protein_per_kg = 1.8
      const protein_g = Math.round(weightKg * protein_per_kg)
      const calories = Math.max(tdee - 500, 1200)
      const fat_g = Math.round((calories * 0.3) / 9)
      const carbs_g = Math.round((calories - protein_g * 4 - fat_g * 9) / 4)
      return { calories, protein_g, carbs_g, fat_g, fiber_g: 35, sugar_g: 40, saturated_fat_g: Math.round(fat_g * 0.25), sodium_mg: 2300, water_ml: 2500, protein_per_kg }
    }
    case 'maintenance': {
      const protein_per_kg = 1.6
      const protein_g = Math.round(weightKg * protein_per_kg)
      const calories = tdee
      const fat_g = Math.round((calories * 0.3) / 9)
      const carbs_g = Math.round((calories - protein_g * 4 - fat_g * 9) / 4)
      return { calories, protein_g, carbs_g, fat_g, fiber_g: 30, sugar_g: 50, saturated_fat_g: Math.round(fat_g * 0.3), sodium_mg: 2300, water_ml: 2500, protein_per_kg }
    }
    case 'recomposition': {
      const protein_per_kg = 2.2
      const protein_g = Math.round(weightKg * protein_per_kg)
      const calories = tdee
      const fat_g = Math.round((calories * 0.28) / 9)
      const carbs_g = Math.round((calories - protein_g * 4 - fat_g * 9) / 4)
      return { calories, protein_g, carbs_g, fat_g, fiber_g: 30, sugar_g: 40, saturated_fat_g: Math.round(fat_g * 0.25), sodium_mg: 2300, water_ml: 3000, protein_per_kg }
    }
    case 'endurance': {
      const protein_per_kg = 1.6
      const protein_g = Math.round(weightKg * protein_per_kg)
      const calories = tdee + 200
      const carbs_g = Math.round((calories * 0.55) / 4)
      const fat_g = Math.round((calories * 0.25) / 9)
      return { calories, protein_g, carbs_g, fat_g, fiber_g: 35, sugar_g: 60, saturated_fat_g: Math.round(fat_g * 0.3), sodium_mg: 3000, water_ml: 4000, protein_per_kg }
    }
    case 'heart_healthy': {
      const protein_per_kg = 1.4
      const protein_g = Math.round(weightKg * protein_per_kg)
      const calories = tdee - 200
      const fat_g = Math.round((calories * 0.28) / 9)
      const carbs_g = Math.round((calories - protein_g * 4 - fat_g * 9) / 4)
      const saturated_fat_g = Math.min(Math.round(fat_g * 0.2), 20)
      return { calories, protein_g, carbs_g, fat_g, fiber_g: 40, sugar_g: 30, saturated_fat_g, sodium_mg: 1500, water_ml: 2500, protein_per_kg }
    }
    case 'longevity': {
      const protein_per_kg = 1.4
      const protein_g = Math.round(weightKg * protein_per_kg)
      const calories = tdee - 100
      const fat_g = Math.round((calories * 0.35) / 9)
      const carbs_g = Math.round((calories - protein_g * 4 - fat_g * 9) / 4)
      return { calories, protein_g, carbs_g, fat_g, fiber_g: 45, sugar_g: 25, saturated_fat_g: Math.round(fat_g * 0.2), sodium_mg: 1800, water_ml: 2800, protein_per_kg }
    }
    case 'diabetic': {
      const protein_per_kg = 1.6
      const protein_g = Math.round(weightKg * protein_per_kg)
      const calories = tdee - 300
      const fat_g = Math.round((calories * 0.35) / 9)
      const carbs_g = Math.round((calories - protein_g * 4 - fat_g * 9) / 4)
      const net_carbs_g = Math.round(carbs_g * 0.7)
      return { calories, protein_g, carbs_g, fat_g, fiber_g: 35, sugar_g: 25, saturated_fat_g: Math.round(fat_g * 0.25), sodium_mg: 2000, water_ml: 2800, protein_per_kg, net_carbs_g }
    }
    case 'recovery': {
      const protein_per_kg = 2.0
      const protein_g = Math.round(weightKg * protein_per_kg)
      const calories = tdee + 100
      const fat_g = Math.round((calories * 0.3) / 9)
      const carbs_g = Math.round((calories - protein_g * 4 - fat_g * 9) / 4)
      return { calories, protein_g, carbs_g, fat_g, fiber_g: 35, sugar_g: 40, saturated_fat_g: Math.round(fat_g * 0.2), sodium_mg: 2000, water_ml: 3500, protein_per_kg }
    }
    case 'custom': {
      if (!customTargets) throw new Error('Custom targets required for goal type "custom"')
      return {
        calories: customTargets.calories ?? tdee,
        protein_g: customTargets.protein_g ?? Math.round(weightKg * 1.6),
        carbs_g: customTargets.carbs_g ?? Math.round((tdee * 0.45) / 4),
        fat_g: customTargets.fat_g ?? Math.round((tdee * 0.3) / 9),
        fiber_g: customTargets.fiber_g ?? 30,
        sugar_g: customTargets.sugar_g ?? 50,
        saturated_fat_g: customTargets.saturated_fat_g ?? 20,
        sodium_mg: customTargets.sodium_mg ?? 2300,
        water_ml: customTargets.water_ml ?? 2500,
        protein_per_kg: customTargets.protein_per_kg ?? 1.6,
        ...customTargets,
      }
    }
    default:
      throw new Error(`Unknown goal type: ${goalType}`)
  }
}
