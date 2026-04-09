/**
 * Tests for POST /api/ai/calculate-goals
 *
 * Covers the three failure modes that broke the onboarding funnel:
 *   1. Unauthenticated request → 401 with message (not a silent blank screen)
 *   2. Missing / invalid body fields → 400 with message
 *   3. LLM failure → still returns valid targets (graceful fallback)
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/ai/calculate-goals/route'

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/ai/groq', () => ({
  GroqProvider: jest.fn().mockImplementation(() => ({
    parseText: jest.fn().mockResolvedValue({ content: 'Eat more vegetables.' }),
  })),
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require('@/lib/supabase/server')

function mockAuth(user: { id: string } | null) {
  createClient.mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
    },
  })
}

function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/ai/calculate-goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = {
  weightKg: 80,
  heightCm: 178,
  age: 30,
  sex: 'male',
  activityLevel: 'moderate',
  goalType: 'maintenance',
}

const ALL_GOAL_TYPES = [
  'muscle_gain', 'athlete_cut', 'weight_loss', 'maintenance',
  'recomposition', 'endurance', 'heart_healthy', 'longevity',
  'diabetic', 'recovery',
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/ai/calculate-goals', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth({ id: 'user-123' })
  })

  // ── Authentication ──────────────────────────────────────────────────────────

  describe('authentication', () => {
    test('returns 401 when user is not authenticated', async () => {
      mockAuth(null)
      const res = await POST(makeRequest(VALID_BODY))
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBeTruthy()
      expect(typeof json.error).toBe('string')
    })

    test('401 body contains an informative message', async () => {
      mockAuth(null)
      const res = await POST(makeRequest(VALID_BODY))
      const json = await res.json()
      // Must mention session or sign-in so the client can surface it
      expect(json.error.toLowerCase()).toMatch(/session|sign/)
    })

    test('returns 200 when user is authenticated', async () => {
      const res = await POST(makeRequest(VALID_BODY))
      expect(res.status).toBe(200)
    })
  })

  // ── Input validation ────────────────────────────────────────────────────────

  describe('input validation', () => {
    test('returns 400 when all fields are missing', async () => {
      const res = await POST(makeRequest({}))
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBeTruthy()
    })

    test('returns 400 when weightKg is missing', async () => {
      const { weightKg: _, ...body } = VALID_BODY
      const res = await POST(makeRequest(body))
      expect(res.status).toBe(400)
    })

    test('returns 400 when goalType is missing', async () => {
      const { goalType: _, ...body } = VALID_BODY
      const res = await POST(makeRequest(body))
      expect(res.status).toBe(400)
    })

    test('400 body contains an informative message', async () => {
      const res = await POST(makeRequest({ weightKg: 80 }))
      const json = await res.json()
      expect(typeof json.error).toBe('string')
      expect(json.error.length).toBeGreaterThan(10)
    })
  })

  // ── Successful calculation ──────────────────────────────────────────────────

  describe('successful calculation', () => {
    test('returns targets with all required macro fields', async () => {
      const res = await POST(makeRequest(VALID_BODY))
      const json = await res.json()
      expect(json.targets.calories).toBeGreaterThan(0)
      expect(json.targets.protein_g).toBeGreaterThan(0)
      expect(json.targets.carbs_g).toBeGreaterThanOrEqual(0)
      expect(json.targets.fat_g).toBeGreaterThan(0)
      expect(json.targets.fiber_g).toBeGreaterThan(0)
      expect(json.targets.water_ml).toBeGreaterThan(0)
    })

    test('returns bmr and tdee alongside targets', async () => {
      const res = await POST(makeRequest(VALID_BODY))
      const json = await res.json()
      expect(json.bmr).toBeGreaterThan(0)
      expect(json.tdee).toBeGreaterThan(json.bmr)
    })

    test('returns rationale string when LLM succeeds', async () => {
      const res = await POST(makeRequest(VALID_BODY))
      const json = await res.json()
      expect(typeof json.rationale).toBe('string')
      expect(json.rationale.length).toBeGreaterThan(0)
    })

    test.each(ALL_GOAL_TYPES)('%s returns valid targets', async goalType => {
      const res = await POST(makeRequest({ ...VALID_BODY, goalType }))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.targets.calories).toBeGreaterThan(0)
    })

    test('works without sex field (defaults to male formula)', async () => {
      const { sex: _, ...body } = VALID_BODY
      const res = await POST(makeRequest(body))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.targets.calories).toBeGreaterThan(0)
    })

    test('works for female users', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, sex: 'female', weightKg: 60, heightCm: 163 }))
      expect(res.status).toBe(200)
    })
  })

  // ── LLM failure fallback ────────────────────────────────────────────────────

  describe('LLM failure fallback', () => {
    test('still returns 200 with valid targets when Groq throws', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { GroqProvider } = require('@/lib/ai/groq')
      GroqProvider.mockImplementationOnce(() => ({
        parseText: jest.fn().mockRejectedValue(new Error('Groq API unavailable')),
      }))
      const res = await POST(makeRequest(VALID_BODY))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.targets.calories).toBeGreaterThan(0)
    })

    test('rationale is null when LLM fails', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { GroqProvider } = require('@/lib/ai/groq')
      GroqProvider.mockImplementationOnce(() => ({
        parseText: jest.fn().mockRejectedValue(new Error('timeout')),
      }))
      const res = await POST(makeRequest(VALID_BODY))
      const json = await res.json()
      expect(json.rationale).toBeNull()
    })
  })
})
