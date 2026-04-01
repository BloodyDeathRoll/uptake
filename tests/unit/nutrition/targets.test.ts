import { calculateTargets } from '@/lib/nutrition/targets'
import type { GoalType } from '@/lib/utils/constants'

describe('calculateTargets', () => {
  const tdee = 2500
  const weight = 80

  test('muscle_gain: caloric surplus, protein ≥ 1.8g/kg', () => {
    const t = calculateTargets('muscle_gain', tdee, weight)
    expect(t.calories).toBeGreaterThan(tdee)
    expect(t.protein_g / weight).toBeGreaterThanOrEqual(1.8)
  })

  test('weight_loss: caloric deficit', () => {
    const t = calculateTargets('weight_loss', tdee, weight)
    expect(t.calories).toBeLessThan(tdee)
  })

  test('maintenance: calories within ±100 of TDEE', () => {
    const t = calculateTargets('maintenance', tdee, weight)
    expect(Math.abs(t.calories - tdee)).toBeLessThanOrEqual(100)
  })

  test('athlete_cut: higher protein than weight_loss, still a deficit', () => {
    const cut = calculateTargets('athlete_cut', tdee, weight)
    const loss = calculateTargets('weight_loss', tdee, weight)
    expect(cut.calories).toBeLessThan(tdee)
    expect(cut.protein_g / weight).toBeGreaterThanOrEqual(loss.protein_g / weight)
  })

  test('heart_healthy: sodium_mg target ≤ 2300mg', () => {
    const t = calculateTargets('heart_healthy', tdee, weight)
    expect(t.sodium_mg).toBeDefined()
    expect(t.sodium_mg).toBeLessThanOrEqual(2300)
  })

  test('diabetic: net_carbs_g is set', () => {
    const t = calculateTargets('diabetic', tdee, weight)
    expect(t.net_carbs_g).toBeDefined()
    expect(t.net_carbs_g).toBeGreaterThan(0)
  })

  test('custom: returns passed custom_targets unchanged', () => {
    const custom = { calories: 1800, protein_g: 120 }
    const t = calculateTargets('custom', tdee, weight, custom)
    expect(t.calories).toBe(1800)
    expect(t.protein_g).toBe(120)
  })

  test('custom: throws when no custom_targets provided', () => {
    expect(() => calculateTargets('custom', tdee, weight)).toThrow()
  })

  test('all standard goal types produce non-null calories and macros', () => {
    const goalTypes: GoalType[] = [
      'muscle_gain', 'athlete_cut', 'weight_loss', 'maintenance',
      'recomposition', 'endurance', 'heart_healthy', 'longevity',
      'diabetic', 'recovery'
    ]
    goalTypes.forEach(g => {
      const t = calculateTargets(g, tdee, weight)
      expect(t.calories).toBeGreaterThan(0)
      expect(t.protein_g).toBeGreaterThan(0)
      expect(t.carbs_g).toBeGreaterThanOrEqual(0)
      expect(t.fat_g).toBeGreaterThan(0)
    })
  })

  test('throws on unknown goal type', () => {
    expect(() => calculateTargets('fasting' as GoalType, tdee, weight)).toThrow()
  })

  test('endurance: higher carb ratio than muscle_gain', () => {
    const endurance = calculateTargets('endurance', tdee, weight)
    const muscle = calculateTargets('muscle_gain', tdee, weight)
    expect(endurance.carbs_g / endurance.calories).toBeGreaterThan(muscle.carbs_g / muscle.calories)
  })

  test('minimum calories not below 1200 for weight_loss at low TDEE', () => {
    const t = calculateTargets('weight_loss', 1400, 50)
    expect(t.calories).toBeGreaterThanOrEqual(1200)
  })
})
