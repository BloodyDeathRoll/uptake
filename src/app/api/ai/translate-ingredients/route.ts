import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { names } = await request.json()
  if (!Array.isArray(names) || names.length === 0) {
    return NextResponse.json({ translations: {} })
  }

  const prompt = `Translate these food/ingredient names from English to Hebrew. Return ONLY a JSON object mapping each English name to its Hebrew translation. No explanation, no markdown, just the JSON.

Input: ${JSON.stringify(names)}

Example format: {"granola": "גרנולה", "banana": "בננה", "soy milk": "חלב סויה"}`

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 512,
    })

    const content = completion.choices[0]?.message?.content ?? '{}'
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const translations = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    return NextResponse.json({ translations })
  } catch {
    return NextResponse.json({ translations: {} })
  }
}
