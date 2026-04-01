import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  const { targets, rationale, goalType, version } = body

  if (!targets || !goalType) {
    return NextResponse.json({ error: 'targets and goalType are required' }, { status: 400 })
  }

  // Get current max version for this user
  const { data: existing } = await supabase
    .from('goals')
    .select('version')
    .eq('user_id', user.id)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  const nextVersion = (existing?.version ?? 0) + 1

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      version: version ?? nextVersion,
      goal_type: goalType,
      calories_target: targets.calories,
      protein_g: targets.protein_g,
      carbs_g: targets.carbs_g,
      fat_g: targets.fat_g,
      fiber_g: targets.fiber_g,
      sugar_g: targets.sugar_g,
      saturated_fat_g: targets.saturated_fat_g,
      sodium_mg: targets.sodium_mg,
      water_ml: targets.water_ml,
      protein_per_kg: targets.protein_per_kg,
      net_carbs_g: targets.net_carbs_g ?? null,
      custom_targets: targets.custom_targets ?? null,
      rationale: rationale ?? null,
      active: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: "Profile update failed. Please try again." },
      { status: 500 }
    )
  }

  return NextResponse.json({ data })
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

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .single()

  if (error) {
    return NextResponse.json({ data: null })
  }

  return NextResponse.json({ data })
}
