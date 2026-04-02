import { createAdminClient } from '@/lib/supabase/server'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card rounded-xl shadow-[0_0_2px_0_rgba(0,0,0,0.1)] p-5">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}

export default async function AdminStatsPage() {
  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [
    { count: totalUsers },
    { count: totalMeals },
    { count: mealsToday },
    { count: totalItems },
    { count: totalSnapshots },
    { data: activeGoals },
    { data: recentMealUsers },
    { data: rateLimits },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('meals').select('*', { count: 'exact', head: true }),
    admin.from('meals').select('*', { count: 'exact', head: true }).gte('logged_at', `${today}T00:00:00Z`),
    admin.from('meal_items').select('*', { count: 'exact', head: true }),
    admin.from('daily_snapshots').select('*', { count: 'exact', head: true }),
    admin.from('goals').select('goal_type').eq('active', true),
    admin.from('meals').select('user_id').gte('logged_at', sevenDaysAgo),
    admin.from('rate_limit_counters').select('*'),
  ])

  const activeUsersLast7d = new Set(recentMealUsers?.map(r => r.user_id) ?? []).size

  // Goal type breakdown
  const goalBreakdown = (activeGoals ?? []).reduce<Record<string, number>>((acc, g) => {
    acc[g.goal_type] = (acc[g.goal_type] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Users" value={totalUsers ?? 0} />
          <StatCard label="Active (7d)" value={activeUsersLast7d} sub="users with a meal" />
          <StatCard label="Total Meals" value={totalMeals ?? 0} />
          <StatCard label="Meals Today" value={mealsToday ?? 0} />
        </div>
      </div>

      {/* Data */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Data</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Meal Items" value={totalItems ?? 0} />
          <StatCard label="Daily Snapshots" value={totalSnapshots ?? 0} />
          <StatCard label="Active Goals" value={activeGoals?.length ?? 0} />
        </div>
      </div>

      {/* Goal breakdown */}
      {Object.keys(goalBreakdown).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Active Goal Types</h2>
          <div className="bg-card rounded-xl shadow-[0_0_2px_0_rgba(0,0,0,0.1)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Goal</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Users</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(goalBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <tr key={type} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 capitalize">{type.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{count}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rate limits */}
      {rateLimits && rateLimits.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">AI Rate Limits</h2>
          <div className="bg-card rounded-xl shadow-[0_0_2px_0_rgba(0,0,0,0.1)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Provider</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">RPM</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">RPD</th>
                </tr>
              </thead>
              <tbody>
                {rateLimits.map(r => (
                  <tr key={r.provider} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{r.provider}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.rpm}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.rpd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
