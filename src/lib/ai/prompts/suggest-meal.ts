import type { PrioritySignal } from '@/lib/nutrition/priority'

// Returns explicit food rules that must be enforced for a given goal type.
export function buildGoalConstraints(goalType: string): string[] {
  switch (goalType.toLowerCase().replace(/\s+/g, '_')) {
    case 'diabetic':
      return [
        'NO added sugar, sugary drinks, candy, sweetened foods, honey, syrup, or fruit juice',
        'NO white bread, white rice, or other refined carbohydrates — use whole-grain alternatives',
        'NO high-GI foods (e.g. white potato, white pasta in large portions)',
        'Keep net carbs per meal low (target under ~30 g net carbs)',
      ]
    case 'heart_healthy':
      return [
        'NO fried foods, NO trans fats (no margarine, shortening, partially-hydrogenated oils)',
        'Limit saturated fat — avoid fatty red meat, full-fat dairy, palm oil, coconut oil',
        'Limit sodium — avoid cured/processed meats, salty snacks, high-sodium sauces',
        'Prefer omega-3 sources (salmon, sardines, walnuts, flaxseed) and soluble fiber',
      ]
    case 'longevity':
      return [
        'NO ultra-processed foods (packaged snacks, fast food, processed meats)',
        'NO added sugar or sugary drinks',
        'Prefer whole plants, legumes, nuts, seeds, and fermented foods',
      ]
    case 'recovery':
      return [
        'Avoid alcohol, fried foods, and high-sugar items that drive inflammation',
        'Prefer anti-inflammatory foods: fatty fish, berries, leafy greens, turmeric, ginger',
      ]
    case 'weight_loss':
    case 'athlete_cut':
      return [
        'Avoid liquid calories (juice, soda, sugary coffee drinks, alcohol)',
        'Avoid calorie-dense fried foods and cream-based or oil-heavy sauces',
      ]
    default:
      return []
  }
}

// Removes meals whose descriptions mention any of the given allergen keywords.
export function filterMealsByAllergens<T extends { description: string }>(
  meals: T[],
  allergens: string[],
): T[] {
  if (allergens.length === 0) return meals
  return meals.filter(m =>
    !allergens.some(a => m.description.toLowerCase().includes(a.toLowerCase()))
  )
}

export function buildDietaryBlock(preferences: string[], allergies: string[], goalType = ''): string {
  const lines: string[] = []

  if (preferences.length > 0) {
    lines.push(`Diet: ${preferences.join(', ')}`)

    const exclusions: string[] = []
    const p = preferences.map(x => x.toLowerCase())
    if (p.some(x => x.includes('vegan'))) {
      exclusions.push('NO meat, poultry, fish, seafood, eggs, dairy, or any other animal products')
    } else if (p.some(x => x.includes('vegetarian'))) {
      exclusions.push('NO meat, poultry, fish, or seafood of any kind')
    }
    if (p.some(x => x.includes('gluten'))) exclusions.push('NO gluten (no wheat, barley, rye)')
    if (p.some(x => x.includes('dairy') || x.includes('lactose'))) exclusions.push('NO dairy products')
    if (p.some(x => x.includes('keto'))) exclusions.push('very low carb, high fat (keto)')
    if (p.some(x => x.includes('paleo'))) exclusions.push('NO grains, legumes, or processed foods')
    if (exclusions.length > 0) lines.push(...exclusions)
  }

  if (allergies.length > 0) {
    lines.push(`Allergies — NEVER include: ${allergies.join(', ')}`)
  }

  const goalRules = buildGoalConstraints(goalType)
  if (goalRules.length > 0) {
    lines.push(`Goal constraints (${goalType.replace(/_/g, ' ')}):`)
    lines.push(...goalRules)
  }

  if (lines.length === 0) return ''

  return `\n⚠️ HARD DIETARY CONSTRAINTS — every suggestion MUST comply, no exceptions:\n${lines.map(l => `- ${l}`).join('\n')}\n`
}

