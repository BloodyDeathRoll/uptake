'use client'

import Link from 'next/link'
import { Settings, Menu, Sun, Moon, LogOut, ShieldCheck } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Logo from '@/components/Logo'
import { LanguageSwitcher, useLanguage } from '@/lib/i18n'
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from '@/components/ui/sheet'

function isAdminEmail(email: string | undefined | null): boolean {
  const list = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  return !!email && list.includes(email)
}

function MobileMenu({ user, signOut, admin }: {
  user: { email?: string | null } | null
  signOut: () => void
  admin: boolean
}) {
  const { theme, setTheme } = useTheme()
  const { lang, setLang, t } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => setMounted(true), [])

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U'
  const isDark = theme === 'dark'
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="md:hidden w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </SheetTrigger>

      <SheetContent side="right" className="w-72 p-0 flex flex-col">
        {/* Nav rows */}
        <nav className="flex flex-col flex-1 py-2 mt-8">
          {admin && (
            <Link
              href="/admin"
              onClick={close}
              className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-accent hover:bg-muted transition-colors"
            >
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              Admin
            </Link>
          )}

          <Link
            href="/settings"
            onClick={close}
            className="flex items-center gap-3 px-5 py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Settings className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            {t.nav_settings}
          </Link>

          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex items-center gap-3 px-5 py-3 text-sm font-medium hover:bg-muted transition-colors w-full text-start"
            >
              {isDark
                ? <Sun className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                : <Moon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />}
              {isDark
                ? (lang === 'he' ? 'מצב בהיר' : 'Light mode')
                : (lang === 'he' ? 'מצב כהה' : 'Dark mode')}
            </button>
          )}

          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'he' : 'en')}
            className="flex items-center gap-3 px-5 py-3 text-sm font-medium hover:bg-muted transition-colors w-full text-start"
          >
            <span className="w-4 h-4 flex-shrink-0 text-center text-xs font-bold text-muted-foreground leading-4">
              {lang === 'he' ? 'EN' : 'עב'}
            </span>
            {lang === 'he' ? t.lang_en : t.lang_he}
          </button>
        </nav>

        {/* User / sign out */}
        <button
          type="button"
          onClick={() => { close(); signOut() }}
          className="flex items-center gap-3 px-5 py-4 border-t border-border hover:bg-muted transition-colors text-start"
          title={lang === 'he' ? 'התנתק' : 'Sign out'}
        >
          <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground">{lang === 'he' ? 'התנתק' : 'Sign out'}</p>
          </div>
          <LogOut className="w-4 h-4 flex-shrink-0 text-muted-foreground ms-auto" />
        </button>
      </SheetContent>
    </Sheet>
  )
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

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-2">
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
          title={user?.email ?? ''}
        >
          {initials}
        </button>
      </div>

      {/* Mobile hamburger */}
      <MobileMenu user={user} signOut={signOut} admin={admin} />
    </header>
  )
}
