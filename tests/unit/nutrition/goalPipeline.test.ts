/**
 * Integration tests for the full goal-calculation pipeline:
 *   calculateBMR → calculateTDEE → calculateTargets
 *
 * These tests mirror what happens in /api/ai/calculate-goals on every onboarding
 * completion. If any case here breaks, the onboarding funnel will show "Try again".
 */

import { calculateBMR } from '@/lib/nutrition/bmr'
import { calculateTDEE } from '@/lib/nutrition/tdee'
import { calculateTargets } from '@/lib/nutrition/targets'
import type { ActivityLevel, GoalType } from '@/lib/utils/constants'

const ALL_GOAL_TYPES: GoalType[] = [
  'muscle_gain', 'athlete_cut', 'weight_loss', 'maintenance',
  'recomposition', 'endurance', 'heart_healthy', 'longevity',
  'diabetic', 'recovery',
]

const ALL_ACTIVITY_LEVELS: ActivityLevel[] = [
  'sedentary', 'light', 'moderate', 'very_active', 'athlete',
]

function runPipeline(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'male' | 'female' | null,
  activityLevel: ActivityLevel,
  goalType: GoalType,
) {
  const bmr = calculateBMR({ weight: weightKg, height: heightCm, age, sex })
  const tdee = calculateTDEE(bmr, activityLevel)
  return { targets: calculateTargets(goalType, tdee, weightKg), bmr, tdee }
}

// ─── Typical user profiles ────────────────────────────────────────────────────

const PROFILES = [
  { label: 'average male',   weightKg: 80,  heightCm: 178, age: 30, sex: 'male'   as const },
  { label: 'average female', weightKg: 63,  heightCm: 163, age: 28, sex: 'female' as const },
  { label: 'sex not set',    weightKg: 75,  heightCm: 170, age: 35, sex: null },
  { label: 'heavy user',     weightKg: 130, heightCm: 185, age: 45, sex: 'male'   as const },
  { label: 'light user',     weightKg: 48,  heightCm: 155, age: 22, sex: 'female' as const },
]

// ─── Shape validation helper ──────────────────────────────────────────────────

function expectValidTargets(targets: ReturnType<typeof calculateTargets>) {
  expect(targets.calories).toBeGreaterThan(0)
  expect(targets.protein_g).toBeGreaterThan(0)
  expect(targets.carbs_g).toBeGreaterThanOrEqual(0)
  expect(targets.fat_g).toBeGreaterThan(0)
  expect(targets.fiber_g).toBeGreaterThan(0)
  expect(targets.water_ml).toBeGreaterThan(0)

  // None of the values should be NaN or Infinite
  for (const val of Object.values(targets)) {
    if (typeof val === 'number') {
      expect(isFinite(val)).toBe(true)
      expect(isNaN(val)).toBe(false)
    }
  }

  // Sanity range: nobody needs fewer than 800 kcal or more than 10 000 kcal
  expect(targets.calories).toBeGreaterThanOrEqual(800)
  expect(targets.calories).toBeLessThanOrEqual(10_000)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('goal pipeline: all goal types × typical user', () => {
  const profile = PROFILES[0] // average male, moderate activity

  test.each(ALL_GOAL_TYPES)('%s produces valid targets', goalType => {
    const { targets } = runPipeline(
      profile.weightKg, profile.heightCm, profile.age, profile.sex,
      'moderate', goalType,
    )
    expectValidTargets(targets)
  })
})

describe('goal pipeline: all activity levels × maintenance goal', () => {
  test.each(ALL_ACTIVITY_LEVELS)('%s produces valid targets', activityLevel => {
    const { targets, bmr, tdee } = runPipeline(80, 178, 30, 'male', activityLevel, 'maintenance')
    expectValidTargets(targets)
    expect(bmr).toBeGreaterThan(0)
    expect(tdee).toBeGreaterThan(bmr) // TDEE always exceeds BMR
  })
})

describe('goal pipeline: different user profiles', () => {
  test.each(PROFILES)('$label / weight_loss', ({ weightKg, heightCm, age, sex }) => {
    const { targets } = runPipeline(weightKg, heightCm, age, sex, 'moderate', 'weight_loss')
    expectValidTargets(targets)
  })

  test.each(PROFILES)('$label / muscle_gain', ({ weightKg, heightCm, age, sex }) => {
    const { targets } = runPipeline(weightKg, heightCm, age, sex, 'moderate', 'muscle_gain')
    expectValidTargets(targets)
  })
})

describe('goal pipeline: minimum calorie floor', () => {
  test('weight_loss never drops below 1200 kcal even at very low TDEE', () => {
    // Very petite / sedentary user
    const { targets } = runPipeline(45, 150, 22, 'female', 'sedentary', 'weight_loss')
    expect(targets.calories).toBeGreaterThanOrEqual(1200)
  })

  test('athlete_cut preserves adequate calories for high body weight', () => {
    const { targets } = runPipeline(100, 185, 28, 'male', 'athlete', 'athlete_cut')
    expect(targets.calories).toBeGreaterThan(1800)
  })
})

describe('goal pipeline: caloric direction', () => {
  test('muscle_gain is above TDEE', () => {
    const bmr = calculateBMR({ weight: 80, height: 178, age: 30, sex: 'male' })
    const tdee = calculateTDEE(bmr, 'moderate')
    const { calories } = calculateTargets('muscle_gain', tdee, 80)
    expect(calories).toBeGreaterThan(tdee)
  })

  test('weight_loss is below TDEE', () => {
    const bmr = calculateBMR({ weight: 80, height: 178, age: 30, sex: 'male' })
    const tdee = calculateTDEE(bmr, 'moderate')
    const { calories } = calculateTargets('weight_loss', tdee, 80)
    expect(calories).toBeLessThan(tdee)
  })

  test('maintenance is within ±100 of TDEE', () => {
    const bmr = calculateBMR({ weight: 80, height: 178, age: 30, sex: 'male' })
    const tdee = calculateTDEE(bmr, 'moderate')
    const { calories } = calculateTargets('maintenance', tdee, 80)
    expect(Math.abs(calories - tdee)).toBeLessThanOrEqual(100)
  })
})

describe('goal pipeline: invalid inputs throw clearly', () => {
  test('negative weight throws', () => {
    expect(() => calculateBMR({ weight: -5, height: 175, age: 30, sex: 'male' }))
      .toThrow('Weight must be positive')
  })

  test('zero height throws', () => {
    expect(() => calculateBMR({ weight: 70, height: 0, age: 30, sex: 'male' }))
      .toThrow('Height must be positive')
  })

  test('unknown activity level throws', () => {
    const bmr = calculateBMR({ weight: 70, height: 175, age: 30, sex: 'male' })
    expect(() => calculateTDEE(bmr, 'couch_potato' as ActivityLevel))
      .toThrow('Unknown activity level')
  })

  test('unknown goal type throws', () => {
    expect(() => calculateTargets('keto_warrior' as GoalType, 2500, 80))
      .toThrow('Unknown goal type')
  })
})