export function buildSuggestMealPrompt(params: {
  consumed: { calories: number; protein: number; carbs: number; fat: number }
  targets: { calories: number; protein: number; carbs: number; fat: number }
  goalType: string
  hourOfDay: number
  dietaryPreferences: string[]
  allergies: string[]
  location?: string
  priority: PrioritySignal
  mealTimingContext?: string
  foodGroupContext?: string
  lang?: string
}): string {
  const { consumed, targets, goalType, hourOfDay, dietaryPreferences, allergies, location, priority, mealTimingContext, foodGroupContext, lang } = params
  const remaining = {
    calories: Math.max(targets.calories - consumed.calories, 0),
    protein: Math.max(targets.protein - consumed.protein, 0),
    carbs: Math.max(targets.carbs - consumed.carbs, 0),
    fat: Math.max(targets.fat - consumed.fat, 0),
  }

  // Calculate calorie overage percentage
  const calorieOveragePct = consumed.calories > targets.calories
    ? ((consumed.calories - targets.calories) / targets.calories) * 100
    : 0
  const isSignificantlyOverCalories = calorieOveragePct > 2 // More than 2% over quota

  const mealTimeHint =
    hourOfDay < 10 ? 'breakfast'
    : hourOfDay < 14 ? 'lunch'
    : hourOfDay < 18 ? 'snack'
    : 'dinner'

  const dietaryBlock = buildDietaryBlock(dietaryPreferences, allergies, goalType)
  const locationLine = location ? `User location: ${location} — suggest meals that are culturally relevant and locally available there.\n` : ''

  const directionWord = priority.direction === 'under' ? `high-${priority.nutrient}` : `low-${priority.nutrient}`

  // Build calorie constraint block for when user is over quota
  const calorieConstraintBlock = isSignificantlyOverCalories ? `

🚨 CRITICAL CALORIE CONSTRAINT — User has exceeded their daily calorie target by ${Math.round(calorieOveragePct)}%!
- ONLY suggest extremely low-calorie options (ideally under ${Math.round(targets.calories * 0.05)} kcal, maximum ${Math.round(targets.calories * 0.10)} kcal per suggestion)
- Focus on high-protein, zero/very-low-calorie options: protein shakes, egg whites, lean protein, non-starchy vegetables
- If you cannot find 3 suggestions that are truly beneficial (i.e., very low calorie AND help with the priority nutrient), suggest fewer options or very minimal portions
- DO NOT suggest meals that would significantly worsen the calorie overage (anything over ${Math.round(targets.calories * 0.10)} kcal is too much)
- The user needs to minimize further calorie intake while still addressing nutritional gaps
` : ''

  const priorityBlock = `
⚡ TOP PRIORITY: "${priority.label}" is the most critical nutritional issue for this user's goal right now (currently at ${priority.pct}% of target, ${priority.direction}).
All 3 suggestions MUST be optimized for ${directionWord} content. If other macros conflict (e.g. carbs are over but protein is severely under), ${priority.label.toLowerCase()} takes precedence — suggest meals that fix the priority gap first, and keep other macros as reasonable as possible within that constraint.`

  const langInstruction = lang === 'he' ? 'IMPORTANT: Respond entirely in Hebrew (עברית). All meal names, descriptions, and text must be in Hebrew.\n\n' : ''

  return `${langInstruction}You are a nutrition coach. Your job is to suggest the 3 best next meals that will make the most meaningful progress towards the user's goal given what they've eaten so far today.
${dietaryBlock}${priorityBlock}${calorieConstraintBlock}${mealTimingContext ?? ''}${foodGroupContext ?? ''}
${locationLine}User's goal: ${goalType.replace(/_/g, ' ')}
Time of day: ~${hourOfDay}:00 — suggest ${mealTimeHint}

Consumed today:
- Calories: ${Math.round(consumed.calories)} / ${Math.round(targets.calories)} kcal
- Protein: ${Math.round(consumed.protein)} / ${Math.round(targets.protein)}g
- Carbs: ${Math.round(consumed.carbs)} / ${Math.round(targets.carbs)}g
- Fat: ${Math.round(consumed.fat)} / ${Math.round(targets.fat)}g

Remaining budget (what will bring the user closest to their daily targets):
- Calories: ~${Math.round(remaining.calories)} kcal
- Protein: ~${Math.round(remaining.protein)}g
- Carbs: ~${Math.round(remaining.carbs)}g
- Fat: ~${Math.round(remaining.fat)}g

Each suggestion should be chosen because it specifically addresses the priority gap above. The description should be specific enough for the user to log it immediately.

Return ONLY a JSON array of exactly 3 varied meal suggestions that fit the remaining budget and all dietary constraints. Format:
[
  {
    "name": "Short meal name",
    "description": "Specific ingredients and quantities ready to paste as a meal description, e.g. '150g grilled tofu, 200g sweet potato, steamed broccoli'",
    "meal_type": "breakfast|lunch|dinner|snack",
    "calories": 420,
    "protein_g": 35,
    "carbs_g": 40,
    "fat_g": 12
  }
]

No text outside the JSON array.`
}
