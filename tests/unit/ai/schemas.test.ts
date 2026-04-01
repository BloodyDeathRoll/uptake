import { validateNutritionResponse, safeValidateNutritionResponse } from '@/lib/ai/schemas'

const validResponse = {
  items: [
    {
      name: 'grilled chicken breast',
      quantity: 200,
      unit: 'g',
      calories: 330,
      protein_g: 62,
      carbs_g: 0,
      fat_g: 7.2,
      food_group: 'protein',
      confidence: 'high',
    },
  ],
  total_calories: 330,
  notes: 'Estimated from photo',
}

describe('validateNutritionResponse', () => {
  test('passes for valid response', () => {
    expect(() => validateNutritionResponse(validResponse)).not.toThrow()
  })

  test('returns parsed object with correct types', () => {
    const result = validateNutritionResponse(validResponse)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].name).toBe('grilled chicken breast')
    expect(result.total_calories).toBe(330)
  })

  test('passes for response without optional fields', () => {
    const minimal = {
      items: [{ name: 'apple', quantity: 1, unit: 'piece', calories: 95, protein_g: 0.5, carbs_g: 25, fat_g: 0.3, confidence: 'medium' }],
      total_calories: 95,
    }
    expect(() => validateNutritionResponse(minimal)).not.toThrow()
  })

  test('throws for missing items array', () => {
    expect(() => validateNutritionResponse({ total_calories: 100 })).toThrow()
  })

  test('throws for negative calories on an item', () => {
    const bad = { ...validResponse, items: [{ ...validResponse.items[0], calories: -50 }] }
    expect(() => validateNutritionResponse(bad)).toThrow()
  })

  test('throws for invalid confidence value', () => {
    const bad = { ...validResponse, items: [{ ...validResponse.items[0], confidence: 'very_high' }] }
    expect(() => validateNutritionResponse(bad)).toThrow()
  })

  test('throws for negative total_calories', () => {
    const bad = { ...validResponse, total_calories: -100 }
    expect(() => validateNutritionResponse(bad)).toThrow()
  })

  test('throws for empty item name', () => {
    const bad = { ...validResponse, items: [{ ...validResponse.items[0], name: '' }] }
    expect(() => validateNutritionResponse(bad)).toThrow()
  })
})

describe('safeValidateNutritionResponse', () => {
  test('returns success=true for valid response', () => {
    const result = safeValidateNutritionResponse(validResponse)
    expect(result.success).toBe(true)
  })

  test('returns success=false for invalid response', () => {
    const result = safeValidateNutritionResponse({ items: 'not an array' })
    expect(result.success).toBe(false)
  })

  test('does not throw for invalid input', () => {
    expect(() => safeValidateNutritionResponse(null)).not.toThrow()
    expect(() => safeValidateNutritionResponse(undefined)).not.toThrow()
    expect(() => safeValidateNutritionResponse('string')).not.toThrow()
  })
})
