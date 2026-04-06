import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'
import { buildAnalyzeDayPrompt } from '@/lib/ai/prompts/analyze-day'
import { GOAL_LABELS } from '@/lib/utils/constants'
import { computePriority } from '@/lib/nutrition/priority'
import { buildAdherenceTrend, buildFoodGroupContext } from '@/lib/ai/prompts/user-context'
import { buildDietaryBlock } from '@/lib/ai/prompts/suggest-meal'

const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { consumed, targets, goalType, days, hourOfDay } = body

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)

  const [{ data: profile }, { data: snapshots }, { data: recentItems }, { data: recentIngredients }] = await Promise.all([
    supabase.from('profiles').select('weight_kg, age, sex, activity_level, dietary_preferences, allergies').eq('id', user.id).single(),
    supabase.from('daily_snapshots')
      .select('total_calories, total_protein_g, total_carbs_g, total_fat_g')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgo)
      .order('date', { ascending: false }),
    supabase.from('meal_items')
      .select('food_group, meal_id, meals!inner(user_id)')
      .eq('meals.user_id', user.id)
      .not('food_group', 'is', null)
      .limit(80),
    supabase.from('meal_items')
      .select('ingredient_name, calories, protein_g, carbs_g, fat_g, meals!inner(user_id, logged_at)')
      .eq('meals.user_id', user.id)
      .not('ingredient_name', 'is', null)
      .order('meals(logged_at)', { ascending: false })
      .limit(40),
  ])

  const goalLabel = GOAL_LABELS[goalType as keyof typeof GOAL_LABELS] ?? goalType
  const priority = computePriority(consumed, targets, goalType)
  const adherenceTrend = buildAdherenceTrend(snapshots ?? [], targets)
  const foodGroupContext = buildFoodGroupContext((recentItems ?? []) as { food_group: string | null }[])
  const dietaryBlock = buildDietaryBlock(
    (profile?.dietary_preferences as string[] | null) ?? [],
    (profile?.allergies as string[] | null) ?? [],
  )

  // Deduplicate and pick top 20 distinct ingredient names for food suggestions
  const seen = new Set<string>()
  const recentFoods = (recentIngredients ?? [])
    .filter(it => {
      const name = (it.ingredient_name as string | null)?.trim().toLowerCase()
      if (!name || seen.has(name)) return false
      seen.add(name)
      return true
    })
    .slice(0, 20)
    .map(it => ({
      name: it.ingredient_name as string,
      cal: Math.round((it.calories as number | null) ?? 0),
      pro: Math.round((it.protein_g as number | null) ?? 0),
      carb: Math.round((it.carbs_g as number | null) ?? 0),
      fat: Math.round((it.fat_g as number | null) ?? 0),
    }))

  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const prompt = buildAnalyzeDayPrompt({ goalType, goalLabel, consumed, targets, days: days ?? 1, priority, profile, hourOfDay: hourOfDay ?? new Date().getHours(), adherenceTrend, foodGroupContext, recentFoods, dietaryBlock })

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a nutrition coach. Always respond with valid JSON only — no markdown, no explanation, no code fences.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content ?? ''
    // Strip any stray fences (belt-and-suspenders), then parse
    const cleaned = content.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error(`No JSON in response: ${content.slice(0, 300)}`)

    const analysis = JSON.parse(jsonMatch[0])
    return NextResponse.json({ analysis })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[analyze-day] error:', message)
    return NextResponse.json({ error: 'Could not generate analysis' }, { status: 500 })
  }
}
