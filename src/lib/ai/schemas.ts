import { z } from 'zod'

export const nutritionItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  calories: z.number().min(0),
  protein_g: z.number().min(0),
  carbs_g: z.number().min(0),
  fat_g: z.number().min(0),
  fiber_g: z.number().min(0).optional(),
  sugar_g: z.number().min(0).optional(),
  saturated_fat_g: z.number().min(0).optional(),
  sodium_mg: z.number().min(0).optional(),
  food_group: z.enum(['protein', 'grain', 'vegetable', 'fruit', 'dairy', 'fat', 'beverage', 'other']).optional(),
  confidence: z.enum(['high', 'medium', 'low']),
})

export const nutritionResponseSchema = z.object({
  items: z.array(nutritionItemSchema),
  total_calories: z.number().min(0),
  notes: z.string().optional(),
  suggested_description: z.string().optional(),
  image_type: z.enum(['meal', 'ingredient_list']).optional(),
})

export type ValidatedNutritionItem = z.infer<typeof nutritionItemSchema>
export type ValidatedNutritionResponse = z.infer<typeof nutritionResponseSchema>

export function validateNutritionResponse(data: unknown): ValidatedNutritionResponse {
  return nutritionResponseSchema.parse(data)
}

export function safeValidateNutritionResponse(data: unknown) {
  return nutritionResponseSchema.safeParse(data)
}
