'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import Step1AboutYou from './components/Step1AboutYou'
import Step2Lifestyle from './components/Step2Lifestyle'
import Step5Review from './components/Step5Review'
import type { ActivityLevel, GoalType } from '@/lib/utils/constants'

export interface OnboardingData {
  heightCm: number
  weightKg: number
  age: number
  sex: 'male' | 'female' | null
  activityLevel: ActivityLevel
  goalType: GoalType
  dietaryPreferences: string[]
  allergies: string[]
  mealsPerDay: number
}

const TOTAL_STEPS = 3

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<Partial<OnboardingData>>({
    dietaryPreferences: [],
    allergies: [],
    mealsPerDay: 3,
  })
  const [saving, setSaving] = useState(false)

  const next = (update: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...update }))
    setStep(s => s + 1)
  }

  const back = () => setStep(s => s - 1)

  const handleComplete = async (targets: Record<string, number>, rationale: string | null) => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    await supabase.from('profiles').upsert({
      id: user.id,
      height_cm: data.heightCm,
      weight_kg: data.weightKg,
      age: data.age,
      sex: data.sex,
      activity_level: data.activityLevel,
      dietary_preferences: data.dietaryPreferences ?? [],
      allergies: data.allergies ?? [],
      meals_per_day: data.mealsPerDay,
      updated_at: new Date().toISOString(),
    })

    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets, rationale, goalType: data.goalType }),
    })

    setSaving(false)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Full-width top bar: logo left, cancel right */}
      <div className="w-full flex items-center justify-between px-6 py-4">
        <span className="text-sm font-semibold">Uptake</span>
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Centered content */}
      <div className="flex flex-col flex-1 items-center justify-center px-6">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-2">Step {step} of {TOTAL_STEPS}</p>
            <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
          </div>

          <div className="flex flex-col md:h-[600px]">
            {step === 1 && <Step1AboutYou onNext={next} />}
            {step === 2 && <Step2Lifestyle onNext={next} onBack={back} />}
            {step === 3 && (
              <Step5Review data={data as OnboardingData} onComplete={handleComplete} onBack={back} saving={saving} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
