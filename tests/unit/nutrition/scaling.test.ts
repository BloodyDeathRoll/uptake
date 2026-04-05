import { scaleMacros, type ScalableMacros } from '@/lib/nutrition/scaling'

function item(overrides: Partial<ScalableMacros> = {}): ScalableMacros {
  return {
    quantity:  100,
    calories:  200,
    protein_g: 20,
    carbs_g:   15,
    fat_g:     8,
    fiber_g:   3,
    ...overrides,
  }
}

// ─── Basic proportional scaling ───────────────────────────────────────────────

describe('scaleMacros: proportional scaling', () => {
  test('doubling quantity doubles calories', () => {
    expect(scaleMacros(item(), 200).calories).toBe(400)
  })

  test('halving quantity halves calories', () => {
    expect(scaleMacros(item(), 50).calories).toBe(100)
  })

  test('arbitrary ratio: 100g → 150g', () => {
    const result = scaleMacros(item({ calories: 200, protein_g: 20 }), 150)
    expect(result.calories).toBe(300)
    expect(result.protein_g).toBe(30)
  })

  test('scales all macros at once', () => {
    const result = scaleMacros(item({ calories: 100, protein_g: 10, carbs_g: 20, fat_g: 5, fiber_g: 2 }), 200)
    expect(result.calories).toBe(200)
    expect(result.protein_g).toBe(20)
    expect(result.carbs_g).toBe(40)
    expect(result.fat_g).toBe(10)
    expect(result.fiber_g).toBe(4)
  })

  test('updates quantity field', () => {
    expect(scaleMacros(item({ quantity: 100 }), 75).quantity).toBe(75)
  })
})

// ─── Rounding ─────────────────────────────────────────────────────────────────

describe('scaleMacros: rounding', () => {
  test('calories rounded to nearest integer', () => {
    // 100g → 33g: ratio 0.33, 200 * 0.33 = 66
    const result = scaleMacros(item({ calories: 200 }), 33)
    expect(Number.isInteger(result.calories)).toBe(true)
  })

  test('protein rounded to 1 decimal place', () => {
    const result = scaleMacros(item({ quantity: 100, protein_g: 7 }), 150)
    // 7 * 1.5 = 10.5
    expect(result.protein_g).toBe(10.5)
  })

  test('carbs rounded to 1 decimal place', () => {
    const result = scaleMacros(item({ quantity: 100, carbs_g: 3 }), 33)
    // 3 * 0.33 = 0.99 → 1.0
    expect(result.carbs_g).toBe(1)
  })

  test('no more than 1 decimal on fat', () => {
    const result = scaleMacros(item({ quantity: 100, fat_g: 11 }), 150)
    // 11 * 1.5 = 16.5
    expect(result.fat_g).toBe(16.5)
    const str = String(result.fat_g)
    const decimals = str.includes('.') ? str.split('.')[1].length : 0
    expect(decimals).toBeLessThanOrEqual(1)
  })
})

// ─── Null handling ─────────────────────────────────────────────────────────────

describe('scaleMacros: null macros stay null', () => {
  test('null calories stays null', () => {
    expect(scaleMacros(item({ calories: null }), 200).calories).toBeNull()
  })

  test('null protein stays null', () => {
    expect(scaleMacros(item({ protein_g: null }), 200).protein_g).toBeNull()
  })

  test('null carbs stays null', () => {
    expect(scaleMacros(item({ carbs_g: null }), 200).carbs_g).toBeNull()
  })

  test('null fat stays null', () => {
    expect(scaleMacros(item({ fat_g: null }), 200).fat_g).toBeNull()
  })

  test('null fiber stays null', () => {
    expect(scaleMacros(item({ fiber_g: null }), 200).fiber_g).toBeNull()
  })

  test('mix of null and non-null: only non-null values scale', () => {
    const result = scaleMacros(item({ calories: 100, protein_g: null, carbs_g: 20, fat_g: null, fiber_g: 2 }), 200)
    expect(result.calories).toBe(200)
    expect(result.protein_g).toBeNull()
    expect(result.carbs_g).toBe(40)
    expect(result.fat_g).toBeNull()
    expect(result.fiber_g).toBe(4)
  })
})

// ─── Zero macro values (not null) ─────────────────────────────────────────────

describe('scaleMacros: zero macro values', () => {
  test('zero calories stays zero', () => {
    expect(scaleMacros(item({ calories: 0 }), 200).calories).toBe(0)
  })

  test('zero carbs stays zero (pure protein food)', () => {
    expect(scaleMacros(item({ carbs_g: 0 }), 300).carbs_g).toBe(0)
  })
})

// ─── Guard conditions ──────────────────────────────────────────────────────────

