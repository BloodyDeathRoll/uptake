'use client'

import Link from 'next/link'
import { Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function Header() {
  const { user, signOut } = useAuth()

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm shadow-[0_0_2px_0_rgba(0,0,0,0.1)] px-4 h-14 flex items-center justify-between">
      <span className="font-bold text-lg tracking-tight">Uptake</span>
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
        <button
          onClick={signOut}
          className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold"
          aria-label="Account"
          title={user?.email}
        >
          {initials}
        </button>
      </div>
    </header>
  )
}
