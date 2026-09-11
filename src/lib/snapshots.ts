import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Recompute one user's daily_snapshots row from their meal_items for a date.
 *
 * Takes whichever client the caller holds: the user's own session client is
 * enough for the user's own rows (RLS "Users see own snapshots" is FOR ALL, so
 * it covers the upsert), and only the admin route needs the service role.
 * Audit 2026-09-11: this used to live behind POST /api/snapshots, "internal"
 * only by an `x-internal-request: 1` header any client could send, and took
 * the target userId from the body — a service-role write to anyone's row.
 */
export async function rebuildDailySnapshot(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string,
): Promise<{ error?: string }> {
  if (!DATE_RE.test(date)) return { error: 'invalid date' }
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
    return { error: mealsError.message }
  }

  const mealIds = (meals ?? []).map(m => m.id)
  const zero = {
    total_calories: 0, total_protein_g: 0, total_carbs_g: 0, total_fat_g: 0,
    total_fiber_g: 0, total_sugar_g: 0, total_saturated_fat_g: 0, total_sodium_mg: 0,
  }
  let totals = zero
  if (mealIds.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from('meal_items')
      .select('calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, saturated_fat_g, sodium_mg')
      .in('meal_id', mealIds)
    if (itemsError) {
      console.error('SNAPSHOT_STALE: Failed to fetch meal items', itemsError)
      return { error: itemsError.message }
    }
    totals = (items ?? []).reduce(
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
      zero,
    )
  }

  const { error: upsertError } = await supabase
    .from('daily_snapshots')
    .upsert(
      { user_id: userId, date, ...totals, total_water_ml: 0, meal_count: mealIds.length,
        updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' },
    )
  if (upsertError) {
    console.error('SNAPSHOT_STALE: Upsert failed', upsertError)
    return { error: upsertError.message }
  }
  return {}
}
