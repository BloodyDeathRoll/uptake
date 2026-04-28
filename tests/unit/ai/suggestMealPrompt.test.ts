import { buildDietaryBlock, buildGoalConstraints, buildSuggestMealPrompt, filterMealsByAllergens } from '@/lib/ai/prompts/suggest-meal'
import type { PrioritySignal } from '@/lib/nutrition/priority'

const BASE_PRIORITY: PrioritySignal = {
  nutrient: 'protein',
  pct: 33,
  direction: 'under',
  label: 'Protein',
}

const BASE_PARAMS = {
  consumed: { calories: 800, protein: 40, carbs: 90, fat: 25 },
  targets:  { calories: 2000, protein: 120, carbs: 220, fat: 65 },
  goalType: 'maintenance',
  hourOfDay: 12,
  dietaryPreferences: [],
  allergies: [],
  priority: BASE_PRIORITY,
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

  test('includes critical calorie constraint when significantly over quota', () => {
    const overQuota = {
      ...BASE_PARAMS,
      consumed: { calories: 2080, protein: 40, carbs: 90, fat: 25 }, // 4% over 2000 target
    }
    const prompt = buildSuggestMealPrompt(overQuota)
    expect(prompt).toContain('CRITICAL CALORIE CONSTRAINT')
    expect(prompt).toContain('exceeded their daily calorie target')
    expect(prompt).toContain('extremely low-calorie')
    expect(prompt).toContain('high-protein')
  })

  test('does not include calorie constraint when under or slightly over quota', () => {
    const slightlyOver = {
      ...BASE_PARAMS,
      consumed: { calories: 2020, protein: 40, carbs: 90, fat: 25 }, // Only 1% over
    }
    const prompt = buildSuggestMealPrompt(slightlyOver)
    expect(prompt).not.toContain('CRITICAL CALORIE CONSTRAINT')
  })

  test('calorie constraint specifies maximum calorie limits based on target', () => {
    const overQuota = {
      ...BASE_PARAMS,
      consumed: { calories: 2100, protein: 40, carbs: 90, fat: 25 }, // 5% over
    }
    const prompt = buildSuggestMealPrompt(overQuota)
    // Should suggest max 10% of 2000 = 200 kcal
    expect(prompt).toContain('200 kcal')
  })
})

// ─── buildGoalConstraints ─────────────────────────────────────────────────────

describe('buildGoalConstraints', () => {
  test('diabetic: forbids added sugar, sugary drinks, and sweetened foods', () => {
    const rules = buildGoalConstraints('diabetic')
    expect(rules.some(r => r.includes('NO added sugar'))).toBe(true)
    expect(rules.some(r => r.includes('sugary drinks'))).toBe(true)
  })

  test('diabetic: forbids refined carbohydrates including white bread and white rice', () => {
    const rules = buildGoalConstraints('diabetic')
    expect(rules.some(r => r.includes('white bread') && r.includes('white rice'))).toBe(true)
    expect(rules.some(r => r.includes('refined carbohydrates'))).toBe(true)
  })

  test('diabetic: specifies a net carb limit per meal', () => {
    const rules = buildGoalConstraints('diabetic')
    expect(rules.some(r => r.includes('net carbs'))).toBe(true)
  })

  test('heart_healthy: forbids fried foods and trans fats', () => {
    const rules = buildGoalConstraints('heart_healthy')
    expect(rules.some(r => r.includes('NO fried foods') && r.includes('trans fat'))).toBe(true)
  })

  test('heart_healthy: limits saturated fat and sodium', () => {
    const rules = buildGoalConstraints('heart_healthy')
    expect(rules.some(r => r.includes('saturated fat'))).toBe(true)
    expect(rules.some(r => r.includes('sodium'))).toBe(true)
  })

  test('longevity: excludes ultra-processed foods', () => {
    const rules = buildGoalConstraints('longevity')
    expect(rules.some(r => r.includes('ultra-processed'))).toBe(true)
  })

  test('longevity: excludes added sugar', () => {
    const rules = buildGoalConstraints('longevity')
    expect(rules.some(r => r.includes('NO added sugar'))).toBe(true)
  })

  test('recovery: excludes alcohol and promotes anti-inflammatory foods', () => {
    const rules = buildGoalConstraints('recovery')
    expect(rules.some(r => r.includes('alcohol'))).toBe(true)
    expect(rules.some(r => r.includes('anti-inflammatory'))).toBe(true)
  })

  test('weight_loss: excludes liquid calories and fried foods', () => {
    const rules = buildGoalConstraints('weight_loss')
    expect(rules.some(r => r.includes('liquid calories'))).toBe(true)
    expect(rules.some(r => r.includes('fried'))).toBe(true)
  })

  test('athlete_cut: excludes liquid calories (same as weight_loss)', () => {
    const rules = buildGoalConstraints('athlete_cut')
    expect(rules.some(r => r.includes('liquid calories'))).toBe(true)
  })

  test('maintenance: returns no constraints', () => {
    expect(buildGoalConstraints('maintenance')).toEqual([])
  })

  test('muscle_gain: returns no food exclusions', () => {
    expect(buildGoalConstraints('muscle_gain')).toEqual([])
  })

  test('endurance: returns no exclusions (carb-heavy diet is fine)', () => {
    expect(buildGoalConstraints('endurance')).toEqual([])
  })

  test('recomposition: returns no exclusions', () => {
    expect(buildGoalConstraints('recomposition')).toEqual([])
  })

  test('custom: returns no exclusions', () => {
    expect(buildGoalConstraints('custom')).toEqual([])
  })

  test('unknown goal type: returns no constraints', () => {
    expect(buildGoalConstraints('unknown_goal')).toEqual([])
  })

  test('is case-insensitive for goal matching', () => {
    const rules = buildGoalConstraints('Diabetic')
    expect(rules.some(r => r.includes('NO added sugar'))).toBe(true)
  })

  test('handles goal with spaces instead of underscores', () => {
    const rules = buildGoalConstraints('heart healthy')
    expect(rules.some(r => r.includes('NO fried foods'))).toBe(true)
  })
})

