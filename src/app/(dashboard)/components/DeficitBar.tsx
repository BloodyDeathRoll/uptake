'use client'

import { useState, useEffect } from 'react'

interface Props {
  calories: number
  target: number
  goalType?: string
}

export default function DeficitBar({ calories, target, goalType }: Props) {
  const diff = calories - target
  const isDeficit = diff < 0
  const targetPct = Math.min(Math.abs(diff) / (target || 1) * 100, 50)
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const id = setTimeout(() => setPct(targetPct), 50)
    return () => clearTimeout(id)
  }, [targetPct])

  // For bulk goals surplus is good → green; for all others deficit is good → green
  const isBulkGoal = goalType === 'muscle_gain' || goalType === 'recomposition'
  const isPositive = isBulkGoal ? !isDeficit : isDeficit
  const fillColor = isDeficit ? '#B5D4FD' : '#F25116'

  const label = isDeficit
    ? `${Math.abs(Math.round(diff))} kcal under target`
    : `${Math.round(diff)} kcal over target`

  return (
    <div className="space-y-2">
      <p className="text-xs text-center text-muted-foreground">{label}</p>
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-1/2 w-px bg-border z-10" />
        {isDeficit ? (
          <div
            className="absolute inset-y-0 right-1/2 rounded-l-full"
            style={{
              width: `${pct}%`,
              backgroundColor: fillColor,
              transition: 'width 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        ) : (
          <div
            className="absolute inset-y-0 left-1/2 rounded-r-full"
            style={{
              width: `${pct}%`,
              backgroundColor: fillColor,
              transition: 'width 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        )}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>deficit</span>
        <span>surplus</span>
      </div>
    </div>
  )
}
