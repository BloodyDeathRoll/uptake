import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils/admin'
import AdminNav from './AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (!isAdmin(user.email)) redirect('/')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm shadow-[0_0_2px_0_rgba(0,0,0,0.1)] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg tracking-tight">Uptake</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/20 text-accent">Admin</span>
        </div>
        <span className="text-xs text-muted-foreground">{user.email}</span>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <AdminNav />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}
