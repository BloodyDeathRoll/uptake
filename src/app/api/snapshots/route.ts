import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils/admin'
import { rebuildDailySnapshot, DATE_RE } from '@/lib/snapshots'

// Rebuild a daily snapshot on demand. A signed-in user may rebuild their own
// day (with their own session client — RLS scopes every row); an admin may
// rebuild anyone's (service role). The meals route no longer calls this over
// HTTP: it calls rebuildDailySnapshot() directly (audit 2026-09-11).

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { userId, date } = body as { userId?: unknown; date?: unknown }
  if (typeof userId !== 'string' || typeof date !== 'string' || !DATE_RE.test(date)) {
    return NextResponse.json({ error: 'userId and date (YYYY-MM-DD) are required' }, { status: 400 })
  }

  const admin = isAdmin(user.email)
  if (userId !== user.id && !admin) {
    console.warn(`[snapshots] 403: user ${user.id} asked for ${userId}`)
    return NextResponse.json({ error: "You don't have permission to view this." }, { status: 403 })
  }

  const db = userId === user.id ? supabase : createAdminClient()
  const { error } = await rebuildDailySnapshot(db, userId, date)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
