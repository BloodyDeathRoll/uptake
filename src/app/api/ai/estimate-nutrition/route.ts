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
