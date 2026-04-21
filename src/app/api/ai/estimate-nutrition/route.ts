import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GroqProvider } from '@/lib/ai/groq'
import { GeminiProvider } from '@/lib/ai/gemini'
import { execute } from '@/lib/ai/rate-limiter'
import { parseNutritionResponse, RateLimitExhaustedError } from '@/lib/ai/provider'
import { validateNutritionResponse } from '@/lib/ai/schemas'
import { z } from 'zod'

// Provider instantiated inside handler to avoid build-time API key requirement
// Provider instantiated inside handler to avoid build-time API key requirement

const ingredientSchema = z.array(z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
}))

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
  const parsed = ingredientSchema.safeParse(body.ingredients)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Nutrition estimation is temporarily unavailable. You can enter values manually in the fields below, or tap 'Try again' in a moment." },
      { status: 400 }
    )
  }

  // Check for user-saved nutrition overrides before calling AI
  const names = parsed.data.map(i => i.name)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: overrides } = await (supabase as any)
    .from('ingredient_nutrition_overrides')
    .select('ingredient_name, unit, calories_per_100, protein_g_per_100, carbs_g_per_100, fat_g_per_100, fiber_g_per_100, food_group')
    .eq('user_id', user.id)
    .in('ingredient_name', names)

  if (overrides && overrides.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const overrideMap = new Map((overrides as any[]).map((o: Record<string, unknown>) => [`${o.ingredient_name}::${o.unit}`, o]))
    const r1dp = (v: unknown, factor: number) =>
      typeof v === 'number' ? Math.round(v * factor * 10) / 10 : null

    const resolved = parsed.data.map(ingredient => {
      const key = `${ingredient.name}::${ingredient.unit}`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ov = overrideMap.get(key) as any
      if (!ov) return null
      const factor = ingredient.quantity / 100
      return {
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        calories: typeof ov.calories_per_100 === 'number' ? Math.round(ov.calories_per_100 * factor) : null,
        protein_g: r1dp(ov.protein_g_per_100, factor),
        carbs_g: r1dp(ov.carbs_g_per_100, factor),
        fat_g: r1dp(ov.fat_g_per_100, factor),
        fiber_g: r1dp(ov.fiber_g_per_100, factor),
        food_group: ov.food_group ?? null,
        confidence: 'high' as const,
      }
    })

    if (resolved.every(r => r !== null)) {
      return NextResponse.json({ data: { items: resolved }, provider: 'override' })
    }
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await execute(
        'groq',
        () => groq.estimateNutrition(parsed.data),
        () => gemini.estimateNutrition(parsed.data)
      )

      const raw = parseNutritionResponse(response.content)
      const validated = validateNutritionResponse(raw)
      return NextResponse.json({ data: validated, provider: response.provider })
    } catch (err) {
      if (attempt === 0 && !(err instanceof RateLimitExhaustedError)) continue
      if (attempt === 1) {
        return NextResponse.json(
          { error: "Nutrition estimation is temporarily unavailable. You can enter values manually in the fields below, or tap 'Try again' in a moment.", items: [] },
          { status: 422 }
        )
      }
    }
  }

  return NextResponse.json(
    { error: "Nutrition estimation is temporarily unavailable. You can enter values manually in the fields below, or tap 'Try again' in a moment.", items: [] },
    { status: 422 }
  )
}
