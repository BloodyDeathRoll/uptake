import { createAdminClient } from '@/lib/supabase/server'

const PAGE_SIZE = 50

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(0, parseInt(pageParam ?? '0', 10))
  const admin = createAdminClient()

  const [
    { data: authData },
    { data: profiles },
    { data: mealCounts },
    { data: activeGoals },
  ] = await Promise.all([
    admin.auth.admin.listUsers({ page: page + 1, perPage: PAGE_SIZE }),
    admin.from('profiles').select('id, weight_kg, height_cm, activity_level'),
    admin.from('meals').select('user_id'),
    admin.from('goals').select('user_id, goal_type').eq('active', true),
  ])

  const users = authData?.users ?? []

  // Build lookup maps
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
  const goalMap = new Map((activeGoals ?? []).map(g => [g.user_id, g.goal_type]))
  const mealCountMap = (mealCounts ?? []).reduce<Record<string, number>>((acc, m) => {
    acc[m.user_id] = (acc[m.user_id] ?? 0) + 1
    return acc
  }, {})

  const hasNext = users.length === PAGE_SIZE

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Users — page {page + 1}
        </h2>
        <div className="flex gap-2 text-xs">
          {page > 0 && (
            <a href={`?page=${page - 1}`} className="px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors">
              ← Prev
            </a>
          )}
          {hasNext && (
            <a href={`?page=${page + 1}`} className="px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors">
              Next →
            </a>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-[0_0_2px_0_rgba(0,0,0,0.1)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Joined</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last sign-in</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profile</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Goal</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Meals</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const profile = profileMap.get(u.id)
              const profileComplete = !!(profile?.weight_kg && profile?.height_cm)
              const goal = goalMap.get(u.id)
              const meals = mealCountMap[u.id] ?? 0

              return (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      profileComplete
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {profileComplete ? 'Complete' : 'Incomplete'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
                    {goal ? goal.replace(/_/g, ' ') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{meals}</td>
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
