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
  const admin = createAdminClient()

  const counts = await Promise.all(
    TABLES.map(table =>
      admin.from(table).select('*', { count: 'exact', head: true }).then(({ count, error }) => ({
        table,
        count: count ?? 0,
        error: error?.message,
      }))
    )
  )

  // Try to get table sizes via RPC (may fail if function not defined — graceful fallback)
  const { data: sizesRaw } = await admin.rpc('get_table_sizes').catch(() => ({ data: null }))
  const sizeMap = new Map<string, number>(
    (sizesRaw as { table_name: string; total_bytes: number }[] | null)?.map(r => [r.table_name, r.total_bytes]) ?? []
  )

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
