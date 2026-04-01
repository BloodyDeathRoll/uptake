export function buildDietaryBlock(preferences: string[], allergies: string[]): string {
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
}): string {
  const { consumed, targets, goalType, hourOfDay, dietaryPreferences, allergies, location } = params
  const remaining = {
    calories: Math.max(targets.calories - consumed.calories, 0),
    protein: Math.max(targets.protein - consumed.protein, 0),
    carbs: Math.max(targets.carbs - consumed.carbs, 0),
    fat: Math.max(targets.fat - consumed.fat, 0),
  }

  const mealTimeHint =
    hourOfDay < 10 ? 'breakfast'
    : hourOfDay < 14 ? 'lunch'
    : hourOfDay < 18 ? 'snack'
    : 'dinner'

  const dietaryBlock = buildDietaryBlock(dietaryPreferences, allergies)
  const locationLine = location ? `User location: ${location} — suggest meals that are culturally relevant and locally available there.\n` : ''

  return `You are a nutrition coach. Suggest 3 specific next meal options for a user.
${dietaryBlock}
${locationLine}User's goal: ${goalType.replace(/_/g, ' ')}
Time of day: ~${hourOfDay}:00 — suggest ${mealTimeHint}

Consumed today:
- Calories: ${Math.round(consumed.calories)} / ${Math.round(targets.calories)} kcal
- Protein: ${Math.round(consumed.protein)} / ${Math.round(targets.protein)}g
- Carbs: ${Math.round(consumed.carbs)} / ${Math.round(targets.carbs)}g
- Fat: ${Math.round(consumed.fat)} / ${Math.round(targets.fat)}g

Remaining budget:
- Calories: ~${Math.round(remaining.calories)} kcal
- Protein: ~${Math.round(remaining.protein)}g
- Carbs: ~${Math.round(remaining.carbs)}g
- Fat: ~${Math.round(remaining.fat)}g

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
