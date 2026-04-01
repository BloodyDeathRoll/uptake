import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GroqProvider } from '@/lib/ai/groq'
import { GeminiProvider } from '@/lib/ai/gemini'
import { execute } from '@/lib/ai/rate-limiter'
import { parseNutritionResponse, RateLimitExhaustedError } from '@/lib/ai/provider'
import { validateNutritionResponse } from '@/lib/ai/schemas'
import { buildMealHistoryContext } from '@/lib/ai/prompts/meal-context'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const groq = new GroqProvider()
  const gemini = new GeminiProvider()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Your session has expired. Sign in again to continue." },
      { status: 401 }
    )
  }

  const body = await request.json()
  const { imageBase64, mimeType, description } = body

  if (!imageBase64 || !mimeType) {
    return NextResponse.json({ error: 'Image data required' }, { status: 400 })
  }

  // Fetch recent meal history to use as calibration context
  const { data: recentMeals } = await supabase
    .from('meals')
    .select('human_description, meal_items(ingredient_name, quantity, unit, calories, protein_g, carbs_g, fat_g, was_corrected)')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(15)

  const mealHistory = buildMealHistoryContext(
    (recentMeals ?? []) as Parameters<typeof buildMealHistoryContext>[0]
  )

  try {
    const response = await execute(
      'groq',
      () => groq.parseImage(imageBase64, mimeType, description, mealHistory),
      () => gemini.parseImage(imageBase64, mimeType, description, mealHistory)
    )

    const raw = parseNutritionResponse(response.content)
    const validated = validateNutritionResponse(raw)
    return NextResponse.json({ data: validated, provider: response.provider })
  } catch (err) {
    if (err instanceof RateLimitExhaustedError) {
      return NextResponse.json(
        { error: "Photo analysis is temporarily at capacity. Describe your meal below and we'll estimate the nutrition from your description.", items: [] },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: "Photo analysis is temporarily at capacity. Describe your meal below and we'll estimate the nutrition from your description.", items: [] },
      { status: 422 }
    )
  }
}
