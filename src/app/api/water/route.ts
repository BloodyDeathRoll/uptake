import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount_ml } = await request.json()
  if (!amount_ml || typeof amount_ml !== 'number') {
    return NextResponse.json({ error: 'amount_ml is required' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('daily_snapshots')
    .select('total_water_ml')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  const current = existing?.total_water_ml ?? 0

  const { error } = await supabase
    .from('daily_snapshots')
    .upsert(
      { user_id: user.id, date: today, total_water_ml: current + amount_ml, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ total_water_ml: current + amount_ml })
}
