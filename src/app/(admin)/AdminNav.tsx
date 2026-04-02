'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin/stats',    label: 'Stats' },
  { href: '/admin/users',    label: 'Users' },
  { href: '/admin/database', label: 'Database' },
  { href: '/admin/storage',  label: 'Storage' },
]

export default function AdminNav() {
  const path = usePathname()
  return (
    <nav className="flex gap-1 border-b border-border pb-0">
      {TABS.map(({ href, label }) => {
        const active = path.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              active
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
