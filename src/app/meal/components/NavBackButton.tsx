'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  href: string
  label?: string
}

export default function NavBackButton({ href, label = '← Back' }: Props) {
  const router = useRouter()
  const [navigating, setNavigating] = useState(false)

  const handleClick = () => {
    setNavigating(true)
    router.push(href)
  }

  return (
    <button onClick={handleClick} className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-[3rem]">
      {navigating
        ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : label}
    </button>
  )
}
