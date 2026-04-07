import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import SettingsContent from './SettingsContent'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: goal }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('active', true).single(),
  ])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <SettingsContent email={user.email ?? ''} profile={profile} goal={goal} />
    </div>
  )
}
