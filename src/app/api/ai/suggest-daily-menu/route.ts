import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
const MIN_DAYS = 5

interface PastMeal {
  description: string
  meal_type: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

function normKey(s: string) {
  return s.toLowerCase().trim()
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { targets, goalType, lang } = body
  const consumed: { calories: number; protein: number; carbs: number; fat: number } = body.consumed ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const loggedTypes: string[] = body.loggedTypes ?? []

  const remaining = {
    calories: Math.max(targets.calories - consumed.calories, 0),
    protein:  Math.max(targets.protein  - consumed.protein,  0),
    carbs:    Math.max(targets.carbs    - consumed.carbs,    0),
    fat:      Math.max(targets.fat      - consumed.fat,      0),
  }

  const [
    { data: recentMeals },
    { data: profile },
    { data: pastMealsRaw },
  ] = await Promise.all([
    // Recent meals for distinct-day counting
    supabase.from('meals')
      .select('logged_at')
      .eq('user_id', user.id)
      .gte('logged_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('profiles')
      .select('meals_per_day')
      .eq('id', user.id)
      .single(),
    // Past meals with their actual nutrition
    supabase.from('meals')
      .select('human_description, meal_type, meal_items(calories, protein_g, carbs_g, fat_g)')
      .eq('user_id', user.id)
      .not('human_description', 'is', null)
      .order('logged_at', { ascending: false })
      .limit(80),
  ])

  // Check readiness: need at least MIN_DAYS distinct logged days
  const distinctDays = new Set(
    (recentMeals ?? []).map(m => new Date(m.logged_at).toLocaleDateString('en-CA'))
  ).size

  if (distinctDays < MIN_DAYS) {
    return NextResponse.json({ ready: false, daysLogged: distinctDays, daysNeeded: MIN_DAYS })
  }

  // Build deduplicated meal list with real macros from DB
  const seen = new Set<string>()
  const mealMap = new Map<string, PastMeal>()  // normalised description → entry

  for (const m of pastMealsRaw ?? []) {
    if (!m.human_description) continue
    const desc = m.human_description as string
    const key = normKey(desc)
    if (seen.has(key)) continue
    seen.add(key)

    const items = m.meal_items as { calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null }[]
    const calories  = items.reduce((s, i) => s + (i.calories  ?? 0), 0)
    const protein_g = items.reduce((s, i) => s + (i.protein_g ?? 0), 0)
    const carbs_g   = items.reduce((s, i) => s + (i.carbs_g   ?? 0), 0)
    const fat_g     = items.reduce((s, i) => s + (i.fat_g     ?? 0), 0)

    if (calories <= 0) continue  // skip meals with no nutrition data

    const entry: PastMeal = { description: desc, meal_type: m.meal_type ?? 'snack', calories, protein_g, carbs_g, fat_g }
    mealMap.set(key, entry)
  }

  if (mealMap.size === 0) {
    return NextResponse.json({ ready: false, daysLogged: distinctDays, daysNeeded: MIN_DAYS })
  }

  const allMeals = Array.from(mealMap.values())
  const byType: Record<string, PastMeal[]> = { breakfast: [], lunch: [], dinner: [], snack: [], any: [] }

  for (const m of allMeals) {
    if (m.meal_type in byType) byType[m.meal_type].push(m)
    else byType.any.push(m)
  }

  const mealsPerDay: number = profile?.meals_per_day ?? 3
  const includeSnack = mealsPerDay >= 4
  const allSlots = includeSnack ? ['breakfast', 'lunch', 'dinner', 'snack'] : ['breakfast', 'lunch', 'dinner']
  // Only suggest meal types the user hasn't already logged today
  const slots = allSlots.filter(s => !loggedTypes.includes(s))

  if (slots.length === 0) {
    return NextResponse.json({ ready: true, meals: [], total: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } })
  }

  // Format a list of meals for the prompt
  const formatList = (meals: PastMeal[]) =>
    meals.slice(0, 12).map((m, i) =>
      `${i + 1}. "${m.description}" — ${Math.round(m.calories)}kcal, ${Math.round(m.protein_g)}g P, ${Math.round(m.carbs_g)}g C, ${Math.round(m.fat_g)}g F`
    ).join('\n')

  const sections = slots.map(slot => {
    const options = byType[slot].length > 0 ? byType[slot] : [...byType.any, ...allMeals].slice(0, 8)
    return `${slot.toUpperCase()} (${options.length} options):\n${formatList(options)}`
  }).join('\n\n')

  const hasConsumed = consumed.calories > 0
  const prompt = `You are a meal planner. Select one meal per slot to fill the user's remaining daily nutrition budget.

⚠️ CRITICAL RULES — no exceptions:
1. You MUST ONLY choose meals from the lists below.
2. Do NOT invent, create, or suggest any meal not in this list.
3. Copy the description EXACTLY as written (do not paraphrase or modify it).

Goal: ${goalType.replace(/_/g, ' ')}
${hasConsumed ? `Already eaten today: ${Math.round(consumed.calories)} kcal | ${Math.round(consumed.protein)}g protein | ${Math.round(consumed.carbs)}g carbs | ${Math.round(consumed.fat)}g fat\n` : ''}Remaining budget: ${Math.round(remaining.calories)} kcal | ${Math.round(remaining.protein)}g protein | ${Math.round(remaining.carbs)}g carbs | ${Math.round(remaining.fat)}g fat

=== AVAILABLE MEALS ===
${sections}

Pick the combination that best matches the daily targets. Return ONLY a JSON array (no other text):
[
  {
    "meal_type": "${slots[0]}",
    "description": "<exact description from list>",
    "name": "<short display name, 1-4 words>"
  }
]`

  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,  // low temp — we want selection, not creativity
      max_tokens: 800,
    })

    const content = completion.choices[0]?.message?.content ?? ''
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error(`No JSON in response: ${content.slice(0, 200)}`)

    const aiSelections: { meal_type: string; description: string; name: string }[] = JSON.parse(jsonMatch[0])
    if (!Array.isArray(aiSelections) || aiSelections.length === 0) throw new Error('Invalid format')

    // Map AI selections back to real DB macros — prevents hallucinated nutrition values
    const meals = aiSelections.flatMap(sel => {
      const entry = mealMap.get(normKey(sel.description))
      if (!entry) {
        // Fuzzy fallback: find closest match by prefix
        const fallback = Array.from(mealMap.entries()).find(([k]) => k.startsWith(normKey(sel.description).slice(0, 20)))
        if (!fallback) return []  // discard if truly not found
        const [, m] = fallback
        return [{ meal_type: sel.meal_type, name: sel.name, description: m.description, calories: Math.round(m.calories), protein_g: Math.round(m.protein_g), carbs_g: Math.round(m.carbs_g), fat_g: Math.round(m.fat_g) }]
      }
      return [{ meal_type: sel.meal_type, name: sel.name, description: entry.description, calories: Math.round(entry.calories), protein_g: Math.round(entry.protein_g), carbs_g: Math.round(entry.carbs_g), fat_g: Math.round(entry.fat_g) }]
    })

    if (meals.length === 0) throw new Error('No matched meals')

    const total = meals.reduce(
      (acc, m) => ({ calories: acc.calories + m.calories, protein_g: acc.protein_g + m.protein_g, carbs_g: acc.carbs_g + m.carbs_g, fat_g: acc.fat_g + m.fat_g }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    )

    return NextResponse.json({ ready: true, meals, total })
  } catch (err) {
    console.error('[suggest-daily-menu]', err)
    return NextResponse.json({ error: 'Could not generate menu' }, { status: 500 })
  }
}
