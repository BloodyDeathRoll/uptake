import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function WeeklyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const startDate = sevenDaysAgo.toISOString().slice(0, 10)
  const endDate = today.toISOString().slice(0, 10)

  const { data: snapshots } = await supabase
    .from('daily_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  const { data: goal } = await supabase
    .from('goals')
    .select('calories_target, protein_g, carbs_g, fat_g')
    .eq('user_id', user.id)
    .eq('active', true)
    .single()

  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold">Weekly overview</h1>
      <p className="text-muted-foreground text-sm">
        Full weekly charts coming in Phase 3. You can see your daily log on the Today screen.
      </p>
      {snapshots && snapshots.length > 0 ? (
        <div className="space-y-2">
          {snapshots.map(day => (
            <div key={day.date} className="flex items-center justify-between p-3 rounded-xl bg-card shadow-[0_0_2px_0_rgba(0,0,0,0.1)]">
              <span className="text-sm text-muted-foreground">{day.date}</span>
              <span className="font-semibold">{Math.round(day.total_calories ?? 0)} kcal</span>
              <span className="text-xs text-muted-foreground">{Math.round(day.total_protein_g ?? 0)}g protein</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground text-sm py-8">No meals logged this week yet.</p>
      )}
    </div>
  )
}
