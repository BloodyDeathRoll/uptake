import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'
import { buildAnalyzeDayPrompt } from '@/lib/ai/prompts/analyze-day'
import { GOAL_LABELS } from '@/lib/utils/constants'
import { computePriority } from '@/lib/nutrition/priority'

const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { consumed, targets, goalType, days } = body

  const { data: profile } = await supabase
    .from('profiles')
    .select('weight_kg, age, sex, activity_level')
    .eq('id', user.id)
    .single()

  const goalLabel = GOAL_LABELS[goalType as keyof typeof GOAL_LABELS] ?? goalType
  const priority = computePriority(consumed, targets, goalType)

  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const prompt = buildAnalyzeDayPrompt({ goalType, goalLabel, consumed, targets, days: days ?? 1, priority, profile })

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 2048,
    })

    const content = completion.choices[0]?.message?.content ?? ''
    // Strip markdown fences then extract the outermost JSON object
    const cleaned = content.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error(`No JSON in response. Content: ${content.slice(0, 200)}`)

    const analysis = JSON.parse(jsonMatch[0])
    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('[analyze-day]', err)
    return NextResponse.json({ error: 'Could not generate analysis' }, { status: 500 })
  }
}
