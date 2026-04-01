'use client'

import { useState, useEffect } from 'react'

export interface GoalTargets {
  id: string
  goal_type: string
  calories_target: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  sugar_g: number | null
  saturated_fat_g: number | null
  sodium_mg: number | null
  water_ml: number | null
  protein_per_kg: number | null
  net_carbs_g: number | null
  rationale: string | null
  active: boolean
}

export function useGoals() {
  const [goal, setGoal] = useState<GoalTargets | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then(json => setGoal(json.data ?? null))
      .finally(() => setLoading(false))
  }, [])

  return { goal, loading }
}
