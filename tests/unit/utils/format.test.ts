import {
  formatCalories,
  formatGrams,
  formatMg,
  formatMl,
  formatPercent,
  cmToFtIn,
  ftInToCm,
  kgToLbs,
  lbsToKg,
} from '@/lib/utils/format'

describe('formatCalories', () => {
  test('formats whole number', () => expect(formatCalories(2000)).toBe('2,000 kcal'))
  test('rounds decimal', () => expect(formatCalories(1854.7)).toBe('1,855 kcal'))
  test('returns dash for null', () => expect(formatCalories(null)).toBe('—'))
  test('returns dash for undefined', () => expect(formatCalories(undefined)).toBe('—'))
})

describe('formatGrams', () => {
  test('formats with 1 decimal by default', () => expect(formatGrams(62)).toBe('62.0g'))
  test('formats with 0 decimals', () => expect(formatGrams(62.4, 0)).toBe('62g'))
  test('returns dash for null', () => expect(formatGrams(null)).toBe('—'))
})

describe('formatMg', () => {
  test('rounds and appends mg', () => expect(formatMg(2300)).toBe('2300mg'))
  test('rounds decimal', () => expect(formatMg(1234.6)).toBe('1235mg'))
  test('returns dash for null', () => expect(formatMg(null)).toBe('—'))
})

describe('formatMl', () => {
  test('formats ml under 1000', () => expect(formatMl(500)).toBe('500ml'))
  test('converts to liters at 1000+', () => expect(formatMl(1500)).toBe('1.5L'))
  test('returns dash for null', () => expect(formatMl(null)).toBe('—'))
  test('formats exactly 1000ml as 1.0L', () => expect(formatMl(1000)).toBe('1.0L'))
})

describe('formatPercent', () => {
  test('calculates percentage', () => expect(formatPercent(1, 4)).toBe('25%'))
  test('handles zero total', () => expect(formatPercent(5, 0)).toBe('0%'))
  test('rounds to nearest integer', () => expect(formatPercent(1, 3)).toBe('33%'))
})

describe('cmToFtIn', () => {
  test('converts 178cm to 5ft 10in', () => {
    const { feet, inches } = cmToFtIn(178)
    expect(feet).toBe(5)
    expect(inches).toBe(10)
  })
})

describe('ftInToCm', () => {
  test('converts 5ft 10in to ~178cm', () => {
    expect(ftInToCm(5, 10)).toBeCloseTo(178, 0)
  })
})

describe('kgToLbs', () => {
  test('converts 80kg to ~176.4lbs', () => {
    expect(kgToLbs(80)).toBeCloseTo(176.4, 0)
  })
})

describe('lbsToKg', () => {
  test('converts 176lbs to ~79.8kg', () => {
    expect(lbsToKg(176)).toBeCloseTo(79.8, 0)
  })
})
