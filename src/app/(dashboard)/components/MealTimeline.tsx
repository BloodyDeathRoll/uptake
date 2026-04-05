'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Sunrise, Sandwich, Moon, Cookie, Utensils, Pencil, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatTime, formatDate } from '@/lib/utils/format'
import { MEAL_TYPE_LABELS } from '@/lib/utils/constants'
import type { Meal } from '@/hooks/useMeals'

interface Props {
  meals: Meal[]
  showDates?: boolean
  onDelete?: (id: string) => void
  multiColumn?: boolean
}

function totalCalories(meal: Meal) {
  return meal.meal_items.reduce((sum, item) => sum + (item.calories ?? 0), 0)
}

const MEAL_ICON: Record<string, LucideIcon> = {
  breakfast: Sunrise,
  lunch: Sandwich,
  dinner: Moon,
  snack: Cookie,
}

function groupByDate(meals: Meal[]): { dateKey: string; label: string; meals: Meal[] }[] {
  const groups = new Map<string, Meal[]>()
  for (const meal of meals) {
    // Use local date from the logged_at timestamp
    const key = new Date(meal.logged_at).toLocaleDateString('en-CA')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(meal)
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a)) // most recent first
    .map(([key, meals]) => ({
      dateKey: key,
      label: formatDate(key),
      meals,
    }))
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const handle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete()
  }

  return (
    <button
      onClick={handle}
      className="p-1.5 rounded-lg transition-colors flex-shrink-0 text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}

function MealRow({ meal, onDelete }: { meal: Meal; onDelete?: (id: string) => void }) {
  const router = useRouter()
  const Icon = MEAL_ICON[meal.meal_type] ?? Utensils
  const [navigating, setNavigating] = useState(false)

  const mealDate = new Date(meal.logged_at).toLocaleDateString('en-CA')

  const handleClick = () => {
    setNavigating(true)
    router.push(`/meal/${meal.id}?returnDate=${mealDate}`)
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="relative flex items-center gap-3 p-3 rounded-xl bg-card hover:shadow-sm transition-all duration-200 cursor-pointer flex-1 min-w-0"
        onClick={handleClick}
      >
        {navigating && (
          <div className="absolute inset-0 rounded-xl bg-background/60 flex items-center justify-center z-10">
            <span className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {meal.image_url ? (
          <img src={meal.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {MEAL_TYPE_LABELS[meal.meal_type as keyof typeof MEAL_TYPE_LABELS] ?? meal.meal_type}
            </span>
            <span className="text-xs text-muted-foreground">{formatTime(meal.logged_at)}</span>
          </div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {meal.human_description ?? meal.meal_items.map(i => i.ingredient_name).join(', ')}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="text-right mr-1">
            <div className="text-sm font-semibold tabular-nums">{Math.round(totalCalories(meal))}</div>
            <div className="text-[10px] text-muted-foreground">kcal</div>
          </div>
          <Link
            href={`/meal/new?revisionOf=${meal.id}&returnDate=${mealDate}`}
            onClick={e => e.stopPropagation()}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {onDelete && (
        <DeleteButton onDelete={() => onDelete(meal.id)} />
      )}
    </div>
  )
}

export default function MealTimeline({ meals, showDates = false, onDelete, multiColumn = false }: Props) {
  const gridClass = multiColumn
    ? 'grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3'
    : 'space-y-2'

  if (meals.length === 0) {
    return (
      <div className="animate-in fade-in duration-500 text-center py-10 text-muted-foreground text-sm">
        Nothing logged yet. Tap + to add your first meal.
      </div>
    )
  }

  if (!showDates) {
    return (
      <div className={gridClass}>
        {meals.map((meal, i) => (
          <div
            key={meal.id}
            className="animate-in fade-in slide-in-from-bottom-3"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
          >
            <MealRow meal={meal} onDelete={onDelete} />
          </div>
        ))}
      </div>
    )
  }

  const groups = groupByDate(meals)

  return (
    <div className="space-y-4">
      {groups.map(({ dateKey, label, meals: groupMeals }) => (
        <div key={dateKey}>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{label}</div>
          <div className={gridClass}>
            {groupMeals.map(meal => (
              <MealRow key={meal.id} meal={meal} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
