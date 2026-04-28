'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { CalendarDays, Sparkles, Sunrise, Sandwich, Moon, Cookie, RotateCcw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n'

interface DailyMeal {
  meal_type: string
  name: string
  description: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

interface DailyTotal {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

interface Props {
  targets: { calories: number; protein: number; carbs: number; fat: number }
  consumed: { calories: number; protein: number; carbs: number; fat: number }
  loggedTypes: string[]
  goalType: string
}

const MEAL_ICONS: Record<string, LucideIcon> = {
  breakfast: Sunrise,
  lunch: Sandwich,
  dinner: Moon,
  snack: Cookie,
}

type ViewState = 'idle' | 'loading' | 'ready' | 'error'

export default function DailyMenuSuggestion({ targets, consumed, loggedTypes, goalType }: Props) {
  const { t, lang } = useLanguage()
  const [state, setState] = useState<ViewState>('idle')
  const [meals, setMeals] = useState<DailyMeal[]>([])
  const [total, setTotal] = useState<DailyTotal | null>(null)

  const generate = useCallback(async () => {
    setState('loading')
    try {
      const res = await fetch('/api/ai/suggest-daily-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets, consumed, loggedTypes, goalType, lang }),
      })
      const data = await res.json()
      if (!res.ok) { setState('error'); return }

      setMeals(data.meals)
      setTotal(data.total)
      setState('ready')
    } catch {
      setState('error')
    }
  }, [targets, consumed, loggedTypes, goalType, lang])

  // ── Idle: prompt card ───────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '350ms', animationFillMode: 'both' }}>
        <button onClick={generate} className="w-full group text-start">
          <Card className="hover:border-accent/40 transition-colors cursor-pointer">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 transition-colors">
                <CalendarDays className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{t.daily_menu_title}</p>
                <p className="text-xs text-muted-foreground">{t.generate_daily_menu}</p>
              </div>
              <Sparkles className="w-4 h-4 text-muted-foreground/40 group-hover:text-accent/60 transition-colors flex-shrink-0" strokeWidth={1.5} />
            </CardContent>
          </Card>
        </button>
      </div>
    )
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            {t.daily_menu_title}
          </h2>
        </div>
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-20 bg-muted/50 rounded-xl flex items-center justify-center">
              {i === 1 && <span className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">{t.generating_menu}</p>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            {t.daily_menu_title}
          </h2>
        </div>
        <div className="h-24 bg-muted/50 rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
          <span>{t.menu_error}</span>
          <button onClick={generate} className="text-xs underline hover:text-foreground transition-colors">{t.try_again}</button>
        </div>
      </div>
    )
  }

  // ── Ready: full day plan ─────────────────────────────────────────────────────
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-base flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          {t.daily_menu_title}
        </h2>
        <button
          onClick={generate}
          className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title={t.refresh_menu}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {meals.map((meal, i) => {
          const Icon = MEAL_ICONS[meal.meal_type] ?? Cookie
          return (
            <Card key={i}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-semibold text-sm truncate">{meal.name}</span>
                      <span className="text-sm font-semibold tabular-nums flex-shrink-0">{meal.calories} {t.unit_kcal}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{meal.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span><span className="font-medium text-foreground">{meal.protein_g}g</span> {t.protein}</span>
                        <span><span className="font-medium text-foreground">{meal.carbs_g}g</span> {t.carbs}</span>
                        <span><span className="font-medium text-foreground">{meal.fat_g}g</span> {t.fat}</span>
                      </div>
                      <Link
                        href={`/meal/new?description=${encodeURIComponent(meal.description)}&mealType=${meal.meal_type}`}
                        className="text-xs font-medium text-accent hover:underline flex-shrink-0 ms-3"
                      >
                        {t.log_this}
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {total && (
          <div className="flex items-center justify-between px-1 pt-2 text-xs text-muted-foreground border-t border-border mt-1">
            <span className="font-semibold text-foreground">{t.day_total}</span>
            <div className="flex gap-3">
              <span><span className="font-medium text-foreground">{Math.round(total.calories)}</span> {t.unit_kcal}</span>
              <span><span className="font-medium text-foreground">{Math.round(total.protein_g)}g</span> {t.protein}</span>
              <span><span className="font-medium text-foreground">{Math.round(total.carbs_g)}g</span> {t.carbs}</span>
              <span><span className="font-medium text-foreground">{Math.round(total.fat_g)}g</span> {t.fat}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
