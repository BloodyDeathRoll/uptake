'use client'

import { useState, useEffect } from 'react'
import { Flame, Dna, Wheat } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { nutritionColor } from '@/lib/utils/color'
import { useLanguage } from '@/lib/i18n'
import { translateUnit } from '@/lib/utils/translate-unit'

const TODAY_COLOR = 'var(--emphasis)'

interface Props {
  calories: { current: number; target: number }
  protein:  { current: number; target: number }
  carbs:    { current: number; target: number }
  isToday?: boolean
}

// Viewbox is fixed at 120; CSS classes control actual rendered size
const VB    = 120
const STROKE = 5
const R      = (VB - STROKE) / 2
const CIRC   = 2 * Math.PI * R

function Ring({ pct, icon: Icon, isToday }: { pct: number; icon: LucideIcon; isToday?: boolean }) {
  const color = isToday ? TODAY_COLOR : nutritionColor(pct)
  const targetOffset = CIRC * (1 - Math.min(pct, 1))
  const [offset, setOffset] = useState(CIRC)

  useEffect(() => {
    const id = setTimeout(() => setOffset(targetOffset), 50)
    return () => clearTimeout(id)
  }, [targetOffset])

  return (
    <div className="relative w-[80px] h-[80px] md:w-[120px] md:h-[120px]">
      <svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`}>
        <circle cx={VB / 2} cy={VB / 2} r={R} fill="none" strokeWidth={STROKE} style={{ stroke: 'var(--emphasis-bg)' }} />
        <circle
          cx={VB / 2} cy={VB / 2} r={R}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${VB / 2} ${VB / 2})`}
          style={{ stroke: color, transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className="w-7 h-7 md:w-10 md:h-10" style={{ color }} strokeWidth={1.5} />
      </div>
    </div>
  )
}

function RingBlock({ label, pct, value, sub, icon, isToday, dir = 'rtl' }: {
  label: string; pct: number; value: string; sub: string; icon: LucideIcon; isToday?: boolean; dir?: 'ltr' | 'rtl'
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 md:gap-2">
      <Ring pct={pct} icon={icon} isToday={isToday} />
      <div className="text-center">
        <div className="text-xs md:text-sm text-muted-foreground">{label}</div>
        <div className="text-sm md:text-base font-semibold tabular-nums" dir={dir}>
          {value}<span className="text-muted-foreground font-normal text-xs md:text-sm"> /{sub}</span>
        </div>
      </div>
    </div>
  )
}

export default function CalorieRings({ calories, protein, carbs, isToday }: Props) {
  const { t, lang } = useLanguage()
  const pct = (v: { current: number; target: number }) =>
    v.target > 0 ? v.current / v.target : 0
  const g = translateUnit('g', lang)

  return (
    <div className="flex-1 flex items-center justify-around py-2">
      <RingBlock icon={Flame} label={t.calories} pct={pct(calories)} value={String(Math.round(calories.current))} sub={String(calories.target)} isToday={isToday} dir={lang === 'he' ? 'rtl' : 'ltr'} />
      <RingBlock icon={Dna}   label={t.protein}  pct={pct(protein)}  value={`${Math.round(protein.current)}${g}`}  sub={`${protein.target}${g}`} isToday={isToday} />
      <RingBlock icon={Wheat} label={t.carbs}    pct={pct(carbs)}    value={`${Math.round(carbs.current)}${g}`}    sub={`${carbs.target}${g}`} isToday={isToday} />
    </div>
  )
}
