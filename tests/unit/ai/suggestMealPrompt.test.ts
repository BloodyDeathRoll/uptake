import { buildDietaryBlock, buildSuggestMealPrompt } from '@/lib/ai/prompts/suggest-meal'

const BASE_PARAMS = {
  consumed: { calories: 800, protein: 40, carbs: 90, fat: 25 },
  targets:  { calories: 2000, protein: 120, carbs: 220, fat: 65 },
  goalType: 'maintenance',
  hourOfDay: 12,
  dietaryPreferences: [],
  allergies: [],
}

// ─── buildDietaryBlock ────────────────────────────────────────────────────────

describe('buildDietaryBlock', () => {
  test('returns empty string when no preferences or allergies', () => {
    expect(buildDietaryBlock([], [])).toBe('')
  })

  test('includes vegetarian exclusion for meat, fish, and seafood', () => {
    const block = buildDietaryBlock(['vegetarian'], [])
    expect(block).toContain('NO meat, poultry, fish, or seafood')
    expect(block).not.toContain('eggs')   // eggs are ok for vegetarians
    expect(block).not.toContain('dairy')  // dairy is ok for vegetarians
  })

  test('includes full animal-product exclusion for vegan', () => {
    const block = buildDietaryBlock(['vegan'], [])
    expect(block).toContain('NO meat, poultry, fish, seafood, eggs, dairy')
  })

  test('vegan takes precedence over vegetarian when both present', () => {
    const block = buildDietaryBlock(['vegetarian', 'vegan'], [])
    expect(block).toContain('eggs')  // vegan block, not just vegetarian
  })

  test('includes gluten exclusion for gluten-free diet', () => {
    const block = buildDietaryBlock(['gluten-free'], [])
    expect(block).toContain('NO gluten')
    expect(block).toContain('wheat')
  })

  test('includes dairy exclusion for lactose-free diet', () => {
    const block = buildDietaryBlock(['lactose-free'], [])
    expect(block).toContain('NO dairy')
  })

  test('includes dairy exclusion for dairy-free diet', () => {
    const block = buildDietaryBlock(['dairy-free'], [])
    expect(block).toContain('NO dairy')
  })

  test('lists all allergies in the block', () => {
    const block = buildDietaryBlock([], ['peanuts', 'shellfish', 'tree nuts'])
    expect(block).toContain('peanuts')
    expect(block).toContain('shellfish')
    expect(block).toContain('tree nuts')
    expect(block).toContain('NEVER include')
  })

  test('combines diet and allergies', () => {
    const block = buildDietaryBlock(['vegetarian'], ['gluten'])
    expect(block).toContain('NO meat, poultry, fish, or seafood')
    expect(block).toContain('NEVER include')
    expect(block).toContain('gluten')
  })

  test('marks the block as a hard constraint', () => {
    const block = buildDietaryBlock(['vegetarian'], [])
    expect(block).toContain('HARD DIETARY CONSTRAINTS')
    expect(block).toContain('no exceptions')
  })

  test('is case-insensitive for preference matching', () => {
    const block = buildDietaryBlock(['Vegetarian'], [])
    expect(block).toContain('NO meat, poultry, fish, or seafood')
  })
})

// ─── buildSuggestMealPrompt ───────────────────────────────────────────────────

describe('buildSuggestMealPrompt — dietary constraints in prompt', () => {
  test('includes no dietary block when user has no restrictions', () => {
    const prompt = buildSuggestMealPrompt({ ...BASE_PARAMS })
    expect(prompt).not.toContain('HARD DIETARY CONSTRAINTS')
  })

  test('vegetarian: prompt explicitly forbids meat, fish, and seafood', () => {
    const prompt = buildSuggestMealPrompt({ ...BASE_PARAMS, dietaryPreferences: ['vegetarian'] })
    expect(prompt).toContain('NO meat, poultry, fish, or seafood')
    expect(prompt).toContain('HARD DIETARY CONSTRAINTS')
  })

  test('vegan: prompt forbids all animal products', () => {
    const prompt = buildSuggestMealPrompt({ ...BASE_PARAMS, dietaryPreferences: ['vegan'] })
    expect(prompt).toContain('NO meat, poultry, fish, seafood, eggs, dairy')
  })

  test('allergies appear in the prompt', () => {
    const prompt = buildSuggestMealPrompt({ ...BASE_PARAMS, allergies: ['peanuts', 'soy'] })
    expect(prompt).toContain('peanuts')
    expect(prompt).toContain('soy')
    expect(prompt).toContain('NEVER include')
  })

  test('remaining budget is correctly calculated from consumed vs targets', () => {
    const prompt = buildSuggestMealPrompt({ ...BASE_PARAMS })
    // remaining calories = 2000 - 800 = 1200
    expect(prompt).toContain('1200')
    // remaining protein = 120 - 40 = 80
    expect(prompt).toContain('80g')
  })

  test('remaining budget floors at 0 when target already exceeded', () => {
    const overBudget = {
      ...BASE_PARAMS,
      consumed: { calories: 2500, protein: 150, carbs: 250, fat: 80 },
    }
    const prompt = buildSuggestMealPrompt(overBudget)
    // All remaining values should be 0, not negative
    expect(prompt).not.toMatch(/~-\d+ kcal/)
    expect(prompt).toContain('~0 kcal')
  })

  test('meal time hint is correct for morning hours', () => {
    const prompt = buildSuggestMealPrompt({ ...BASE_PARAMS, hourOfDay: 8 })
    expect(prompt).toContain('breakfast')
  })

  test('meal time hint is correct for midday hours', () => {
    const prompt = buildSuggestMealPrompt({ ...BASE_PARAMS, hourOfDay: 13 })
    expect(prompt).toContain('lunch')
  })

  test('meal time hint is correct for afternoon hours', () => {
    const prompt = buildSuggestMealPrompt({ ...BASE_PARAMS, hourOfDay: 16 })
    expect(prompt).toContain('snack')
  })

  test('meal time hint is correct for evening hours', () => {
    const prompt = buildSuggestMealPrompt({ ...BASE_PARAMS, hourOfDay: 19 })
    expect(prompt).toContain('dinner')
  })

  test('goal type underscores are replaced with spaces', () => {
    const prompt = buildSuggestMealPrompt({ ...BASE_PARAMS, goalType: 'muscle_gain' })
    expect(prompt).toContain('muscle gain')
    expect(prompt).not.toContain('muscle_gain')
  })

  test('prompt requests JSON array output', () => {
    const prompt = buildSuggestMealPrompt({ ...BASE_PARAMS })
    expect(prompt).toContain('JSON array')
    expect(prompt).toContain('meal_type')
    expect(prompt).toContain('protein_g')
  })
})
