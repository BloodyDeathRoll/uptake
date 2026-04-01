import type { MealItem } from '@/hooks/useMeals'

// Simulate the mapping logic used in meal/new/page.tsx when pre-populating from an existing meal
function mapApiItemsToMealItems(apiItems: Record<string, unknown>[]): MealItem[] {
  return apiItems.map(item => ({
    ingredient_name: item.ingredient_name as string,
    quantity: item.quantity as number,
    unit: item.unit as string,
    calories: item.calories as number ?? null,
    protein_g: item.protein_g as number ?? null,
    carbs_g: item.carbs_g as number ?? null,
    fat_g: item.fat_g as number ?? null,
    fiber_g: item.fiber_g as number ?? null,
    sugar_g: item.sugar_g as number ?? null,
    saturated_fat_g: item.saturated_fat_g as number ?? null,
    sodium_mg: item.sodium_mg as number ?? null,
    food_group: item.food_group as string ?? null,
    confidence: item.confidence as 'high' | 'medium' | 'low' ?? null,
    source: (item.source as MealItem['source']) ?? 'user_manual',
    was_corrected: false,
    original_ai_estimate: null,
  }))
}

// Simulate the save payload construction used in handleSave
function buildSavePayload(
  mealType: string,
  description: string,
  items: MealItem[],
  revisionOf: string | null
) {
  return {
    mealType,
    humanDescription: description || null,
    items,
    ...(revisionOf ? { revisionOf } : {}),
  }
}

const sampleApiItem: Record<string, unknown> = {
  id: 'item-1',
  ingredient_name: 'Grilled chicken breast',
  quantity: 200,
  unit: 'g',
  calories: 330,
  protein_g: 62,
  carbs_g: 0,
  fat_g: 7,
  fiber_g: 0,
  sugar_g: 0,
  saturated_fat_g: 2,
  sodium_mg: 140,
  food_group: 'protein',
  confidence: 'high',
  source: 'ai_text',
}

describe('meal edit: pre-population mapping', () => {
  test('maps ingredient_name correctly', () => {
    const [item] = mapApiItemsToMealItems([sampleApiItem])
    expect(item.ingredient_name).toBe('Grilled chicken breast')
  })

  test('maps quantity and unit correctly', () => {
    const [item] = mapApiItemsToMealItems([sampleApiItem])
    expect(item.quantity).toBe(200)
    expect(item.unit).toBe('g')
  })

  test('maps all macros correctly', () => {
    const [item] = mapApiItemsToMealItems([sampleApiItem])
    expect(item.calories).toBe(330)
    expect(item.protein_g).toBe(62)
    expect(item.carbs_g).toBe(0)
    expect(item.fat_g).toBe(7)
  })

  test('maps confidence correctly', () => {
    const [item] = mapApiItemsToMealItems([sampleApiItem])
    expect(item.confidence).toBe('high')
  })

  test('preserves source from original item', () => {
    const [item] = mapApiItemsToMealItems([sampleApiItem])
    expect(item.source).toBe('ai_text')
  })

  test('resets was_corrected to false', () => {
    const correctedItem = { ...sampleApiItem, was_corrected: true }
    const [item] = mapApiItemsToMealItems([correctedItem])
    expect(item.was_corrected).toBe(false)
  })

  test('clears original_ai_estimate', () => {
    const [item] = mapApiItemsToMealItems([sampleApiItem])
    expect(item.original_ai_estimate).toBeNull()
  })

  test('maps multiple items', () => {
    const rice: Record<string, unknown> = {
      ...sampleApiItem, id: 'item-2', ingredient_name: 'Brown rice',
      quantity: 150, calories: 165, protein_g: 3.5, carbs_g: 34,
    }
    const items = mapApiItemsToMealItems([sampleApiItem, rice])
    expect(items).toHaveLength(2)
    expect(items[1].ingredient_name).toBe('Brown rice')
  })

  test('handles missing optional fields gracefully', () => {
    const minimalItem: Record<string, unknown> = {
      ingredient_name: 'Apple',
      quantity: 1,
      unit: 'medium',
      calories: 95,
      protein_g: 0.5,
      carbs_g: 25,
      fat_g: 0.3,
    }
    const [item] = mapApiItemsToMealItems([minimalItem])
    expect(item.ingredient_name).toBe('Apple')
    expect(item.fiber_g).toBeNull()
    expect(item.sodium_mg).toBeNull()
    expect(item.source).toBe('user_manual')
  })
})

describe('meal edit: save payload includes revisionOf', () => {
  const items = mapApiItemsToMealItems([sampleApiItem])

  test('includes revisionOf when editing', () => {
    const payload = buildSavePayload('lunch', 'Chicken and rice', items, 'meal-abc-123')
    expect(payload.revisionOf).toBe('meal-abc-123')
  })

  test('omits revisionOf when creating new meal', () => {
    const payload = buildSavePayload('lunch', 'Chicken and rice', items, null)
    expect(payload).not.toHaveProperty('revisionOf')
  })

  test('sets humanDescription to null when description is empty', () => {
    const payload = buildSavePayload('snack', '', items, null)
    expect(payload.humanDescription).toBeNull()
  })

  test('preserves description when provided', () => {
    const payload = buildSavePayload('dinner', 'Steak with veggies', items, null)
    expect(payload.humanDescription).toBe('Steak with veggies')
  })

  test('passes mealType correctly', () => {
    const payload = buildSavePayload('breakfast', '', items, null)
    expect(payload.mealType).toBe('breakfast')
  })

  test('includes all items in payload', () => {
    const payload = buildSavePayload('lunch', 'test', items, null)
    expect(payload.items).toHaveLength(1)
    expect(payload.items[0].ingredient_name).toBe('Grilled chicken breast')
  })
})
