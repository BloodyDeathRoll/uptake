'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { GOAL_LABELS, type GoalType } from '@/lib/utils/constants'
import { ORDERED_GOALS, type GoalProfile } from './GoalSwitcher'
import { useLanguage, type Translations } from '@/lib/i18n'

interface Props {
  initialGoalType: GoalType
  profile: GoalProfile
  onGoalChange: (goalType: GoalType, targets: Record<string, number>) => void
  onLoadingChange?: (loading: boolean) => void
}

export default function GoalDropdown({ initialGoalType, profile, onGoalChange, onLoadingChange }: Props) {
  const { t } = useLanguage()
  const goalLabel = (g: GoalType) => (t[('goalLabel_' + g) as keyof Translations] as string) || GOAL_LABELS[g]
  const [goalType, setGoalType] = useState(initialGoalType)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = async (newGoal: GoalType) => {
    setOpen(false)
    if (newGoal === goalType || loading) return
    setGoalType(newGoal)
    setLoading(true)
    onLoadingChange?.(true)
    try {
      const calcRes = await fetch('/api/ai/calculate-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weightKg: profile.weight_kg,
          heightCm: profile.height_cm,
          age: profile.age,
          sex: profile.sex,
          activityLevel: profile.activity_level,
          goalType: newGoal,
          dietaryPreferences: profile.dietary_preferences,
        }),
      })
      const { targets, rationale } = await calcRes.json()
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets, rationale, goalType: newGoal }),
      })
      onGoalChange(newGoal, targets)
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className="flex items-center gap-1.5 max-w-[200px]"
      >
        <span className="font-semibold text-base leading-tight truncate">{goalLabel(goalType)}</span>
        {loading ? (
          <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {open && (
        <div className="absolute top-full start-0 mt-2 bg-popover border border-border rounded-xl shadow-md z-50 w-56 overflow-hidden">
          {ORDERED_GOALS.map(g => (
            <button
              key={g}
              onClick={() => select(g)}
              className={`w-full text-start px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                g === goalType ? 'font-semibold' : 'text-foreground'
              }`}
            >
              {goalLabel(g)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
