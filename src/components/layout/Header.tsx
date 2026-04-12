'use client'

import Link from 'next/link'
import { Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Logo from '@/components/Logo'
import { LanguageSwitcher } from '@/lib/i18n'
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher'

function isAdminEmail(email: string | undefined | null): boolean {
  const list = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  return !!email && list.includes(email)
}

export default function Header() {
  const { user, signOut } = useAuth()

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U'
  const admin = isAdminEmail(user?.email)

  return (
    <header dir="ltr" className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm shadow-[0_0_2px_0_rgba(0,0,0,0.1)] px-4 h-14 flex items-center justify-between">
      <Link href="/dashboard" className="font-bold text-lg tracking-tight flex items-center gap-2">
        <Logo size={24} />
        Uptake
      </Link>
      <div className="flex items-center gap-2">
        {admin && (
          <Link
            href="/admin"
            className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
          >
            Admin
          </Link>
        )}
        <ThemeSwitcher />
        <LanguageSwitcher />
        <Link
          href="/settings"
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
        <button
          onClick={signOut}
          className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold"
          aria-label="Account"
          title={user?.email}
        >
          {initials}
        </button>
      </div>
    </header>
  )
}
