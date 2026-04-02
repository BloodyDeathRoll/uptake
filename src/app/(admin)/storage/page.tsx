import { createAdminClient } from '@/lib/supabase/server'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

async function getBucketStats(admin: ReturnType<typeof createAdminClient>, bucket: string) {
  let totalSize = 0
  let totalObjects = 0
  let offset = 0
  const limit = 100

  while (true) {
    const { data, error } = await admin.storage.from(bucket).list('', {
      limit,
      offset,
      sortBy: { column: 'created_at', order: 'asc' },
    })
    if (error || !data?.length) break
    totalObjects += data.length
    totalSize += data.reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0)
    if (data.length < limit) break
    offset += limit
  }

  return { totalObjects, totalSize }
}

export default async function AdminStoragePage() {
  const admin = createAdminClient()
  const { data: buckets, error } = await admin.storage.listBuckets()

  if (error || !buckets) {
    return (
      <div className="text-sm text-muted-foreground">
        Could not load storage buckets: {error?.message ?? 'unknown error'}
      </div>
    )
  }

  const bucketStats = await Promise.all(
    buckets.map(async bucket => ({
      ...bucket,
      ...(await getBucketStats(admin, bucket.name)),
    }))
  )

  const totalObjects = bucketStats.reduce((s, b) => s + b.totalObjects, 0)
  const totalSize = bucketStats.reduce((s, b) => s + b.totalSize, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Storage Buckets</h2>
        <span className="text-xs text-muted-foreground">{totalObjects.toLocaleString()} objects · {formatBytes(totalSize)} total</span>
      </div>

      {bucketStats.length === 0 ? (
        <div className="bg-card rounded-xl shadow-[0_0_2px_0_rgba(0,0,0,0.1)] px-4 py-8 text-center text-muted-foreground text-sm">
          No storage buckets found
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-[0_0_2px_0_rgba(0,0,0,0.1)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bucket</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Public</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Objects</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Size</th>
              </tr>
            </thead>
            <tbody>
              {bucketStats.map(b => (
                <tr key={b.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{b.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      b.public ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'
                    }`}>
                      {b.public ? 'Public' : 'Private'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{b.totalObjects.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatBytes(b.totalSize)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