// ─── buildDietaryBlock — goal constraint integration ─────────────────────────

describe('buildDietaryBlock — goal constraints', () => {
  test('diabetic goal produces a HARD CONSTRAINTS block even with no preferences or allergies', () => {
    const block = buildDietaryBlock([], [], 'diabetic')
    expect(block).toContain('HARD DIETARY CONSTRAINTS')
    expect(block).toContain('NO added sugar')
    expect(block).toContain('net carbs')
  })

  test('heart_healthy goal: block contains sodium and saturated fat restrictions', () => {
    const block = buildDietaryBlock([], [], 'heart_healthy')
    expect(block).toContain('NO fried foods')
    expect(block).toContain('sodium')
    expect(block).toContain('saturated fat')
  })

  test('longevity goal: block contains ultra-processed food exclusion', () => {
    const block = buildDietaryBlock([], [], 'longevity')
    expect(block).toContain('ultra-processed')
    expect(block).toContain('NO added sugar')
  })

  test('recovery goal: block excludes alcohol and calls for anti-inflammatory foods', () => {
    const block = buildDietaryBlock([], [], 'recovery')
    expect(block).toContain('alcohol')
    expect(block).toContain('anti-inflammatory')
  })

  test('weight_loss goal: block calls out liquid calories and fried foods', () => {
    const block = buildDietaryBlock([], [], 'weight_loss')
    expect(block).toContain('liquid calories')
    expect(block).toContain('fried')
  })

  test('maintenance goal with no restrictions: returns empty string', () => {
    expect(buildDietaryBlock([], [], 'maintenance')).toBe('')
  })

  test('goal constraints combine with dietary preferences in one block', () => {
    const block = buildDietaryBlock(['vegan'], [], 'diabetic')
    expect(block).toContain('NO meat, poultry, fish, seafood, eggs, dairy')
    expect(block).toContain('NO added sugar')
    expect(block).toContain('HARD DIETARY CONSTRAINTS')
  })

  test('goal constraints combine with allergies in one block', () => {
    const block = buildDietaryBlock([], ['peanuts'], 'heart_healthy')
    expect(block).toContain('NEVER include')
    expect(block).toContain('peanuts')
    expect(block).toContain('NO fried foods')
  })

  test('all three sources (preference + allergy + goal) appear in one block', () => {
    const block = buildDietaryBlock(['gluten-free'], ['shellfish'], 'diabetic')
    expect(block).toContain('NO gluten')
    expect(block).toContain('shellfish')
    expect(block).toContain('NO added sugar')
    expect(block).toContain('HARD DIETARY CONSTRAINTS')
  })
})

// ─── buildSuggestMealPrompt — goal-specific constraints ───────────────────────

