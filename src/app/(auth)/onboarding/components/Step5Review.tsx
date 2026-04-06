'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { OnboardingData } from '../page'
import { GOAL_LABELS } from '@/lib/utils/constants'
import { formatCalories, formatGrams, formatMl } from '@/lib/utils/format'

interface Props {
  data: OnboardingData
  onComplete: (targets: Record<string, number>, rationale: string | null) => void
  onBack: () => void
  saving: boolean
}

interface Targets {
  calories: number; protein_g: number; carbs_g: number
  fat_g: number; fiber_g: number; water_ml: number
}

export default function Step5Review({ data, onComplete, onBack, saving }: Props) {
  const [targets, setTargets] = useState<Targets | null>(null)
  const [rationale, setRationale] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/ai/calculate-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weightKg: data.weightKg, heightCm: data.heightCm, age: data.age,
        sex: data.sex, activityLevel: data.activityLevel, goalType: data.goalType,
        dietaryPreferences: data.dietaryPreferences,
      }),
    })
      .then(r => r.json())
      .then(json => { setTargets(json.targets); setRationale(json.rationale) })
      .catch(() => setError('Failed to calculate targets. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Calculating your targets…</p>
      </div>
    )
  }

  if (error || !targets) {
    return (
      <div className="space-y-4 text-center py-12">
        <p className="text-destructive text-sm">{error}</p>
        <Button variant="outline" onClick={() => { setLoading(true); setError(null) }}>Try again</Button>
      </div>
    )
  }

  const rows = [
    { label: 'Daily calories', value: formatCalories(targets.calories), primary: true },
    { label: 'Protein', value: formatGrams(targets.protein_g) },
    { label: 'Carbohydrates', value: formatGrams(targets.carbs_g) },
    { label: 'Fat', value: formatGrams(targets.fat_g) },
    { label: 'Fiber', value: formatGrams(targets.fiber_g) },
    { label: 'Water', value: formatMl(targets.water_ml) },
  ]

  return (
    <div className="flex flex-col flex-1 gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your targets</h1>
        <p className="text-muted-foreground mt-1">
          Personalized for <span className="font-semibold text-foreground">{GOAL_LABELS[data.goalType]}</span>
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 divide-y divide-border">
          {rows.map(({ label, value, primary }) => (
            <div key={label} className="flex justify-between items-center py-3">
              <span className={primary ? 'font-semibold' : 'text-sm text-muted-foreground'}>{label}</span>
              <span className={primary ? 'text-foreground font-bold text-lg' : 'font-medium'}>{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3 mt-auto">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1" disabled={saving}>Back</Button>
        <Button onClick={() => onComplete(targets as unknown as Record<string, number>, rationale)} className="flex-1" disabled={saving}>
          {saving ? 'Setting up…' : 'Start tracking'}
        </Button>
      </div>
    </div>
  )
}
