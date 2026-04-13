'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { FloatingLabelInput } from '@/components/ui/floating-label-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Spinner from '@/components/Spinner'
import UseAnimations from 'react-useanimations'
import alertCircle from 'react-useanimations/lib/alertCircle'
import { useLanguage } from '@/lib/i18n'
import Logo from '@/components/Logo'

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-sm border-0 ring-0 shadow-none bg-transparent animate-in fade-in slide-in-from-bottom-6 duration-500">
        <CardHeader className="text-center pt-8 pb-6">
          <div className="flex justify-center mb-0">
            <Logo size={48} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">{t.forgot_password_title}</CardTitle>
          <CardDescription>{t.forgot_password_subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          {sent ? (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">{t.reset_link_sent}</p>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-accent underline underline-offset-4 hover:text-accent/80 transition-colors">
                  {t.back_to_sign_in}
                </Link>
              </p>
            </div>
          ) : (
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

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-200">
                  <UseAnimations animation={alertCircle} size={16} autoplay strokeColor="currentColor" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full transition-transform duration-150 active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? <><Spinner size={16} strokeColor="currentColor" /><span className="ml-2">{t.sending_reset}</span></> : t.send_reset_link}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-accent underline underline-offset-4 hover:text-accent/80 transition-colors">
                  {t.back_to_sign_in}
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
