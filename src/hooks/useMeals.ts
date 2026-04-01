'use client'

import { useState, useCallback } from 'react'

export interface MealItem {
  id?: string
  ingredient_name: string
  quantity: number
  unit: string
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  sugar_g: number | null
  saturated_fat_g: number | null
  sodium_mg: number | null
  food_group: string | null
  confidence: 'high' | 'medium' | 'low' | null
  source: 'ai_vision' | 'ai_text' | 'memory' | 'user_manual'
  was_corrected: boolean
  original_ai_estimate?: Record<string, unknown> | null
}

export interface Meal {
  id: string
  meal_type: string
  human_description: string | null
  image_url: string | null
  logged_at: string
  revision_of: string | null
  meal_items: MealItem[]
}

export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMeals = useCallback(async (date?: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = date ? `?date=${date}` : ''
      const res = await fetch(`/api/meals${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setMeals(json.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch meals')
    } finally {
      setLoading(false)
    }
  }, [])

  const saveMeal = useCallback(async (data: {
    mealType: string
    humanDescription?: string
    imageUrl?: string
    items: MealItem[]
    revisionOf?: string
  }) => {
    const res = await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    return json.data
  }, [])

  return { meals, loading, error, fetchMeals, saveMeal }
}
