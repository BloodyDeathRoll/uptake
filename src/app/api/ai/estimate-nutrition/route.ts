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

  const r1dp = (v: unknown, factor: number) =>
    typeof v === 'number' ? Math.round(v * factor * 10) / 10 : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overrideToItem = (ingredient: { name: string; quantity: number; unit: string }, ov: any, canonical?: string) => {
    const factor = ingredient.quantity / 100
    return {
      name: ingredient.name,
      canonical_name: canonical ?? (ov.canonical_name as string | undefined),
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
  }

  // Fast path: same-language match by ingredient_name. Skips the AI call when
  // the user has already overridden every ingredient in the input language.
  const names = parsed.data.map(i => i.name)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: nameOverrides } = await (supabase as any)
    .from('ingredient_nutrition_overrides')
    .select('ingredient_name, canonical_name, unit, calories_per_100, protein_g_per_100, carbs_g_per_100, fat_g_per_100, fiber_g_per_100, food_group')
    .eq('user_id', user.id)
    .in('ingredient_name', names)

  if (nameOverrides && nameOverrides.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map((nameOverrides as any[]).map((o: Record<string, unknown>) => [`${o.ingredient_name}::${o.unit}`, o]))
    const resolved = parsed.data.map(ingredient => {
      const ov = map.get(`${ingredient.name}::${ingredient.unit}`)
      return ov ? overrideToItem(ingredient, ov) : null
    })

    if (resolved.every(r => r !== null)) {
      return NextResponse.json({ data: { items: resolved }, provider: 'override' })
    }
  }

  // Slow path: call AI to get nutrition + canonical_name, then prefer any
  // existing override keyed on canonical_name (covers cross-language matches).
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await execute(
        'groq',
        () => groq.estimateNutrition(parsed.data),
        () => gemini.estimateNutrition(parsed.data)
      )

      const raw = parseNutritionResponse(response.content)
      const validated = validateNutritionResponse(raw)

      const canonicals = validated.items
        .map(i => i.canonical_name)
        .filter((c): c is string => typeof c === 'string' && c.length > 0)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let canonicalOverrides: any[] = []
      if (canonicals.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from('ingredient_nutrition_overrides')
          .select('canonical_name, unit, calories_per_100, protein_g_per_100, carbs_g_per_100, fat_g_per_100, fiber_g_per_100, food_group')
          .eq('user_id', user.id)
          .in('canonical_name', canonicals)
        canonicalOverrides = data ?? []
      }

      const overrideMap = new Map(
        canonicalOverrides.map(o => [`${o.canonical_name}::${o.unit}`, o])
      )

      const merged = validated.items.map(item => {
        const canonical = item.canonical_name
        const ov = canonical ? overrideMap.get(`${canonical}::${item.unit}`) : undefined
        if (!ov) return item
        return overrideToItem(
          { name: item.name, quantity: item.quantity, unit: item.unit },
          ov,
          canonical,
        )
      })

      return NextResponse.json({ data: { ...validated, items: merged }, provider: response.provider })
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
