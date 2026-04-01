'use client'

import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { GOAL_LABELS, GOAL_DESCRIPTIONS, type GoalType } from '@/lib/utils/constants'

export const ORDERED_GOALS: GoalType[] = [
  'muscle_gain', 'athlete_cut', 'weight_loss', 'maintenance',
  'recomposition', 'endurance', 'heart_healthy', 'longevity',
  'diabetic', 'recovery',
]

export interface GoalProfile {
  weight_kg: number
  height_cm: number
  age: number
  sex: string | null
  activity_level: string
  dietary_preferences: string[]
}

interface Props {
  initialGoalType: GoalType
  profile: GoalProfile
  onGoalChange: (goalType: GoalType, targets: Record<string, number>) => void
}

interface SlideItem {
  index: number
  id: number
}

const DURATION = 220

export default function GoalSwitcher({ initialGoalType, profile, onGoalChange }: Props) {
  const startIndex = Math.max(ORDERED_GOALS.indexOf(initialGoalType), 0)
  const [curr, setCurr] = useState<SlideItem>({ index: startIndex, id: 0 })
  const [exiting, setExiting] = useState<(SlideItem & { toLeft: boolean }) | null>(null)
  const [enterFromRight, setEnterFromRight] = useState(true)
  const [loading, setLoading] = useState(false)
  const exitTimer = useRef<ReturnType<typeof setTimeout>>()

  const navigate = async (newIndex: number, dir: 'next' | 'prev') => {
    if (loading) return

    clearTimeout(exitTimer.current)
    const toLeft = dir === 'next'
    setExiting({ ...curr, toLeft })
    setEnterFromRight(toLeft)
    setCurr({ index: newIndex, id: curr.id + 1 })
    exitTimer.current = setTimeout(() => setExiting(null), DURATION)

    const newGoal = ORDERED_GOALS[newIndex]
    setLoading(true)
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
    }
  }

  const prev = () => navigate((curr.index - 1 + ORDERED_GOALS.length) % ORDERED_GOALS.length, 'prev')
  const next = () => navigate((curr.index + 1) % ORDERED_GOALS.length, 'next')

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={prev}
        disabled={loading}
        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 flex-shrink-0"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0 text-center relative overflow-hidden">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Goal</div>

        {/* Sliding text area */}
        <div className="relative" style={{ height: '2.75rem' }}>
          {/* Exiting label */}
          {exiting && (
            <div
              key={`exit-${exiting.id}`}
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{
                animation: `${exiting.toLeft ? 'goal-exit-to-left' : 'goal-exit-to-right'} ${DURATION}ms ease forwards`,
              }}
            >
              <div className="font-semibold text-sm flex items-center gap-1.5">
                {GOAL_LABELS[ORDERED_GOALS[exiting.index]]}
              </div>
              <div className="text-xs text-muted-foreground truncate w-full px-1">
                {GOAL_DESCRIPTIONS[ORDERED_GOALS[exiting.index]]}
              </div>
            </div>
          )}

          {/* Entering label */}
          <div
            key={`curr-${curr.id}`}
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{
              animation: curr.id === 0
                ? undefined
                : `${enterFromRight ? 'goal-enter-from-right' : 'goal-enter-from-left'} ${DURATION}ms ease forwards`,
            }}
          >
            <div className="font-semibold text-sm flex items-center gap-1.5">
              {loading && (
                <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
              )}
              {GOAL_LABELS[ORDERED_GOALS[curr.index]]}
            </div>
            <div className="text-xs text-muted-foreground truncate w-full px-1">
              {GOAL_DESCRIPTIONS[ORDERED_GOALS[curr.index]]}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={next}
        disabled={loading}
        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 flex-shrink-0"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
