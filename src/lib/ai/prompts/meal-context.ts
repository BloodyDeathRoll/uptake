interface MealHistoryItem {
  human_description: string | null
  meal_items: Array<{
    ingredient_name: string
    quantity: number
    unit: string
    calories: number | null
    protein_g: number | null
    carbs_g: number | null
    fat_g: number | null
    was_corrected: boolean
  }>
}

/**
 * Formats a user's recent meal history into a compact prompt context block.
 * Used to calibrate portion estimates and detect dietary patterns.
 */
export function buildMealHistoryContext(meals: MealHistoryItem[]): string {
  if (!meals || meals.length === 0) return ''

  const lines = meals
    .filter(m => m.meal_items?.length > 0)
    .slice(0, 12)
    .map(meal => {
      const label = meal.human_description ? `"${meal.human_description}"` : '(photo meal)'
      const items = meal.meal_items
        .slice(0, 4)
        .map(item => {
          const correction = item.was_corrected ? '*' : ''
          return `${item.ingredient_name} ${item.quantity}${item.unit} (${Math.round(item.calories ?? 0)} kcal, ${Math.round(item.protein_g ?? 0)}g P, ${Math.round(item.carbs_g ?? 0)}g C, ${Math.round(item.fat_g ?? 0)}g F)${correction}`
        })
        .join('; ')
      return `  • ${label} → ${items}`
    })
    .filter(Boolean)

  if (lines.length === 0) return ''

  return [
    '\n\nThis user\'s recent meal history (* = user-corrected the AI estimate):',
    lines.join('\n'),
    'Use this to calibrate portion sizes and detect the user\'s typical eating patterns.',
  ].join('\n')
}
