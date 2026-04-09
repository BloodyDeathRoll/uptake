'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UtensilsCrossed, BarChart2, Settings } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

export default function MobileNav() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const NAV_ITEMS = [
    { href: '/',         label: t.nav_today,    icon: Home },
    { href: '/meal/new', label: t.nav_log,       icon: UtensilsCrossed },
    { href: '/weekly',   label: t.nav_weekly,    icon: BarChart2 },
    { href: '/settings', label: t.nav_settings,  icon: Settings },
  ]

  return (
    <nav dir="ltr" className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-stretch h-16 max-w-[38.4rem] mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors">
              <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