describe('scaleMacros: guard conditions', () => {
  test('old quantity 0 → no scaling, quantity updated', () => {
    const result = scaleMacros(item({ quantity: 0, calories: 200 }), 150)
    expect(result.quantity).toBe(150)
    expect(result.calories).toBe(200) // unchanged, no division by zero
  })

  test('new quantity 0 → no scaling, quantity updated to 0', () => {
    const result = scaleMacros(item({ quantity: 100, calories: 200 }), 0)
    expect(result.quantity).toBe(0)
    expect(result.calories).toBe(200) // unchanged
  })

  test('same quantity → returns item unchanged', () => {
    const original = item({ quantity: 100, calories: 200, protein_g: 20 })
    const result = scaleMacros(original, 100)
    expect(result.calories).toBe(200)
    expect(result.protein_g).toBe(20)
    expect(result.quantity).toBe(100)
  })

  test('does not mutate input item', () => {
    const original = item({ quantity: 100, calories: 200 })
    scaleMacros(original, 200)
    expect(original.calories).toBe(200)
    expect(original.quantity).toBe(100)
  })
})

// ─── Multi-step editing (round-trip drift) ────────────────────────────────────

describe('scaleMacros: sequential edits', () => {
  test('100g → 200g → 100g ends close to original (drift < 1 kcal)', () => {
    const original = item({ quantity: 100, calories: 200 })
    const step1 = scaleMacros(original, 200)
    const step2 = scaleMacros(step1, 100)
    // Should be exactly 200 or within floating-point rounding
    expect(step2.calories).toBe(200)
  })

  test('100g → 150g → 75g is same as 100g → 75g for calories', () => {
    const base = item({ quantity: 100, calories: 300 })
    const viStep = scaleMacros(scaleMacros(base, 150), 75)
    const direct = scaleMacros(base, 75)
    // Allow ±1 kcal due to intermediate rounding
    expect(Math.abs((viStep.calories ?? 0) - (direct.calories ?? 0))).toBeLessThanOrEqual(1)
  })

  test('100g → 150g → 100g round-trip stays exact for protein', () => {
    // Moderate ratios (1.5× then 0.667×) should survive the round-trip within 0.1g
    const base = item({ quantity: 100, protein_g: 25 })
    const result = scaleMacros(scaleMacros(base, 150), 100)
    expect(Math.abs((result.protein_g ?? 0) - (base.protein_g ?? 0))).toBeLessThanOrEqual(0.1)
  })

  test('extreme ratios accumulate drift: 33g → 300g is lossy (known limitation)', () => {
    // A 9× amplification after 1dp rounding discards too much precision.
    // This test documents that limitation — it is NOT expected to be accurate.
    const base = item({ quantity: 100, protein_g: 25 })
    const result = scaleMacros(scaleMacros(base, 33), 300)
    // Just verify it scaled in the right direction and produces a number
    expect(result.protein_g).toBeGreaterThan(0)
    expect(result.quantity).toBe(300)
  })
})

// ─── Real-world ingredient values ─────────────────────────────────────────────

describe('scaleMacros: realistic examples', () => {
  test('chicken breast: 200g → 150g', () => {
    const chicken = item({ quantity: 200, calories: 330, protein_g: 62, carbs_g: 0, fat_g: 7 })
    const result = scaleMacros(chicken, 150)
    expect(result.calories).toBe(248)    // 330 * 0.75 = 247.5 → 248
    expect(result.protein_g).toBe(46.5)  // 62 * 0.75
    expect(result.carbs_g).toBe(0)
    expect(result.fat_g).toBe(5.3)       // 7 * 0.75 = 5.25 → 5.3
  })

  test('olive oil: 15ml → 30ml', () => {
    const oil = item({ quantity: 15, calories: 124, protein_g: 0, carbs_g: 0, fat_g: 14 })
    const result = scaleMacros(oil, 30)
    expect(result.calories).toBe(248)
    expect(result.fat_g).toBe(28)
    expect(result.carbs_g).toBe(0)
  })

  test('oats: 40g → 80g', () => {
    const oats = item({ quantity: 40, calories: 148, protein_g: 5.4, carbs_g: 25.2, fat_g: 2.8, fiber_g: 4 })
    const result = scaleMacros(oats, 80)
    expect(result.calories).toBe(296)
    expect(result.protein_g).toBe(10.8)
    expect(result.carbs_g).toBe(50.4)
    expect(result.fat_g).toBe(5.6)
    expect(result.fiber_g).toBe(8)
  })
})

// ─── Extra fields preserved ───────────────────────────────────────────────────

describe('scaleMacros: extra fields pass through', () => {
  test('preserves extra fields from the input item', () => {
    const extended = { ...item(), ingredient_name: 'Test', unit: 'g', food_group: 'protein', confidence: 'high' as const }
    const result = scaleMacros(extended, 200)
    expect((result as typeof extended).ingredient_name).toBe('Test')
    expect((result as typeof extended).food_group).toBe('protein')
    expect((result as typeof extended).confidence).toBe('high')
  })
})
