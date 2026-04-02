import { createAdminClient } from '@/lib/supabase/server'

const TABLES = [
  'profiles',
  'goals',
  'meals',
  'meal_items',
  'meal_embeddings',
  'portion_priors',
  'daily_snapshots',
  'rate_limit_counters',
] as const

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export default async function AdminDatabasePage() {
  let counts: { table: string; count: number; error?: string }[] = []
  let sizeMap = new Map<string, number>()
  let fatalError: string | undefined

  try {
    const admin = createAdminClient()

    counts = await Promise.all(
      TABLES.map(async table => {
        try {
          const { count, error } = await admin.from(table).select('*', { count: 'exact', head: true })
          return { table, count: count ?? 0, error: error?.message }
        } catch (e) {
          return { table, count: 0, error: String(e) }
        }
      })
    )

    // Try to get table sizes via RPC (may fail if function not defined — graceful fallback)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sizesRaw } = await (admin as any).rpc('get_table_sizes')
      sizeMap = new Map<string, number>(
        (sizesRaw as { table_name: string; total_bytes: number }[] | null)?.map(r => [r.table_name, r.total_bytes]) ?? []
      )
    } catch {
      // graceful fallback — sizes just won't be shown
    }
  } catch (e) {
    fatalError = String(e)
  }

  if (fatalError) {
    return (
      <div className="bg-card rounded-xl shadow-[0_0_2px_0_rgba(0,0,0,0.1)] px-4 py-8 text-center text-destructive text-sm">
        Failed to load database stats: {fatalError}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tables</h2>
      <div className="bg-card rounded-xl shadow-[0_0_2px_0_rgba(0,0,0,0.1)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Table</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Row Count</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Size on Disk</th>
            </tr>
          </thead>
          <tbody>
            {counts.map(({ table, count, error }) => {
              const bytes = sizeMap.get(table)
              return (
                <tr key={table} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{table}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {error ? <span className="text-destructive text-xs">{error}</span> : count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground text-xs">
                    {bytes != null ? formatBytes(bytes) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {sizeMap.size === 0 && (
        <p className="text-xs text-muted-foreground">
          Disk sizes unavailable — create a <code className="font-mono">get_table_sizes()</code> RPC function in Supabase to enable them.
        </p>
      )}
    </div>
  )
}
