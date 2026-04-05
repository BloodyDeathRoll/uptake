import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

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
