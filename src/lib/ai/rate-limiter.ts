import { createAdminClient } from '@/lib/supabase/server'
import { GROQ_RPM_LIMIT, GROQ_RPD_LIMIT, GEMINI_RPM_LIMIT, GEMINI_RPD_LIMIT } from '@/lib/utils/constants'
import type { LLMResponse } from './provider'
import { RateLimitExhaustedError } from './provider'

const PROVIDER_LIMITS: Record<string, { rpm: number; rpd: number }> = {
  groq: { rpm: GROQ_RPM_LIMIT, rpd: GROQ_RPD_LIMIT },
  gemini: { rpm: GEMINI_RPM_LIMIT, rpd: GEMINI_RPD_LIMIT },
}

async function getCounter(provider: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('rate_limit_counters')
    .select('*')
    .eq('provider', provider)
    .single()
  return data
}

async function incrementCounter(provider: string) {
  const supabase = createAdminClient()
  const now = new Date()
  const counter = await getCounter(provider)

  if (!counter) return

  const lastRpmReset = new Date(counter.last_rpm_reset)
  const lastRpdReset = new Date(counter.last_rpd_reset)

  const rpmExpired = now.getTime() - lastRpmReset.getTime() > 60_000
  const rpdExpired =
    now.toISOString().slice(0, 10) !== lastRpdReset.toISOString().slice(0, 10)

  await supabase
    .from('rate_limit_counters')
    .update({
      rpm: rpmExpired ? 1 : counter.rpm + 1,
      rpd: rpdExpired ? 1 : counter.rpd + 1,
      last_rpm_reset: rpmExpired ? now.toISOString() : counter.last_rpm_reset,
      last_rpd_reset: rpdExpired ? now.toISOString() : counter.last_rpd_reset,
    })
    .eq('provider', provider)
}

async function isWithinLimits(provider: string): Promise<{ rpm: boolean; rpd: boolean }> {
  const counter = await getCounter(provider)
  const limits = PROVIDER_LIMITS[provider]

  if (!counter || !limits) return { rpm: true, rpd: true }

  const now = new Date()
  const lastRpmReset = new Date(counter.last_rpm_reset)
  const lastRpdReset = new Date(counter.last_rpd_reset)

  const rpmExpired = now.getTime() - lastRpmReset.getTime() > 60_000
  const rpdExpired =
    now.toISOString().slice(0, 10) !== lastRpdReset.toISOString().slice(0, 10)

  const currentRpm = rpmExpired ? 0 : counter.rpm
  const currentRpd = rpdExpired ? 0 : counter.rpd

  return {
    rpm: currentRpm < limits.rpm,
    rpd: currentRpd < limits.rpd,
  }
}

export async function execute<T extends LLMResponse>(
  provider: string,
  fn: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> {
  const limits = await isWithinLimits(provider)

  if (!limits.rpd) {
    if (fallback) return execute('fallback', fallback)
    throw new RateLimitExhaustedError(provider)
  }

  if (!limits.rpm) {
    // Wait for next minute window and retry once
    await new Promise(resolve => setTimeout(resolve, 60_000))
    const retryLimits = await isWithinLimits(provider)
    if (!retryLimits.rpm) {
      if (fallback) return execute('fallback', fallback)
      throw new RateLimitExhaustedError(provider)
    }
  }

  const result = await fn()
  await incrementCounter(provider)
  return result
}
