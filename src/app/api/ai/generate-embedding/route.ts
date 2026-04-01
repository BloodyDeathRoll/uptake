import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GeminiProvider } from '@/lib/ai/gemini'

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

  const gemini = new GeminiProvider()
  const body = await request.json()
  const { text, mealId } = body

  if (!text || !mealId) {
    return NextResponse.json({ error: 'text and mealId are required' }, { status: 400 })
  }

  try {
    const embedding = await gemini.generateEmbedding(text)

    const { error } = await supabase
      .from('meal_embeddings')
      .insert({
        meal_id: mealId,
        user_id: user.id,
        description_text: text,
        embedding: embedding as unknown as never,
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    // Silent failure — meal was already saved; cron will retry
    return NextResponse.json({ success: false, message: 'Embedding will be generated asynchronously' })
  }
}
