export interface ScalableMacros {
  quantity: number
  calories:         number | null
  protein_g:        number | null
  carbs_g:          number | null
  fat_g:            number | null
  fiber_g:          number | null
}

/**
 * Scale all macros proportionally to a new quantity.
 * Returns a new object — does not mutate the input.
 *
 * Rules:
 * - If oldQty ≤ 0 or newQty ≤ 0, macros are left unchanged (can't divide by zero).
 * - If oldQty === newQty, returns the item unchanged.
 * - calories are rounded to the nearest integer.
 * - all other macros are rounded to one decimal place.
 * - null macros remain null.
 * - zero macros (explicitly 0) are scaled (0 × r = 0).
 */
export function scaleMacros<T extends ScalableMacros>(item: T, newQty: number): T {
  const oldQty = item.quantity
  if (oldQty <= 0 || newQty <= 0 || newQty === oldQty) return { ...item, quantity: newQty }

  const r = newQty / oldQty

  const round1dp = (v: number | null): number | null =>
    v !== null ? Math.round(v * r * 10) / 10 : null

  return {
    ...item,
    quantity:  newQty,
    calories:  item.calories !== null ? Math.round(item.calories * r) : null,
    protein_g: round1dp(item.protein_g),
    carbs_g:   round1dp(item.carbs_g),
    fat_g:     round1dp(item.fat_g),
    fiber_g:   round1dp(item.fiber_g),
  }
}
