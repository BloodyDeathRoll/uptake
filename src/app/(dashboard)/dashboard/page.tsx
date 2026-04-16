import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import DashboardClient from '../DashboardClient'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { date: initialDate } = await searchParams
  const cookieStore = await cookies()
  const tz = cookieStore.get('tz')?.value ?? 'UTC'
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())

  const [{ data: snapshot }, { data: goal }, { data: meals }, { data: profile }, { count: mealCount }] = await Promise.all([
    supabase.from('daily_snapshots').select('*').eq('user_id', user.id).eq('date', today).single(),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('active', true).single(),
    supabase.from('meals').select('*, meal_items(*)').eq('user_id', user.id)
      .gte('logged_at', `${today}T00:00:00.000Z`).lte('logged_at', `${today}T23:59:59.999Z`)
      .order('logged_at', { ascending: true }),
    supabase.from('profiles').select('weight_kg, height_cm, age, sex, activity_level, dietary_preferences').eq('id', user.id).single(),
    supabase.from('meals').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  return <DashboardClient snapshot={snapshot} goal={goal} meals={(meals ?? []) as import('@/hooks/useMeals').Meal[]} profile={profile} initialDate={initialDate} hasAnyMeals={(mealCount ?? 0) > 0} />
}
