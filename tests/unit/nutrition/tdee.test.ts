import { calculateTDEE } from '@/lib/nutrition/tdee'
import type { ActivityLevel } from '@/lib/utils/constants'

describe('calculateTDEE', () => {
  const bmr = 1800

  test.each([
    ['sedentary',   2160],
    ['light',       2475],
    ['moderate',    2790],
    ['very_active', 3105],
    ['athlete',     3420],
  ] as [ActivityLevel, number][])('%s activity level', (level, expected) =>
    expect(calculateTDEE(bmr, level)).toBeCloseTo(expected, 0))

  test('throws on unknown activity level', () =>
    expect(() => calculateTDEE(bmr, 'couch_potato' as ActivityLevel)).toThrow())

  test('result is rounded to nearest integer', () => {
    const result = calculateTDEE(1700, 'light')
    expect(Number.isInteger(result)).toBe(true)
  })
})
