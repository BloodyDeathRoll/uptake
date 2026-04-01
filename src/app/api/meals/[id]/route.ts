import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getAuthedMeal(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, meal: null }
  const { data: meal } = await supabase
    .from('meals').select('*, meal_items(*)').eq('id', id).eq('user_id', user.id).single()
  return { supabase, user, meal }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, meal } = await getAuthedMeal(id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!meal) return NextResponse.json({ error: 'Meal not found' }, { status: 404 })
  return NextResponse.json({ data: meal })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('meals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
