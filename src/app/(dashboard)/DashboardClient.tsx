'use client'

import Link from 'next/link'
import { Plus, UtensilsCrossed, Info } from 'lucide-react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import CalorieRings from './components/CalorieRings'
import DeficitBar from './components/DeficitBar'
import MealTimeline from './components/MealTimeline'
import MealSuggestions from './components/MealSuggestions'
import GoalDropdown from './components/GoalDropdown'
import DateRangeSelector, { type DateRange } from './components/DateRangeSelector'
import NutrientBar from '@/components/shared/NutrientBar'
import DayAnalysis from './components/DayAnalysis'
import MacroBreakdownDialog from './components/MacroBreakdownDialog'
import { rankMacrosByGoal } from '@/lib/nutrition/priority'
import type { Meal } from '@/hooks/useMeals'
import type { GoalType } from '@/lib/utils/constants'
import type { GoalProfile } from './components/GoalSwitcher'
import { createSequentialFetcher } from '@/lib/utils/sequential-fetch'

interface Snapshot {
  total_calories: number | null; total_protein_g: number | null; total_carbs_g: number | null
  total_fat_g: number | null; total_fiber_g: number | null; total_water_ml: number | null
}

interface Goal {
  goal_type: string; calories_target: number | null; protein_g: number | null
  carbs_g: number | null; fat_g: number | null; fiber_g: number | null
  water_ml: number | null; rationale: string | null
}

interface Props {
  snapshot: Snapshot | null
  goal: Goal | null
  meals: Meal[]
  profile: GoalProfile | null
  initialDate?: string
}

function localToday(): string {
  return new Date().toLocaleDateString('en-CA')
}

function filterLatestRevisions(meals: Meal[]): Meal[] {
  const revisedIds = new Set(meals.filter(m => m.revision_of).map(m => m.revision_of!))
  return meals.filter(m => !revisedIds.has(m.id))
}

