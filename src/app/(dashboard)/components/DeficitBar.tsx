'use client'

import { useState, useEffect } from 'react'

// Gradient: green (deficit edge) → amber → orange → coral (target) → deep red (surplus edge)
// Center (50%) represents exactly at target
const GRADIENT = 'linear-gradient(to right, #7EC8A0 0%, #F5B942 38%, #F07840 47%, #EF5F5F 50%, #E04040 100%)'
const TRANSITION = 'width 0.9s cubic-bezier(0.4, 0, 0.2, 1)'

interface Props {
  calories: number
  target: number
  goalType?: string
}

export default function DeficitBar({ calories, target }: Props) {
  const diff = calories - target
  const isDeficit = diff < 0
  const targetPct = Math.min(Math.abs(diff) / (target || 1) * 100, 50)
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const id = setTimeout(() => setPct(targetPct), 50)
    return () => clearTimeout(id)
  }, [targetPct])

  const label = isDeficit
    ? `${Math.abs(Math.round(diff))} kcal under target`
    : `${Math.round(diff)} kcal over target`

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>deficit</span>
        <span>{label}</span>
        <span>surplus</span>
      </div>
      <div className="relative h-1.5 rounded-full overflow-hidden">
        {/* Full gradient track */}
        <div className="absolute inset-0" style={{ background: GRADIENT }} />

        {/* Masks to reveal only the filled portion */}
        {isDeficit ? (
          <>
            <div className="absolute inset-y-0 left-0 bg-muted" style={{ width: `${50 - pct}%`, transition: TRANSITION }} />
            <div className="absolute inset-y-0 right-0 w-1/2 bg-muted" />
          </>
        ) : (
          <>
            <div className="absolute inset-y-0 left-0 w-1/2 bg-muted" />
            <div className="absolute inset-y-0 right-0 bg-muted" style={{ width: `${50 - pct}%`, transition: TRANSITION }} />
          </>
        )}

        {/* Center divider */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-border z-10" />
      </div>
    </div>
  )
}
