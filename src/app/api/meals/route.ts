import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Upsert weighted-average portion priors for items the user explicitly corrected.
// Runs fire-and-forget — does not affect the meal save response time.
async function updatePortionPriors(userId: string, items: Record<string, unknown>[]) {
  const corrected = items.filter(i => i.was_corrected && typeof i.quantity === 'number' && i.quantity > 0 && i.unit)
  if (corrected.length === 0) return

  const supabase = await createClient()
  const names = corrected.map(i => i.ingredient_name as string)

  const { data: existing } = await supabase
    .from('portion_priors')
    .select('ingredient_name, avg_quantity, avg_unit, sample_count')
    .eq('user_id', userId)
    .in('ingredient_name', names)

  const existingMap = new Map((existing ?? []).map(p => [p.ingredient_name, p]))

  const upserts = corrected.map(item => {
    const name  = item.ingredient_name as string
    const qty   = item.quantity as number
    const unit  = item.unit as string
    const prior = existingMap.get(name)

    if (prior && prior.avg_unit === unit) {
      // Weighted average, capped at 50 samples to limit drift over time
      const n      = Math.min(prior.sample_count, 50)
      const newQty = (prior.avg_quantity * n + qty) / (n + 1)
      return { user_id: userId, ingredient_name: name, avg_quantity: Math.round(newQty * 10) / 10, avg_unit: unit, sample_count: n + 1, updated_at: new Date().toISOString() }
    }
    // New ingredient or unit changed — reset
    return { user_id: userId, ingredient_name: name, avg_quantity: qty, avg_unit: unit, sample_count: 1, updated_at: new Date().toISOString() }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('portion_priors') as any).upsert(upserts, { onConflict: 'user_id,ingredient_name' })
}

// Save per-100-unit nutrition for items the user accepted from AI or explicitly corrected.
async function updateNutritionOverrides(userId: string, items: Record<string, unknown>[]) {
  const eligible = items.filter(i =>
    (i.was_corrected || i.source === 'ai_text' || i.source === 'ai_vision') &&
    typeof i.quantity === 'number' && (i.quantity as number) > 0 && i.unit
  )
  if (eligible.length === 0) return

  const supabase = await createClient()
  const r1dp = (v: unknown, factor: number) =>
    typeof v === 'number' ? Math.round(v * factor * 10) / 10 : null

  const upserts = eligible.map(item => {
    const factor = 100 / (item.quantity as number)
    return {
      user_id: userId,
      ingredient_name: item.ingredient_name as string,
      unit: item.unit as string,
      calories_per_100: r1dp(item.calories, factor),
      protein_g_per_100: r1dp(item.protein_g, factor),
      carbs_g_per_100: r1dp(item.carbs_g, factor),
      fat_g_per_100: r1dp(item.fat_g, factor),
      fiber_g_per_100: r1dp(item.fiber_g, factor),
      food_group: (item.food_group as string) ?? null,
      updated_at: new Date().toISOString(),
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('ingredient_nutrition_overrides') as any).upsert(upserts, { onConflict: 'user_id,ingredient_name,unit' })
}

// IMMUTABLE: This route only does INSERT — never UPDATE meals
// Corrections create new meals with revision_of pointing to the original

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Your session has expired. Sign in again to continue." },
      { status: 401 }
    )
  }

  const body = await request.json()
  const { mealType, humanDescription, imageUrl, loggedAt, items, revisionOf } = body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Couldn't save your meal. Your entries are preserved — tap Save to try again." },
      { status: 400 }
    )
  }

  // Insert meal row (immutable)
  const { data: meal, error: mealError } = await supabase
    .from('meals')
    .insert({
      user_id: user.id,
      meal_type: mealType ?? 'snack',
      human_description: humanDescription ?? null,
      image_url: imageUrl ?? null,
      logged_at: loggedAt ?? new Date().toISOString(),
      revision_of: revisionOf ?? null,
    })
    .select()
    .single()

  if (mealError || !meal) {
    return NextResponse.json(
      { error: "Couldn't save your meal. Your entries are preserved — tap Save to try again." },
      { status: 500 }
    )
  }

  // Insert meal items
  const mealItems = items.map((item: Record<string, unknown>) => ({
    meal_id: meal.id,
    ingredient_name: item.ingredient_name as string,
    quantity: item.quantity as number,
    unit: item.unit as string,
    calories: item.calories as number ?? null,
    protein_g: item.protein_g as number ?? null,
    carbs_g: item.carbs_g as number ?? null,
    fat_g: item.fat_g as number ?? null,
    fiber_g: item.fiber_g as number ?? null,
    sugar_g: item.sugar_g as number ?? null,
    saturated_fat_g: item.saturated_fat_g as number ?? null,
    sodium_mg: item.sodium_mg as number ?? null,
    food_group: item.food_group as string ?? null,
    confidence: (item.confidence as 'high' | 'medium' | 'low') ?? null,
    source: (item.source as 'ai_vision' | 'ai_text' | 'memory' | 'user_manual') ?? 'user_manual',
    was_corrected: item.was_corrected as boolean ?? false,
    original_ai_estimate: (item.original_ai_estimate ?? null) as import('@/lib/supabase/types').Json | null,
  }))

  // Type cast needed until supabase gen types replaces the stub types.ts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsError } = await (supabase.from('meal_items') as any).insert(mealItems)

  if (itemsError) {
    return NextResponse.json(
      { error: "Couldn't save your meal. Your entries are preserved — tap Save to try again." },
      { status: 500 }
    )
  }

  // Update daily snapshot asynchronously (fire and forget)
  const date = new Date(meal.logged_at).toISOString().slice(0, 10)
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/snapshots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal-request': '1' },
    body: JSON.stringify({ userId: user.id, date }),
  }).catch(() => {/* silent — snapshot will be rebuilt by cron */})

  // Update portion priors and nutrition overrides from corrected/AI-accepted items (fire and forget)
  updatePortionPriors(user.id, mealItems).catch(() => {})
  updateNutritionOverrides(user.id, mealItems).catch(() => {})

  return NextResponse.json({ data: { ...meal, items: mealItems } }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Your session has expired. Sign in again to continue." },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const today = new Date().toISOString().slice(0, 10)
  const startDate = searchParams.get('startDate') ?? searchParams.get('date') ?? today
  const endDate = searchParams.get('endDate') ?? startDate

  const { data, error } = await supabase
    .from('meals')
    .select(`*, meal_items (*)`)
    .eq('user_id', user.id)
    .gte('logged_at', `${startDate}T00:00:00.000Z`)
    .lte('logged_at', `${endDate}T23:59:59.999Z`)
    .order('logged_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