function aggregateFromMeals(meals: Meal[]) {
  return meals.reduce(
    (acc, meal) => {
      meal.meal_items.forEach(item => {
        acc.calories += item.calories ?? 0
        acc.protein += item.protein_g ?? 0
        acc.carbs += item.carbs_g ?? 0
        acc.fat += item.fat_g ?? 0
      })
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

function aggregateQuality(meals: Meal[]) {
  return meals.reduce(
    (acc, meal) => {
      meal.meal_items.forEach(item => {
        acc.fiber_g         += item.fiber_g         ?? 0
        acc.sugar_g         += item.sugar_g         ?? 0
        acc.saturated_fat_g += item.saturated_fat_g ?? 0
        acc.sodium_mg       += item.sodium_mg       ?? 0
      })
      return acc
    },
    { fiber_g: 0, sugar_g: 0, saturated_fat_g: 0, sodium_mg: 0 }
  )
}

export default function DashboardClient({ snapshot, goal: initialGoal, meals: serverMeals, profile, initialDate }: Props) {
  const today = localToday()
  const router = useRouter()
  const startDate = initialDate ?? today
  const [goal, setGoal] = useState(initialGoal)
  const [dateRange, setDateRange] = useState<DateRange>({ start: startDate, end: startDate, days: 1 })
  const [clientMeals, setClientMeals] = useState<Meal[] | null>(null)
  const [fetchingMeals, setFetchingMeals] = useState(false)
  const [goalSwitching, setGoalSwitching] = useState(false)
  const [breakdownMacro, setBreakdownMacro] = useState<'calories' | 'protein' | 'carbs' | 'fat' | null>(null)
  const sequentialFetch = useRef(createSequentialFetcher())
  const fetchGen = useRef(0)

  const isToday = dateRange.start === today && dateRange.end === today

  const fetchMeals = useCallback(async (range: DateRange) => {
    const gen = ++fetchGen.current
    setFetchingMeals(true)
    setClientMeals(null)
    let aborted = false
    try {
      const res = await sequentialFetch.current(`/api/meals?startDate=${range.start}&endDate=${range.end}`)
      // Discard if a newer request has already been issued
      if (gen !== fetchGen.current) return
      const json = await res.json()
      if (gen !== fetchGen.current) return
      setClientMeals(json.data ?? [])
    } catch (err) {
      if ((err as Error).name === 'AbortError') { aborted = true; return }
      // keep previous data on real errors
    } finally {
      if (!aborted && gen === fetchGen.current) setFetchingMeals(false)
    }
  }, [])

  // If returning from a meal edit on a past date, fetch meals for that date
  useEffect(() => {
    if (initialDate && initialDate !== today) {
      fetchMeals({ start: initialDate, end: initialDate, days: 1 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRangeChange = (range: DateRange) => {
    setDateRange(range)
    if (range.start === today && range.end === today) {
      ++fetchGen.current
      setClientMeals(null)
      setFetchingMeals(false)
      router.replace('/dashboard', { scroll: false })
    } else {
      fetchMeals(range)
      const param = range.days === 1
        ? `/dashboard?date=${range.start}`
        : `/dashboard?date=${range.start}&endDate=${range.end}`
      router.replace(param, { scroll: false })
    }
  }

  const handleDelete = async (id: string) => {
    // Optimistic update
    const base = clientMeals ?? serverMeals
    setClientMeals(base.filter(m => m.id !== id))
    await fetch(`/api/meals/${id}`, { method: 'DELETE' })
  }

  const rawMeals = clientMeals ?? serverMeals
  const meals = filterLatestRevisions(rawMeals)
  const agg = aggregateFromMeals(meals)
  const quality = aggregateQuality(meals)

  const g = goal ?? {
    goal_type: 'maintenance', calories_target: 2000, protein_g: 150,
    carbs_g: 200, fat_g: 65, fiber_g: 30, water_ml: 2500, rationale: null,
  }
  const days = dateRange.days

  const scaledGoal = {
    calories: (g.calories_target ?? 2000) * days,
    protein: (g.protein_g ?? 150) * days,
    carbs: (g.carbs_g ?? 200) * days,
    fat: (g.fat_g ?? 65) * days,
  }

  const remaining = {
    calories: Math.max(scaledGoal.calories - agg.calories, 0),
    protein: Math.max(scaledGoal.protein - agg.protein, 0),
    carbs: Math.max(scaledGoal.carbs - agg.carbs, 0),
    fat: Math.max(scaledGoal.fat - agg.fat, 0),
  }

  return (
    <div className="px-4 py-6 relative">

      {/* Goal-switching overlay */}
      {goalSwitching && (
        <div className="absolute inset-0 z-50 bg-background/80 rounded-xl flex items-center justify-center">
          <span className="w-8 h-8 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Goal + date — full width */}
      <div className="flex flex-col gap-3 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 md:flex-row md:items-start md:justify-between">
        {profile ? (
          <GoalDropdown
            initialGoalType={(goal?.goal_type ?? 'maintenance') as GoalType}
            profile={profile}
            onLoadingChange={setGoalSwitching}
            onGoalChange={(goalType, targets) =>
              setGoal(prev => ({
                ...prev!,
                goal_type: goalType,
                calories_target: targets.calories,
                protein_g: targets.protein_g,
                carbs_g: targets.carbs_g,
                fat_g: targets.fat_g,
                fiber_g: targets.fiber_g,
                water_ml: targets.water_ml,
              }))
            }
          />
        ) : (
          <span className="font-semibold text-base">{g.goal_type.replace(/_/g, ' ')}</span>
        )}
        <DateRangeSelector onChange={handleRangeChange} initialDate={startDate !== today ? startDate : undefined} />
      </div>

      {/* 2-column section: rings+deficit | remaining */}
      <div className="space-y-6 md:grid md:grid-cols-[7fr_3.5fr] md:gap-10 md:items-stretch md:space-y-0">

        {/* Col 1: rings + deficit */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative bg-card rounded-xl shadow-[0_0_2px_0_rgba(0,0,0,0.1)] p-4 space-y-4 flex flex-col">
          {fetchingMeals && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl z-10">
              <span className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div className="flex justify-end">
            <DayAnalysis
              key={`${dateRange.start}-${dateRange.end}`}
              consumed={{ calories: agg.calories, protein: agg.protein, carbs: agg.carbs, fat: agg.fat }}
              targets={{ calories: scaledGoal.calories, protein: scaledGoal.protein, carbs: scaledGoal.carbs, fat: scaledGoal.fat }}
              goalType={g.goal_type}
              days={days}
              isCurrentPeriod={dateRange.start <= today && dateRange.end >= today}
              quality={quality}
            />
          </div>
          <CalorieRings
            calories={{ current: agg.calories, target: scaledGoal.calories }}
            protein={{ current: agg.protein, target: scaledGoal.protein }}
            carbs={{ current: agg.carbs, target: scaledGoal.carbs }}
          />
          <div className="mt-auto">
            <DeficitBar calories={agg.calories} target={scaledGoal.calories} goalType={g.goal_type} />
          </div>
        </div>

        {/* Col 2: remaining today */}
        <div className="bg-card rounded-xl shadow-[0_0_2px_0_rgba(0,0,0,0.1)] p-4 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 pb-1">
            {days === 1 ? 'Remaining today' : `Remaining (${days} days)`}
          </h3>
          {(() => {
            const nutrientConfig = {
              calories: { label: 'Calories', current: agg.calories,  target: scaledGoal.calories, unit: ' kcal',  remaining: remaining.calories, suffix: 'kcal' },
              protein:  { label: 'Protein',  current: agg.protein,   target: scaledGoal.protein,  unit: undefined, remaining: remaining.protein,  suffix: 'g protein' },
              carbs:    { label: 'Carbs',    current: agg.carbs,     target: scaledGoal.carbs,    unit: undefined, remaining: remaining.carbs,    suffix: 'g carbs' },
              fat:      { label: 'Fat',      current: agg.fat,       target: scaledGoal.fat,      unit: undefined, remaining: remaining.fat,      suffix: 'g fat' },
            }
            const ranked = rankMacrosByGoal(g.goal_type)
            return (
              <>
                <div className="flex-1 flex flex-col gap-3 justify-evenly">
                  {ranked.map(n => {
                    const c = nutrientConfig[n]
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setBreakdownMacro(n)}
                        className="text-left w-full hover:opacity-70 transition-opacity relative group"
                      >
                        <NutrientBar label={c.label} current={c.current} target={c.target} unit={c.unit} />
                        <Info className="absolute top-0 right-0 w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
                      </button>
                    )
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-3 pt-1">
                  {ranked.map(n => {
                    const c = nutrientConfig[n]
                    return <span key={n}>~{Math.round(c.remaining)} {c.suffix}</span>
                  })}
                </div>
              </>
            )
          })()}
        </div>

      </div>

      {/* Suggested next meal — today only */}
      {isToday && (
        <div className="mt-6">
          <MealSuggestions
            key={g.goal_type}
            consumed={{ calories: agg.calories, protein: agg.protein, carbs: agg.carbs, fat: agg.fat }}
            targets={{ calories: scaledGoal.calories, protein: scaledGoal.protein, carbs: scaledGoal.carbs, fat: scaledGoal.fat }}
            goalType={g.goal_type}
          />
        </div>
      )}

      {/* Meal list — 3 columns on desktop */}
      <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            {days === 1 && isToday ? "Today's meals" : days === 1 ? 'Meals' : `Meals (${days} days)`}
          </h2>
          <Link
            href="/meal/new"
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/80 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </div>
        <MealTimeline
          meals={meals}
          showDates={!isToday || dateRange.days > 1}
          onDelete={handleDelete}
          multiColumn
        />
      </div>

      <MacroBreakdownDialog
        macro={breakdownMacro}
        meals={meals}
        target={breakdownMacro ? scaledGoal[breakdownMacro] : 0}
        onClose={() => setBreakdownMacro(null)}
      />
    </div>
  )
}
