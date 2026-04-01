import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// INTERNAL ROUTE — uses service role to aggregate meal data.
// Only callable from server-side code via x-internal-request header.
// Never expose to client-side code.

export async function POST(request: NextRequest) {
  const internalHeader = request.headers.get('x-internal-request')
  if (internalHeader !== '1') {
    return NextResponse.json({ error: "You don't have permission to view this." }, { status: 403 })
  }

  const body = await request.json()
  const { userId, date } = body

  if (!userId || !date) {
    return NextResponse.json({ error: 'userId and date are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Aggregate all meal_items for this user on this date
  const startOfDay = `${date}T00:00:00.000Z`
  const endOfDay = `${date}T23:59:59.999Z`

  const { data: meals, error: mealsError } = await supabase
    .from('meals')
    .select('id')
    .eq('user_id', userId)
    .gte('logged_at', startOfDay)
    .lte('logged_at', endOfDay)

  if (mealsError) {
    console.error('SNAPSHOT_STALE: Failed to fetch meals for snapshot', mealsError)
    return NextResponse.json({ error: mealsError.message }, { status: 500 })
  }

  const mealIds = (meals ?? []).map(m => m.id)

  if (mealIds.length === 0) {
    // No meals — upsert zeros
    await supabase.from('daily_snapshots').upsert(
      {
        user_id: userId,
        date,
        total_calories: 0,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
        total_fiber_g: 0,
        total_sugar_g: 0,
        total_saturated_fat_g: 0,
        total_sodium_mg: 0,
        total_water_ml: 0,
        meal_count: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date' }
    )
    return NextResponse.json({ success: true })
  }

  const { data: items, error: itemsError } = await supabase
    .from('meal_items')
    .select('calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, saturated_fat_g, sodium_mg')
    .in('meal_id', mealIds)

  if (itemsError) {
    console.error('SNAPSHOT_STALE: Failed to fetch meal items', itemsError)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  const totals = (items ?? []).reduce(
    (acc, item) => ({
      total_calories: acc.total_calories + (item.calories ?? 0),
      total_protein_g: acc.total_protein_g + (item.protein_g ?? 0),
      total_carbs_g: acc.total_carbs_g + (item.carbs_g ?? 0),
      total_fat_g: acc.total_fat_g + (item.fat_g ?? 0),
      total_fiber_g: acc.total_fiber_g + (item.fiber_g ?? 0),
      total_sugar_g: acc.total_sugar_g + (item.sugar_g ?? 0),
      total_saturated_fat_g: acc.total_saturated_fat_g + (item.saturated_fat_g ?? 0),
      total_sodium_mg: acc.total_sodium_mg + (item.sodium_mg ?? 0),
    }),
    { total_calories: 0, total_protein_g: 0, total_carbs_g: 0, total_fat_g: 0,
      total_fiber_g: 0, total_sugar_g: 0, total_saturated_fat_g: 0, total_sodium_mg: 0 }
  )

  const { error: upsertError } = await supabase
    .from('daily_snapshots')
    .upsert(
      {
        user_id: userId,
        date,
        ...totals,
        total_water_ml: 0,
        meal_count: mealIds.length,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date' }
    )

  if (upsertError) {
    console.error('SNAPSHOT_STALE: Upsert failed', upsertError)
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
