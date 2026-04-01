import { ORDERED_GOALS } from '@/app/(dashboard)/components/GoalSwitcher'
import type { GoalType } from '@/lib/utils/constants'

describe('GoalSwitcher ORDERED_GOALS', () => {
  test('contains exactly 10 goals', () => {
    expect(ORDERED_GOALS).toHaveLength(10)
  })

  test('does not include "custom"', () => {
    expect(ORDERED_GOALS).not.toContain('custom')
  })

  test('starts with muscle_gain', () => {
    expect(ORDERED_GOALS[0]).toBe('muscle_gain')
  })

  test('ends with recovery', () => {
    expect(ORDERED_GOALS[ORDERED_GOALS.length - 1]).toBe('recovery')
  })

  test('contains all expected goal types', () => {
    const expected: GoalType[] = [
      'muscle_gain', 'athlete_cut', 'weight_loss', 'maintenance',
      'recomposition', 'endurance', 'heart_healthy', 'longevity',
      'diabetic', 'recovery',
    ]
    expect(ORDERED_GOALS).toEqual(expected)
  })

  test('all entries are unique', () => {
    expect(new Set(ORDERED_GOALS).size).toBe(ORDERED_GOALS.length)
  })
})

describe('GoalSwitcher index cycling logic', () => {
  const len = ORDERED_GOALS.length

  test('next from last wraps to 0', () => {
    const next = (len - 1 + 1) % len
    expect(next).toBe(0)
    expect(ORDERED_GOALS[next]).toBe('muscle_gain')
  })

  test('prev from 0 wraps to last', () => {
    const prev = (0 - 1 + len) % len
    expect(prev).toBe(len - 1)
    expect(ORDERED_GOALS[prev]).toBe('recovery')
  })

  test('next advances index by 1', () => {
    const index = 3
    const next = (index + 1) % len
    expect(next).toBe(4)
    expect(ORDERED_GOALS[next]).toBe('recomposition')
  })

  test('prev decrements index by 1', () => {
    const index = 3
    const prev = (index - 1 + len) % len
    expect(prev).toBe(2)
    expect(ORDERED_GOALS[prev]).toBe('weight_loss')
  })

  test('startIndex defaults to 0 for unknown goal', () => {
    const unknownGoal = 'custom' as GoalType
    const startIndex = Math.max(ORDERED_GOALS.indexOf(unknownGoal), 0)
    expect(startIndex).toBe(0)
  })

  test('startIndex finds correct position for known goal', () => {
    const goal: GoalType = 'heart_healthy'
    const startIndex = Math.max(ORDERED_GOALS.indexOf(goal), 0)
    expect(startIndex).toBe(6)
    expect(ORDERED_GOALS[startIndex]).toBe('heart_healthy')
  })
})
