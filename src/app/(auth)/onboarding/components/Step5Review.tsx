'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { OnboardingData } from '../page'
import { useLanguage, type Translations } from '@/lib/i18n'
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
  const { t } = useLanguage()
  const goalLabel = (g: string) => (t[('goalLabel_' + g) as keyof Translations] as string) ?? g
  const [targets, setTargets] = useState<Targets | null>(null)
  const [rationale, setRationale] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setTargets(null)
    fetch('/api/ai/calculate-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weightKg: data.weightKg, heightCm: data.heightCm, age: data.age,
        sex: data.sex, activityLevel: data.activityLevel, goalType: data.goalType,
        dietaryPreferences: data.dietaryPreferences,
      }),
    })
      .then(async r => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error ?? t.err_calculate_targets)
        return json
      })
      .then(json => { if (!cancelled) { setTargets(json.targets); setRationale(json.rationale) } })
      .catch(err => { if (!cancelled) setError(err.message ?? t.err_calculate_targets) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [attempt])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">{t.calculating_targets}</p>
      </div>
    )
  }

  if (error || !targets) {
    return (
      <div className="space-y-4 text-center py-12">
        <p className="text-destructive text-sm">{error}</p>
        <Button variant="outline" onClick={() => setAttempt(a => a + 1)}>{t.try_again}</Button>
      </div>
    )
  }

  const rows = [
    { label: t.daily_calories, value: formatCalories(targets.calories), primary: true },
    { label: t.protein, value: formatGrams(targets.protein_g) },
    { label: t.carbohydrates, value: formatGrams(targets.carbs_g) },
    { label: t.fat_label, value: formatGrams(targets.fat_g) },
    { label: t.fiber, value: formatGrams(targets.fiber_g) },
    { label: t.water, value: formatMl(targets.water_ml) },
  ]

  return (
    <div className="flex flex-col flex-1 gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.your_targets}</h1>
        <p className="text-muted-foreground mt-1">
          {t.personalized_for} <span className="font-semibold text-foreground">{goalLabel(data.goalType)}</span>
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
        <Button type="button" variant="outline" onClick={onBack} className="flex-1" disabled={saving}>{t.back}</Button>
        <Button onClick={() => onComplete(targets as unknown as Record<string, number>, rationale)} className="flex-1" disabled={saving}>
          {saving ? t.setting_up : t.start_tracking}
        </Button>
      </div>
    </div>
  )
}