describe('buildSuggestMealPrompt — goal-specific constraints in prompt', () => {
  test('diabetic: prompt explicitly forbids sugar and refined carbs', () => {
    const prompt = buildSuggestMealPrompt({ ...BASE_PARAMS, goalType: 'diabetic' })
    expect(prompt).toContain('NO added sugar')
    expect(prompt).toContain('HARD DIETARY CONSTRAINTS')
    expect(prompt).toContain('refined carbohydrates')
  })

  test('heart_healthy: prompt contains sodium and fat restrictions', () => {
    const prompt = buildSuggestMealPrompt({ ...BASE_PARAMS, goalType: 'heart_healthy' })
    expect(prompt).toContain('NO fried foods')
    expect(prompt).toContain('sodium')
  })

  test('longevity: prompt contains ultra-processed food exclusion', () => {
    const prompt = buildSuggestMealPrompt({ ...BASE_PARAMS, goalType: 'longevity' })
    expect(prompt).toContain('ultra-processed')
  })

  test('recovery: prompt excludes alcohol', () => {
    const prompt = buildSuggestMealPrompt({ ...BASE_PARAMS, goalType: 'recovery' })
    expect(prompt).toContain('alcohol')
  })

  test('maintenance: no hard constraint block when no other restrictions', () => {
    const prompt = buildSuggestMealPrompt({ ...BASE_PARAMS, goalType: 'maintenance' })
    expect(prompt).not.toContain('HARD DIETARY CONSTRAINTS')
  })

  test('diabetic + vegan: prompt contains both animal-product and sugar exclusions', () => {
    const prompt = buildSuggestMealPrompt({
      ...BASE_PARAMS,
      goalType: 'diabetic',
      dietaryPreferences: ['vegan'],
    })
    expect(prompt).toContain('NO meat, poultry, fish, seafood, eggs, dairy')
    expect(prompt).toContain('NO added sugar')
  })

  test('diabetic + peanut allergy: prompt contains both sugar rule and peanut NEVER include', () => {
    const prompt = buildSuggestMealPrompt({
      ...BASE_PARAMS,
      goalType: 'diabetic',
      allergies: ['peanuts'],
    })
    expect(prompt).toContain('NEVER include')
    expect(prompt).toContain('peanuts')
    expect(prompt).toContain('NO added sugar')
  })
})

// ─── filterMealsByAllergens ───────────────────────────────────────────────────

describe('filterMealsByAllergens', () => {
  const meals = [
    { description: 'Grilled chicken with rice and broccoli' },
    { description: 'Peanut butter toast with banana' },
    { description: 'Salmon salad with mixed greens' },
    { description: 'Shellfish pasta with garlic butter' },
    { description: 'Oats with blueberries and honey' },
    { description: 'Greek yogurt with granola and walnuts' },
  ]

  test('returns all meals when no allergens provided', () => {
    expect(filterMealsByAllergens(meals, [])).toHaveLength(meals.length)
  })

  test('removes meals containing the allergen keyword', () => {
    const result = filterMealsByAllergens(meals, ['peanut'])
    expect(result.some(m => m.description.includes('Peanut'))).toBe(false)
    expect(result).toHaveLength(meals.length - 1)
  })

  test('is case-insensitive', () => {
    const result = filterMealsByAllergens(meals, ['PEANUT'])
    expect(result.some(m => m.description.toLowerCase().includes('peanut'))).toBe(false)
  })

  test('removes multiple meals when multiple allergens match', () => {
    const result = filterMealsByAllergens(meals, ['peanut', 'shellfish'])
    expect(result.some(m => m.description.toLowerCase().includes('peanut'))).toBe(false)
    expect(result.some(m => m.description.toLowerCase().includes('shellfish'))).toBe(false)
    expect(result).toHaveLength(meals.length - 2)
  })

  test('returns empty array when every meal contains an allergen', () => {
    const peanutOnly = [
      { description: 'Peanut soup' },
      { description: 'Peanut butter cookies' },
    ]
    expect(filterMealsByAllergens(peanutOnly, ['peanut'])).toHaveLength(0)
  })

  test('keeps meals that contain no allergen', () => {
    const result = filterMealsByAllergens(meals, ['walnut'])
    // Only the walnut entry should be removed
    expect(result.some(m => m.description.includes('walnuts'))).toBe(false)
    expect(result.some(m => m.description.includes('Grilled chicken'))).toBe(true)
  })

  test('works with extra meal properties beyond description', () => {
    const richMeals = [
      { description: 'Peanut stew', calories: 400, meal_type: 'lunch' },
      { description: 'Rice bowl', calories: 300, meal_type: 'dinner' },
    ]
    const result = filterMealsByAllergens(richMeals, ['peanut'])
    expect(result).toHaveLength(1)
    expect(result[0].description).toBe('Rice bowl')
  })
})
