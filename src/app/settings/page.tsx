import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { GOAL_LABELS, ACTIVITY_LABELS } from '@/lib/utils/constants'
import { formatCalories, formatGrams } from '@/lib/utils/format'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: goal }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('active', true).single(),
  ])

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold">Settings</h1>

      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <h2 className="font-semibold text-sm">Profile</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Email: {user.email}</div>
            {profile && (
              <>
                <div>Weight: {profile.weight_kg}kg · Height: {profile.height_cm}cm · Age: {profile.age}</div>
                <div>Activity: {ACTIVITY_LABELS[profile.activity_level as keyof typeof ACTIVITY_LABELS] ?? profile.activity_level}</div>
              </>
            )}
          </div>
          <Link href="/onboarding" className="text-sm text-accent underline underline-offset-4">Update profile</Link>
        </CardContent>
      </Card>

      {goal && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-3">
            <h2 className="font-semibold text-sm">Current goal</h2>
            <div className="text-sm">
              <span className="font-medium">{GOAL_LABELS[goal.goal_type as keyof typeof GOAL_LABELS] ?? goal.goal_type}</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Calories: {formatCalories(goal.calories_target)}</div>
              <div>Protein: {formatGrams(goal.protein_g)} · Carbs: {formatGrams(goal.carbs_g)} · Fat: {formatGrams(goal.fat_g)}</div>
            </div>
            {goal.rationale && <p className="text-xs text-muted-foreground italic">{goal.rationale}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4 pb-4">
          <h2 className="font-semibold text-sm mb-2">Data</h2>
          <p className="text-xs text-muted-foreground">Data export (JSON/CSV) coming in Phase 3.</p>
        </CardContent>
      </Card>
    </div>
  )
}
