'use client'

import { useState, useEffect } from 'react'

interface Props {
  label: string
  current: number
  target: number
  unit?: string
}

// Interpolate between interactive blue (#B5D4FD) and error red (#F25116)
const BLUE: [number, number, number] = [181, 212, 253]
const RED:  [number, number, number] = [242,  81,  22]

// Blue until 100%, then lerp to red between 100–120%, full red at 120%+
function lerpColor(ratio: number): string {
  const t = Math.min(Math.max((ratio - 1) / 0.2, 0), 1)
  const r = Math.round(BLUE[0] + (RED[0] - BLUE[0]) * t)
  const g = Math.round(BLUE[1] + (RED[1] - BLUE[1]) * t)
  const b = Math.round(BLUE[2] + (RED[2] - BLUE[2]) * t)
  return `rgb(${r},${g},${b})`
}

export default function NutrientBar({ label, current, target, unit = 'g' }: Props) {
  const ratio = target > 0 ? current / target : 0
  const targetPct = Math.min(ratio * 100, 100)
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const id = setTimeout(() => setPct(targetPct), 50)
    return () => clearTimeout(id)
  }, [targetPct])

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="inline-flex items-baseline gap-[2px] text-foreground">
          <span>{Math.round(current)}</span><span className="text-muted-foreground">/{Math.round(target)}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: lerpColor(ratio),
            transition: 'width 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  )
}
