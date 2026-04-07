'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { FloatingLabelInput } from '@/components/ui/floating-label-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Spinner from '@/components/Spinner'
import Logo from '@/components/Logo'
import UseAnimations from 'react-useanimations'
import alertCircle from 'react-useanimations/lib/alertCircle'
import { useLanguage } from '@/lib/i18n'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022"/>
      <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00"/>
      <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF"/>
      <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900"/>
    </svg>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'oauth' ? t.err_oauth : null
  )
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'microsoft' | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .single()

    router.push(profile ? '/dashboard' : '/onboarding')
  }

  const handleOAuth = async (provider: 'google' | 'azure') => {
    setError(null)
    setOauthLoading(provider === 'google' ? 'google' : 'microsoft')
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        ...(provider === 'azure' ? { scopes: 'email profile' } : {}),
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-sm border-0 ring-0 shadow-none bg-transparent animate-in fade-in slide-in-from-bottom-6 duration-500">
        <CardHeader className="text-center pt-8 pb-6">
          <div className="flex justify-center mb-0">
            <Logo size={48} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Uptake</CardTitle>
          <CardDescription>{t.sign_in_subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          <Button
            variant="outline"
            className="w-full transition-transform duration-150 active:scale-[0.98]"
            onClick={() => handleOAuth('google')}
            disabled={!!oauthLoading}
          >
            {oauthLoading === 'google' ? <Spinner size={16} /> : <GoogleIcon />}
            <span className="ml-2">{oauthLoading === 'google' ? t.redirecting : t.continue_google}</span>
          </Button>

          <Button
            variant="outline"
            className="w-full transition-transform duration-150 active:scale-[0.98]"
            onClick={() => handleOAuth('azure')}
            disabled={!!oauthLoading}
          >
            {oauthLoading === 'microsoft' ? <Spinner size={16} /> : <MicrosoftIcon />}
            <span className="ml-2">{oauthLoading === 'microsoft' ? t.redirecting : t.continue_microsoft}</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t.or_divider}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <FloatingLabelInput
              id="email"
              label={t.email_field}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <FloatingLabelInput
              id="password"
              label={t.password_field}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-200">
                <UseAnimations animation={alertCircle} size={16} autoplay strokeColor="currentColor" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full transition-transform duration-150 active:scale-[0.98]"
              disabled={loading || !!oauthLoading}
            >
              {loading ? <><Spinner size={16} strokeColor="currentColor" /><span className="ml-2">{t.signing_in}</span></> : t.sign_in}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t.no_account}{' '}
            <Link href="/signup" className="text-accent underline underline-offset-4 hover:text-accent/80 transition-colors">{t.sign_up}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
