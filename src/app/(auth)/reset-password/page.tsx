'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { FloatingLabelInput } from '@/components/ui/floating-label-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Spinner from '@/components/Spinner'
import UseAnimations from 'react-useanimations'
import alertCircle from 'react-useanimations/lib/alertCircle'
import { useLanguage } from '@/lib/i18n'
import Logo from '@/components/Logo'

export default function ResetPasswordPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) { setError(t.err_passwords_mismatch); return }
    if (password.length < 8) { setError(t.err_password_short); return }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-sm border-0 ring-0 shadow-none bg-transparent animate-in fade-in slide-in-from-bottom-6 duration-500">
        <CardHeader className="text-center pt-8 pb-6">
          <div className="flex justify-center mb-0">
            <Logo size={48} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">{t.reset_password_title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          <form onSubmit={handleSubmit} className="space-y-3">
            <FloatingLabelInput
              id="password"
              label={t.new_password_field}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
            <FloatingLabelInput
              id="confirm"
              label={t.confirm_password}
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
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
              {loading
                ? <><Spinner size={16} strokeColor="currentColor" /><span className="ml-2">{t.updating_password}</span></>
                : t.update_password}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
