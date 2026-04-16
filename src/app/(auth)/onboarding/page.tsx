'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import Step1AboutYou from './components/Step1AboutYou'
import Step2Activity from './components/Step2Activity'
import Step3Goal from './components/Step3Goal'
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

// 3 named steps: About you → Activity level → Goals
// step 4 is the review screen (shown at 100% progress, "Step 3 of 3")
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

  const displayStep = Math.min(step, TOTAL_STEPS)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="flex flex-col flex-1 items-center px-6 pt-8 pb-8">
        <div className="w-full max-w-[38.4rem] flex flex-col flex-1">
          {/* Progress + cancel */}
          <div className="mb-8 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Step {displayStep} of {TOTAL_STEPS}</p>
              <button
                onClick={() => router.back()}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
            <Progress value={(displayStep / TOTAL_STEPS) * 100} className="h-2" />
          </div>

          <div className="flex flex-col flex-1 min-h-0">
            {step === 1 && <Step1AboutYou onNext={next} />}
            {step === 2 && <Step2Activity onNext={next} onBack={back} />}
            {step === 3 && <Step3Goal onNext={next} onBack={back} />}
            {step === 4 && (
              <Step5Review data={data as OnboardingData} onComplete={handleComplete} onBack={back} saving={saving} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
