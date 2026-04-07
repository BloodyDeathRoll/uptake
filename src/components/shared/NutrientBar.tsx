'use client'

import { useState, useEffect } from 'react'
import { nutritionColor } from '@/lib/utils/color'

interface Props {
  label: string
  current: number
  target: number
  unit?: string
  barColor?: string
}

export default function NutrientBar({ label, current, target, unit = 'g', barColor }: Props) {
  const ratio = target > 0 ? current / target : 0
  const targetPct = Math.min(ratio * 100, 100)
  const [pct, setPct] = useState(0)
  const pctValue = Math.round(ratio * 100)

  useEffect(() => {
    const id = setTimeout(() => setPct(targetPct), 50)
    return () => clearTimeout(id)
  }, [targetPct])

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="inline-flex items-baseline gap-1 text-foreground">
          <span>{Math.round(current)}</span><span className="text-muted-foreground">/{Math.round(target)}{unit}</span>
          <span className="font-semibold tabular-nums" style={{ color: nutritionColor(ratio) }}>{pctValue}%</span>
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: barColor ?? nutritionColor(ratio),
            transition: 'width 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  )
}
