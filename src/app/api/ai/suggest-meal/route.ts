import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'
import { buildSuggestMealPrompt } from '@/lib/ai/prompts/suggest-meal'
import { computePriority } from '@/lib/nutrition/priority'
import { buildMealTimingContext, buildFoodGroupContext } from '@/lib/ai/prompts/user-context'

const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { consumed, targets, goalType, hourOfDay, location } = body

  // Fetch dietary preferences, meal timing, and food group distribution in parallel
  const [{ data: profile }, { data: recentMeals }, { data: recentItems }] = await Promise.all([
    supabase.from('profiles').select('dietary_preferences, allergies').eq('id', user.id).single(),
    supabase.from('meals')
      .select('meal_type, logged_at')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(20),
    supabase.from('meal_items')
      .select('food_group, meal_id, meals!inner(user_id)')
      .eq('meals.user_id', user.id)
      .not('food_group', 'is', null)
      .limit(60),
  ])

  const dietaryPreferences: string[] = profile?.dietary_preferences ?? []
  const allergies: string[] = profile?.allergies ?? []

  const priority = computePriority(consumed, targets, goalType)
  const mealTimingContext = buildMealTimingContext(recentMeals ?? [])
  const foodGroupContext  = buildFoodGroupContext((recentItems ?? []) as { food_group: string | null }[])

  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const prompt = buildSuggestMealPrompt({ consumed, targets, goalType, hourOfDay, dietaryPreferences, allergies, location, priority, mealTimingContext, foodGroupContext })

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    })

    const content = completion.choices[0]?.message?.content ?? ''
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error(`No JSON array in response. Content: ${content.slice(0, 200)}`)

    const suggestions = JSON.parse(jsonMatch[0])
    if (!Array.isArray(suggestions) || suggestions.length === 0) throw new Error('Invalid format')

    return NextResponse.json({ suggestions: suggestions.slice(0, 3) })
  } catch (err) {
    console.error('[suggest-meal]', err)
    return NextResponse.json({ error: 'Could not generate suggestions' }, { status: 500 })
  }
}
