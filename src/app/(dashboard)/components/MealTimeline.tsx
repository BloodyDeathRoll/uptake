'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Sunrise, Sandwich, Moon, Cookie, Utensils, Pencil, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatTime, formatDate } from '@/lib/utils/format'
import { MEAL_TYPE_LABELS } from '@/lib/utils/constants'
import { useLanguage, type Translations } from '@/lib/i18n'
import { useTranslatedNames } from '@/hooks/useTranslatedNames'
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

function groupByDate(meals: Meal[], t: { date_today: string; date_yesterday: string }): { dateKey: string; label: string; meals: Meal[] }[] {
  const groups = new Map<string, Meal[]>()
  for (const meal of meals) {
    // Use UTC date from the stored timestamp to match the API's UTC-based date filtering
    const key = meal.logged_at.slice(0, 10)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(meal)
  }
  const todayKey = new Date().toLocaleDateString('en-CA')
  const d = new Date(); d.setDate(d.getDate() - 1)
  const yesterdayKey = d.toLocaleDateString('en-CA')
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a)) // most recent first
    .map(([key, meals]) => ({
      dateKey: key,
      label: key === todayKey ? t.date_today : key === yesterdayKey ? t.date_yesterday : formatDate(key),
      meals,
    }))
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)

  const handle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (deleting) return
    setDeleting(true)
    onDelete()
  }

  return (
    <button
      onClick={handle}
      disabled={deleting}
      className="p-1.5 rounded-lg transition-colors flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
    >
      {deleting
        ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin block" />
        : <Trash2 className="w-3.5 h-3.5" />}
    </button>
  )
}

function MealRow({ meal, onDelete, translatedNames }: { meal: Meal; onDelete?: (id: string) => void; translatedNames?: Record<string, string> }) {
  const router = useRouter()
  const { t } = useLanguage()
  const mealLabel = (type: string) => (t[('meal_' + type) as keyof Translations] as string) ?? MEAL_TYPE_LABELS[type as keyof typeof MEAL_TYPE_LABELS] ?? type
  const Icon = MEAL_ICON[meal.meal_type] ?? Utensils
  const [navigating, setNavigating] = useState(false)

  const mealDate = new Date(meal.logged_at).toLocaleDateString('en-CA')

  const handleClick = () => {
    setNavigating(true)
    router.push(`/meal/${meal.id}?returnDate=${mealDate}`)
  }

  return (
    <div
      className="relative flex items-center gap-3 p-3 rounded-xl bg-card hover:shadow-sm transition-all duration-200 cursor-pointer"
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
        <div className="text-sm font-medium truncate">
          {meal.human_description ?? meal.meal_items.map(i => (translatedNames?.[i.ingredient_name] ?? i.ingredient_name)).join(', ')}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-muted-foreground">{mealLabel(meal.meal_type)}</span>
          <span className="text-xs text-muted-foreground/50">·</span>
          <span className="text-xs text-muted-foreground">{formatTime(meal.logged_at)}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <div className="text-right mr-1">
          <div className="text-sm font-semibold tabular-nums">{Math.round(totalCalories(meal))}</div>
          <div className="text-[10px] text-muted-foreground">{t.unit_kcal}</div>
        </div>
        <Link
          href={`/meal/new?revisionOf=${meal.id}&returnDate=${mealDate}`}
          onClick={e => e.stopPropagation()}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Link>
        {onDelete && (
          <div className="ms-2 ps-2 border-s border-border flex-shrink-0">
            <DeleteButton onDelete={() => onDelete(meal.id)} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function MealTimeline({ meals, showDates = false, onDelete, multiColumn = false }: Props) {
  const { t, lang } = useLanguage()
  const allNames = meals.flatMap(m => m.meal_items.map(i => i.ingredient_name))
  const translatedNames = useTranslatedNames(allNames, lang)
  const gridClass = multiColumn
    ? 'grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3'
    : 'space-y-2'

  if (meals.length === 0) {
    return (
      <div className="animate-in fade-in duration-500 text-center py-10 text-muted-foreground text-sm">
        {t.nothing_logged}
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
            <MealRow meal={meal} onDelete={onDelete} translatedNames={translatedNames} />
          </div>
        ))}
      </div>
    )
  }

  const groups = groupByDate(meals, t)

  return (
    <div className="space-y-4">
      {groups.map(({ dateKey, label, meals: groupMeals }) => (
        <div key={dateKey}>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{label}</div>
          <div className={gridClass}>
            {groupMeals.map(meal => (
              <MealRow key={meal.id} meal={meal} onDelete={onDelete} translatedNames={translatedNames} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
