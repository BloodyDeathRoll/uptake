'use client'

import { useState, useEffect } from 'react'
import { Flame, Dna, Wheat } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { nutritionColor } from '@/lib/utils/color'

interface Props {
  calories: { current: number; target: number }
  protein:  { current: number; target: number }
  carbs:    { current: number; target: number }
}

const SIZE   = 72
const STROKE = 4
const R      = (SIZE - STROKE) / 2
const CIRC   = 2 * Math.PI * R

function Ring({ pct, icon: Icon }: { pct: number; icon: LucideIcon }) {
  const color = nutritionColor(pct)
  const targetOffset = CIRC * (1 - Math.min(pct, 1))
  const [offset, setOffset] = useState(CIRC)

  useEffect(() => {
    const id = setTimeout(() => setOffset(targetOffset), 50)
    return () => clearTimeout(id)
  }, [targetOffset])

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className="w-8 h-8" style={{ color }} strokeWidth={1.5} />
      </div>
    </div>
  )
}

function RingBlock({ label, pct, value, sub, icon }: {
  label: string; pct: number; value: string; sub: string; icon: LucideIcon
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Ring pct={pct} icon={icon} />
      <div className="text-center">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold tabular-nums">
          {value}<span className="text-muted-foreground font-normal text-xs"> /{sub}</span>
        </div>
      </div>
    </div>
  )
}

export default function CalorieRings({ calories, protein, carbs }: Props) {
  const pct = (v: { current: number; target: number }) =>
    v.target > 0 ? v.current / v.target : 0

  return (
    <div className="flex justify-around py-2">
      <RingBlock icon={Flame} label="Calories" pct={pct(calories)} value={String(Math.round(calories.current))} sub={String(calories.target)} />
      <RingBlock icon={Dna}   label="Protein"  pct={pct(protein)}  value={`${Math.round(protein.current)}g`}  sub={`${protein.target}g`} />
      <RingBlock icon={Wheat} label="Carbs"    pct={pct(carbs)}    value={`${Math.round(carbs.current)}g`}    sub={`${carbs.target}g`} />
    </div>
  )
}
