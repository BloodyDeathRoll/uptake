export interface ScalableMacros {
  quantity: number
  calories:         number | null
  protein_g:        number | null
  carbs_g:          number | null
  fat_g:            number | null
  fiber_g:          number | null
}

/** Per-unit (per 1g or 1ml) macro values used as a drift-free scaling anchor. */
export interface PerUnit {
  calories:  number | null
  protein_g: number | null
  carbs_g:   number | null
  fat_g:     number | null
  fiber_g:   number | null
}

/**
 * Compute per-unit macro rates from an item.
 * Returns undefined if quantity ≤ 0 (can't divide).
 */
export function computePerUnit(item: ScalableMacros): PerUnit | undefined {
  if (item.quantity <= 0) return undefined
  const q = item.quantity
  return {
    calories:  item.calories  !== null ? item.calories  / q : null,
    protein_g: item.protein_g !== null ? item.protein_g / q : null,
    carbs_g:   item.carbs_g   !== null ? item.carbs_g   / q : null,
    fat_g:     item.fat_g     !== null ? item.fat_g     / q : null,
    fiber_g:   item.fiber_g   !== null ? item.fiber_g   / q : null,
  }
}

/**
 * Apply per-unit rates to a new quantity, producing correctly scaled macros.
 * Calories rounded to integer; all others to 1 decimal place.
 */
export function applyPerUnit(pu: PerUnit, newQty: number): Pick<ScalableMacros, 'quantity' | 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'fiber_g'> {
  const r1dp = (v: number | null) => v !== null ? Math.round(v * newQty * 10) / 10 : null
  return {
    quantity:  newQty,
    calories:  pu.calories  !== null ? Math.round(pu.calories  * newQty) : null,
    protein_g: r1dp(pu.protein_g),
    carbs_g:   r1dp(pu.carbs_g),
    fat_g:     r1dp(pu.fat_g),
    fiber_g:   r1dp(pu.fiber_g),
  }
}

/**
 * Scale all macros proportionally to a new quantity.
 * Returns a new object — does not mutate the input.
 *
 * Prefer applyPerUnit() when a PerUnit anchor is available — this function
 * accumulates rounding drift on every call and should only be used as a
 * fallback for items that have no anchor (e.g. manually entered items).
 *
 * Rules:
 * - If oldQty ≤ 0 or newQty ≤ 0, quantity is updated but macros are unchanged.
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
    calories:  item.calories  !== null ? Math.round(item.calories * r) : null,
    protein_g: round1dp(item.protein_g),
    carbs_g:   round1dp(item.carbs_g),
    fat_g:     round1dp(item.fat_g),
    fiber_g:   round1dp(item.fiber_g),
  }
}
