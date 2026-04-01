import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GroqProvider } from '@/lib/ai/groq'
import { buildGoalRationalePrompt } from '@/lib/ai/prompts/goals'
import { calculateBMR } from '@/lib/nutrition/bmr'
import { calculateTDEE } from '@/lib/nutrition/tdee'
import { calculateTargets } from '@/lib/nutrition/targets'
import type { ActivityLevel, GoalType } from '@/lib/utils/constants'

// Provider instantiated inside handler to avoid build-time API key requirement

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Your session has expired. Sign in again to continue." },
      { status: 401 }
    )
  }

  const groq = new GroqProvider()
  const body = await request.json()
  const { weightKg, heightCm, age, sex, activityLevel, goalType, dietaryPreferences, customTargets } = body

  if (!weightKg || !heightCm || !age || !activityLevel || !goalType) {
    return NextResponse.json(
      { error: "Please check your inputs — we need valid values for height, weight, and age to calculate your targets." },
      { status: 400 }
    )
  }

  // Local formula always succeeds for valid inputs
  const bmr = calculateBMR({ weight: weightKg, height: heightCm, age, sex })
  const tdee = calculateTDEE(bmr, activityLevel as ActivityLevel)
  const targets = calculateTargets(goalType as GoalType, tdee, weightKg, customTargets)

  // LLM rationale — falls back silently if it fails
  let rationale: string | null = null
  try {
    const prompt = buildGoalRationalePrompt({
      weightKg, heightCm, age, sex,
      activityLevel: activityLevel as ActivityLevel,
      goalType: goalType as GoalType,
      calculatedTargets: targets,
      dietaryPreferences,
    })
    const response = await groq.parseText(prompt)
    rationale = response.content.trim()
  } catch {
    // Silent fallback — spec says GOAL_CALC_LLM_FAILED is never shown to user
  }

  return NextResponse.json({ targets, rationale, bmr, tdee })
}
