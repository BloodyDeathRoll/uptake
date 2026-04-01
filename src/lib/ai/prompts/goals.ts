import type { ActivityLevel, GoalType } from '@/lib/utils/constants'
import type { NutrientTargets } from '@/lib/nutrition/targets'

interface GoalPromptParams {
  weightKg: number
  heightCm: number
  age: number
  sex: string | null
  activityLevel: ActivityLevel
  goalType: GoalType
  calculatedTargets: NutrientTargets
  dietaryPreferences?: string[]
}

export function buildGoalRationalePrompt(params: GoalPromptParams): string {
  const { weightKg, heightCm, age, sex, activityLevel, goalType, calculatedTargets, dietaryPreferences } = params

  return `You are a registered dietitian. A user has set up their nutrition profile. Generate a clear, encouraging explanation of their personalized daily nutrition targets.

User profile:
- Weight: ${weightKg}kg
- Height: ${heightCm}cm
- Age: ${age}
- Sex: ${sex ?? 'not specified'}
- Activity level: ${activityLevel}
- Goal: ${goalType}
- Dietary preferences: ${dietaryPreferences?.join(', ') || 'none specified'}

Calculated daily targets:
- Calories: ${calculatedTargets.calories} kcal
- Protein: ${calculatedTargets.protein_g}g (${calculatedTargets.protein_per_kg.toFixed(1)}g per kg bodyweight)
- Carbohydrates: ${calculatedTargets.carbs_g}g
- Fat: ${calculatedTargets.fat_g}g
- Fiber: ${calculatedTargets.fiber_g}g
- Water: ${calculatedTargets.water_ml}ml

Write 2-3 sentences (max 100 words) explaining:
1. Why these specific calorie and protein targets make sense for their goal
2. One practical tip for hitting the targets

Tone: Direct, supportive, evidence-based. Do not hedge excessively. Do not give medical advice.
Return only the explanation text — no JSON, no headers.`
}
