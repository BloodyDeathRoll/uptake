/**
 * Tests for the "Log this" flow from DailyMenuSuggestion → /meal/new.
 *
 * Regression coverage for: description param being ignored, causing an empty
 * form to open and meals to vanish from the suggestion list without logging.
 */

import type { MealType } from '@/lib/utils/constants'

// ─── Pure helpers extracted from the component logic ────────────────────────

/** Build the URL used by DailyMenuSuggestion's "Log this" link. */
function buildLogUrl(description: string, mealType: string): string {
  return `/meal/new?description=${encodeURIComponent(description)}&mealType=${mealType}`
}

/**
 * Parse search params the way NewMealPageInner does:
 * returns the initial state values for description and mealType.
 */
function parseLogParams(params: Record<string, string | null>): {
  description: string
  mealType: MealType
  shouldAutoAnalyze: boolean
} {
  const urlDescription = params.description ?? ''
  const urlMealType = (params.mealType as MealType) || null
  return {
    description: urlDescription,
    mealType: urlMealType ?? 'snack',
    shouldAutoAnalyze: urlDescription.length > 0,
  }
}

// ─── buildLogUrl ─────────────────────────────────────────────────────────────

describe('buildLogUrl', () => {
  test('encodes description in query param', () => {
    const url = buildLogUrl('Oatmeal with banana and honey', 'breakfast')
    expect(url).toContain('description=Oatmeal%20with%20banana%20and%20honey')
  })

  test('includes mealType param', () => {
    const url = buildLogUrl('Grilled chicken salad', 'lunch')
    expect(url).toContain('mealType=lunch')
  })

  test('produces a /meal/new path', () => {
    const url = buildLogUrl('anything', 'dinner')
    expect(url.startsWith('/meal/new?')).toBe(true)
  })

  test('encodes special characters in description', () => {
    const url = buildLogUrl('Greek yogurt & berries (200g)', 'snack')
    // & must be encoded so it doesn't break the query string
    expect(url).not.toContain('description=Greek yogurt & berries')
    expect(decodeURIComponent(url.split('description=')[1].split('&')[0])).toBe('Greek yogurt & berries (200g)')
  })

  test('round-trips through URL encoding correctly', () => {
    const description = 'Shakshuka with feta (2 eggs, 50g feta)'
    const url = buildLogUrl(description, 'breakfast')
    const rawParam = url.split('description=')[1].split('&')[0]
    expect(decodeURIComponent(rawParam)).toBe(description)
  })
})

// ─── parseLogParams ───────────────────────────────────────────────────────────

describe('parseLogParams: description', () => {
  test('pre-populates description from URL param', () => {
    const { description } = parseLogParams({ description: 'Avocado toast', mealType: 'breakfast' })
    expect(description).toBe('Avocado toast')
  })

  test('defaults description to empty string when param is absent', () => {
    const { description } = parseLogParams({ description: null, mealType: null })
    expect(description).toBe('')
  })

  test('defaults description to empty string when param is empty string', () => {
    const { description } = parseLogParams({ description: '', mealType: 'lunch' })
    expect(description).toBe('')
  })
})

describe('parseLogParams: mealType', () => {
  test('pre-selects breakfast tab', () => {
    const { mealType } = parseLogParams({ description: 'Oats', mealType: 'breakfast' })
    expect(mealType).toBe('breakfast')
  })

  test('pre-selects lunch tab', () => {
    const { mealType } = parseLogParams({ description: 'Salad', mealType: 'lunch' })
    expect(mealType).toBe('lunch')
  })

  test('pre-selects dinner tab', () => {
    const { mealType } = parseLogParams({ description: 'Pasta', mealType: 'dinner' })
    expect(mealType).toBe('dinner')
  })

  test('pre-selects snack tab', () => {
    const { mealType } = parseLogParams({ description: 'Apple', mealType: 'snack' })
    expect(mealType).toBe('snack')
  })

  test('falls back to snack when mealType param is absent', () => {
    const { mealType } = parseLogParams({ description: 'Something', mealType: null })
    expect(mealType).toBe('snack')
  })

  test('falls back to snack when mealType param is empty', () => {
    const { mealType } = parseLogParams({ description: 'Something', mealType: '' })
    expect(mealType).toBe('snack')
  })
})

describe('parseLogParams: shouldAutoAnalyze', () => {
  test('triggers auto-analyze when description is present', () => {
    const { shouldAutoAnalyze } = parseLogParams({ description: 'Pancakes', mealType: 'breakfast' })
    expect(shouldAutoAnalyze).toBe(true)
  })

  test('does NOT trigger auto-analyze when description is absent', () => {
    const { shouldAutoAnalyze } = parseLogParams({ description: null, mealType: null })
    expect(shouldAutoAnalyze).toBe(false)
  })

  test('does NOT trigger auto-analyze when description is empty string', () => {
    const { shouldAutoAnalyze } = parseLogParams({ description: '', mealType: 'snack' })
    expect(shouldAutoAnalyze).toBe(false)
  })
})

// ─── Round-trip: DailyMenuSuggestion → /meal/new ─────────────────────────────

describe('Log this round-trip', () => {
  test('description and mealType survive URL encoding and parsing', () => {
    const meal = { description: 'Grilled salmon with rice & vegetables', meal_type: 'dinner' }
    const url = buildLogUrl(meal.description, meal.meal_type)

    // Simulate what the browser gives the page as search params
    const urlObj = new URL(url, 'http://localhost')
    const params = {
      description: urlObj.searchParams.get('description'),
      mealType: urlObj.searchParams.get('mealType'),
    }
    const { description, mealType, shouldAutoAnalyze } = parseLogParams(params)

    expect(description).toBe(meal.description)
    expect(mealType).toBe(meal.meal_type)
    expect(shouldAutoAnalyze).toBe(true)
  })

  test('opening /meal/new directly (no params) leaves form empty and skips auto-analyze', () => {
    const params = { description: null, mealType: null }
    const { description, mealType, shouldAutoAnalyze } = parseLogParams(params)

    expect(description).toBe('')
    expect(mealType).toBe('snack')
    expect(shouldAutoAnalyze).toBe(false)
  })
})
