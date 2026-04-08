'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Sparkles, Sunrise, Sandwich, Moon, Cookie, RotateCcw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n'

interface Suggestion {
  name: string
  description: string
  meal_type: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

interface Props {
  consumed: { calories: number; protein: number; carbs: number; fat: number }
  targets: { calories: number; protein: number; carbs: number; fat: number }
  goalType: string
}

const MEAL_ICONS: Record<string, LucideIcon> = {
  breakfast: Sunrise,
  lunch: Sandwich,
  dinner: Moon,
  snack: Cookie,
}

const LOCATION_CACHE_KEY = 'uptake_location_cache'
const LOCATION_CACHE_TTL = 86400000 // 24 hours

interface LocationCache {
  location: string | null
  timestamp: number
}

async function getLocation(): Promise<string | undefined> {
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY)
    if (raw) {
      const cached: LocationCache = JSON.parse(raw)
      if (Date.now() - cached.timestamp < LOCATION_CACHE_TTL) {
        return cached.location ?? undefined
      }
    }
  } catch { /* ignore */ }

  if (!navigator.geolocation) return undefined

  try {
    const perm = await navigator.permissions.query({ name: 'geolocation' })
    if (perm.state === 'denied') return undefined
  } catch { /* permissions API not supported */ }

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'uptake-app' } }
          )
          const data = await res.json()
          const city = data.address?.city ?? data.address?.town ?? data.address?.village ?? data.address?.state
          const country = data.address?.country
          const location = city && country ? `${city}, ${country}` : (country ?? null)
          try { localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({ location, timestamp: Date.now() })) } catch { /* ignore */ }
          resolve(location ?? undefined)
        } catch {
          resolve(undefined)
        }
      },
      () => {
        try { localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({ location: null, timestamp: Date.now() })) } catch { /* ignore */ }
        resolve(undefined)
      },
      { timeout: 5000 }
    )
  })
}

function SuggestionCard({ s, t }: { s: Suggestion; t: ReturnType<typeof useLanguage>['t'] }) {
  const Icon = MEAL_ICONS[s.meal_type] ?? Cookie
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <span className="font-semibold text-sm truncate">{s.name}</span>
          </div>
          <span className="text-sm font-semibold tabular-nums flex-shrink-0">{s.calories} {t.unit_kcal}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-2">{s.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span><span className="font-medium text-foreground">{s.protein_g}g</span> {t.protein}</span>
            <span><span className="font-medium text-foreground">{s.carbs_g}g</span> {t.carbs}</span>
            <span><span className="font-medium text-foreground">{s.fat_g}g</span> {t.fat}</span>
          </div>
          <Link
            href={`/meal/new?description=${encodeURIComponent(s.description)}`}
            className="text-xs font-medium text-accent hover:underline flex-shrink-0 ms-3"
          >
            {t.log_this}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <div className="h-32 bg-muted/50 rounded-xl flex items-center justify-center">
      <span className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function MealSuggestions({ consumed, targets, goalType }: Props) {
  const { t, lang } = useLanguage()
  const rtl = lang === 'he'
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    setError(false)
    setActiveIndex(0)
    const location = await getLocation()
    try {
      const res = await fetch('/api/ai/suggest-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ consumed, targets, goalType, hourOfDay: new Date().getHours(), location, lang, nonce: Math.random() }),
      })
      const data = await res.json()
      if (data.suggestions?.length) setSuggestions(data.suggestions.slice(0, 3))
      else setError(true)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [consumed, targets, goalType, lang])

  useEffect(() => { fetchSuggestions() }, [fetchSuggestions])

  const count = loading ? 3 : suggestions.length
  const goTo = (i: number) => setActiveIndex(Math.max(0, Math.min(count - 1, i)))

  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX)
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const diff = touchStartX - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) goTo(activeIndex + (diff > 0 ? (rtl ? -1 : 1) : (rtl ? 1 : -1)))
    setTouchStartX(null)
  }

  // In RTL flex the DOM order is visually reversed: first child → rightmost.
  // ChevronLeft btn is DOM-first → visual right in RTL. Swap icons so arrows point the right way.
  const PrevIcon = rtl ? ChevronRight : ChevronLeft
  const NextIcon = rtl ? ChevronLeft : ChevronRight

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '280ms', animationFillMode: 'both' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          {t.suggested_meal}
        </h2>
        <div className="flex items-center gap-1">
          {!loading && (
            <button
              onClick={fetchSuggestions}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title={t.refresh_suggestions}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {/* Carousel controls — hidden on desktop (grid shown instead) */}
          {!loading && !error && (
            <div className="flex items-center gap-1 md:hidden">
              <button
                onClick={() => goTo(rtl ? activeIndex + 1 : activeIndex - 1)}
                disabled={rtl ? activeIndex >= count - 1 : activeIndex === 0}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <PrevIcon className="w-4 h-4" />
              </button>
              <div className="flex gap-1.5 px-1">
                {Array.from({ length: count }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeIndex ? 'bg-foreground' : 'bg-muted-foreground/30'}`}
                  />
                ))}
              </div>
              <button
                onClick={() => goTo(rtl ? activeIndex - 1 : activeIndex + 1)}
                disabled={rtl ? activeIndex === 0 : activeIndex >= count - 1}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <NextIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: carousel */}
      <div className="md:hidden overflow-hidden">
        {loading ? (
          <SkeletonCard />
        ) : error ? (
          <div className="h-32 bg-muted/50 rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
            <span>{t.suggestions_error}</span>
            <button onClick={fetchSuggestions} className="text-xs underline hover:text-foreground transition-colors">{t.try_again}</button>
          </div>
        ) : (
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${rtl ? '' : '-'}${activeIndex * 100}%)` }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {suggestions.map((s, i) => (
              <div key={i} className="flex-shrink-0 w-full">
                <SuggestionCard s={s} t={t} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: 3-column grid */}
      <div className="hidden md:block">
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        ) : error ? (
          <div className="h-32 bg-muted/50 rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
            <span>{t.suggestions_error}</span>
            <button onClick={fetchSuggestions} className="text-xs underline hover:text-foreground transition-colors">{t.try_again}</button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {suggestions.map((s, i) => (
              <SuggestionCard key={i} s={s} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
