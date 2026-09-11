import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/safe-redirect'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // `next` is attacker-controllable; keep it a same-origin path.
  const next = safeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if the user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user?.id ?? '')
        .single()

      return NextResponse.redirect(`${origin}${profile ? next : '/onboarding'}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
