'use client'

import { useState, useEffect } from 'react'

// Module-level cache persists across re-mounts within the same session
const cache = new Map<string, Record<string, string>>()

export function useTranslatedNames(names: string[], lang: string): Record<string, string> {
  const latinNames = lang === 'he'
    ? [...new Set(names.filter(n => /[a-zA-Z]/.test(n)))]
    : []
  const cacheKey = [...latinNames].sort().join('|')

  const [map, setMap] = useState<Record<string, string>>(() => cache.get(cacheKey) ?? {})

  useEffect(() => {
    if (latinNames.length === 0) return
    if (cache.has(cacheKey)) {
      setMap(cache.get(cacheKey)!)
      return
    }

    fetch('/api/ai/translate-ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names: latinNames }),
    })
      .then(r => r.json())
      .then(d => {
        const translations: Record<string, string> = d.translations ?? {}
        cache.set(cacheKey, translations)
        setMap(translations)
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  return map
}
