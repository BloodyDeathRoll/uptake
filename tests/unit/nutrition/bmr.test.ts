import { calculateBMR } from '@/lib/nutrition/bmr'

describe('calculateBMR', () => {
  // 10*80 + 6.25*180 - 5*30 + 5 = 1780
  test('male, standard values', () =>
    expect(calculateBMR({ weight: 80, height: 180, age: 30, sex: 'male' })).toBeCloseTo(1780, 0))

  // 10*65 + 6.25*165 - 5*28 - 161 = 1380.25
  test('female, standard values', () =>
    expect(calculateBMR({ weight: 65, height: 165, age: 28, sex: 'female' })).toBeCloseTo(1380, 0))

  test('sex=other uses male formula as default', () =>
    expect(calculateBMR({ weight: 70, height: 170, age: 25, sex: 'other' }))
      .toEqual(calculateBMR({ weight: 70, height: 170, age: 25, sex: 'male' })))

  test('sex=null uses male formula as default', () =>
    expect(calculateBMR({ weight: 70, height: 170, age: 25, sex: null }))
      .toEqual(calculateBMR({ weight: 70, height: 170, age: 25, sex: 'male' })))

  test('throws on negative weight', () =>
    expect(() => calculateBMR({ weight: -5, height: 170, age: 25, sex: 'male' })).toThrow())

  test('throws on zero weight', () =>
    expect(() => calculateBMR({ weight: 0, height: 170, age: 25, sex: 'male' })).toThrow())

  test('throws on age 0', () =>
    expect(() => calculateBMR({ weight: 70, height: 170, age: 0, sex: 'male' })).toThrow())

  test('throws on negative age', () =>
    expect(() => calculateBMR({ weight: 70, height: 170, age: -1, sex: 'male' })).toThrow())

  test('throws on zero height', () =>
    expect(() => calculateBMR({ weight: 70, height: 0, age: 25, sex: 'male' })).toThrow())

  test('male BMR formula: 10*80 + 6.25*178 - 5*35 + 5', () => {
    const result = calculateBMR({ weight: 80, height: 178, age: 35, sex: 'male' })
    const expected = 10 * 80 + 6.25 * 178 - 5 * 35 + 5
    expect(result).toBeCloseTo(expected, 1)
  })

  test('female BMR formula: 10*60 + 6.25*160 - 5*25 - 161', () => {
    const result = calculateBMR({ weight: 60, height: 160, age: 25, sex: 'female' })
    const expected = 10 * 60 + 6.25 * 160 - 5 * 25 - 161
    expect(result).toBeCloseTo(expected, 1)
  })
})
