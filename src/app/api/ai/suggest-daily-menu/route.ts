import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'
import { buildDietaryBlock } from '@/lib/ai/prompts/suggest-meal'
import { buildMealTimingContext, buildFoodGroupContext } from '@/lib/ai/prompts/user-context'

const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
const MIN_DAYS = 5

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { targets, goalType, lang } = body

  const [
    { data: recentMeals },
    { data: profile },
    { data: recentItems },
  ] = await Promise.all([
    supabase.from('meals')
      .select('meal_type, logged_at')
      .eq('user_id', user.id)
      .gte('logged_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
      .order('logged_at', { ascending: false }),
    supabase.from('profiles')
      .select('dietary_preferences, allergies, meals_per_day')
      .eq('id', user.id)
      .single(),
    supabase.from('meal_items')
      .select('ingredient_name, food_group, meals!inner(user_id)')
      .eq('meals.user_id', user.id)
      .limit(120),
  ])

  // Count distinct logged days to check readiness
  const distinctDays = new Set(
    (recentMeals ?? []).map(m => new Date(m.logged_at).toLocaleDateString('en-CA'))
  ).size

  if (distinctDays < MIN_DAYS) {
    return NextResponse.json({ ready: false, daysLogged: distinctDays, daysNeeded: MIN_DAYS })
  }

  const dietaryPreferences: string[] = profile?.dietary_preferences ?? []
  const allergies: string[] = profile?.allergies ?? []
  const mealsPerDay: number = profile?.meals_per_day ?? 3

  // Extract most frequently eaten ingredients from history
  const ingredientCounts: Record<string, number> = {}
  for (const item of recentItems ?? []) {
    if (!item.ingredient_name) continue
    const name = item.ingredient_name.toLowerCase().trim()
    ingredientCounts[name] = (ingredientCounts[name] ?? 0) + 1
  }
  const topIngredients = Object.entries(ingredientCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([name, count]) => `${name} (×${count})`)
    .join(', ')

  const mealTimingContext = buildMealTimingContext(recentMeals ?? [])
  const foodGroupContext = buildFoodGroupContext((recentItems ?? []) as { food_group: string | null }[])
  const dietaryBlock = buildDietaryBlock(dietaryPreferences, allergies)

  const includeSnack = mealsPerDay >= 4
  const mealTypes = includeSnack
    ? ['breakfast', 'lunch', 'dinner', 'snack']
    : ['breakfast', 'lunch', 'dinner']

  const langInstruction = lang === 'he'
    ? 'IMPORTANT: Respond entirely in Hebrew (עברית). All meal names, descriptions, and text must be in Hebrew.\n\n'
    : ''

  const prompt = `${langInstruction}You are a personal nutrition coach. Create a complete daily meal plan tailored to this user's goals and personal food habits.
${dietaryBlock}
User's goal: ${goalType.replace(/_/g, ' ')}
Daily targets: ${Math.round(targets.calories)} kcal | ${Math.round(targets.protein)}g protein | ${Math.round(targets.carbs)}g carbs | ${Math.round(targets.fat)}g fat
${mealTimingContext}${foodGroupContext}

Ingredients this user frequently eats — prefer these in your suggestions:
${topIngredients || 'No history yet — use generally healthy whole foods'}

Create exactly ${mealTypes.length} meals: ${mealTypes.join(', ')}.
The combined totals for all meals should be close to the daily targets (within ~10%).
Use the user's familiar ingredients wherever they fit the goal. Keep descriptions specific enough to log immediately (e.g. "150g grilled chicken, 200g cooked rice, steamed broccoli").

Return ONLY a JSON array, no text outside it:
[
  {
    "meal_type": "breakfast|lunch|dinner|snack",
    "name": "Short meal name",
    "description": "Specific ingredients and quantities",
    "calories": 450,
    "protein_g": 35,
    "carbs_g": 45,
    "fat_g": 12
  }
]`

  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1200,
    })

    const content = completion.choices[0]?.message?.content ?? ''
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error(`No JSON in response: ${content.slice(0, 200)}`)

    const meals = JSON.parse(jsonMatch[0])
    if (!Array.isArray(meals) || meals.length === 0) throw new Error('Invalid format')

    const total = meals.reduce(
      (acc: { calories: number; protein_g: number; carbs_g: number; fat_g: number }, m: { calories?: number; protein_g?: number; carbs_g?: number; fat_g?: number }) => ({
        calories: acc.calories + (m.calories ?? 0),
        protein_g: acc.protein_g + (m.protein_g ?? 0),
        carbs_g: acc.carbs_g + (m.carbs_g ?? 0),
        fat_g: acc.fat_g + (m.fat_g ?? 0),
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    )

    return NextResponse.json({ ready: true, meals, total })
  } catch (err) {
    console.error('[suggest-daily-menu]', err)
    return NextResponse.json({ error: 'Could not generate menu' }, { status: 500 })
  }
}
