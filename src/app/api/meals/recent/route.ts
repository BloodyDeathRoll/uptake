import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: meals } = await supabase
    .from('meals')
    .select('id, meal_type, human_description, logged_at, meal_items(*)')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(30)

  if (!meals || meals.length === 0) {
    return NextResponse.json({ data: [] })
  }

  // Deduplicate: keep the most recent meal per unique content fingerprint
  const seen = new Set<string>()
  const unique = []
  for (const meal of meals) {
    const items = (meal.meal_items as { ingredient_name: string; calories?: number | null }[] ?? [])
    const ingredientList = items.map(i => i.ingredient_name)
    const fingerprint = meal.human_description
      ? meal.human_description.toLowerCase().trim()
      : ingredientList.sort().join(',')
    if (!fingerprint || seen.has(fingerprint)) continue
    seen.add(fingerprint)
    // Generate a display description if the user never typed one
    const display_description = meal.human_description
      || ingredientList.slice(0, 4).join(', ')
    unique.push({ ...meal, display_description })
    if (unique.length >= 8) break
  }

  return NextResponse.json({ data: unique })
}
