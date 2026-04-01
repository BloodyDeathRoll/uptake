import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GroqProvider } from '@/lib/ai/groq'
import { GeminiProvider } from '@/lib/ai/gemini'
import { execute } from '@/lib/ai/rate-limiter'
import { parseNutritionResponse, AIParseError, RateLimitExhaustedError } from '@/lib/ai/provider'
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
  const { description } = body

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return NextResponse.json(
      { error: "We had trouble understanding that description. Try listing ingredients separately, for example: '200g chicken, 1 cup rice, mixed salad'." },
      { status: 400 }
    )
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

  // Try parse with retry once on failure
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await execute(
        'groq',
        () => groq.parseText(description, mealHistory),
        () => gemini.parseText(description, mealHistory)
      )

      const raw = parseNutritionResponse(response.content)
      const validated = validateNutritionResponse(raw)
      return NextResponse.json({ data: validated, provider: response.provider })
    } catch (err) {
      if (attempt === 0 && !(err instanceof RateLimitExhaustedError)) continue
      if (err instanceof RateLimitExhaustedError) {
        return NextResponse.json(
          { error: "We had trouble understanding that description. Try listing ingredients separately, for example: '200g chicken, 1 cup rice, mixed salad'.", items: [] },
          { status: 503 }
        )
      }
      if (attempt === 1) {
        // Return empty card on second failure
        return NextResponse.json(
          { error: "We had trouble understanding that description. Try listing ingredients separately, for example: '200g chicken, 1 cup rice, mixed salad'.", items: [] },
          { status: 422 }
        )
      }
    }
  }

  return NextResponse.json(
    { error: "We had trouble understanding that description. Try listing ingredients separately, for example: '200g chicken, 1 cup rice, mixed salad'.", items: [] },
    { status: 422 }
  )
}
