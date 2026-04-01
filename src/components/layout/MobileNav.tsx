'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UtensilsCrossed, BarChart2, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',        label: 'Today',   icon: Home },
  { href: '/meal/new', label: 'Log',    icon: UtensilsCrossed },
  { href: '/weekly',  label: 'Weekly',  icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
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
