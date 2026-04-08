'use client'

import Link from 'next/link'
import { formatTime } from '@/lib/utils/format'
import ConfidenceBadge from '@/components/shared/ConfidenceBadge'
import { Badge } from '@/components/ui/badge'
import NavBackButton from '../components/NavBackButton'
import { useLanguage, type Translations } from '@/lib/i18n'
import { useTranslatedNames } from '@/hooks/useTranslatedNames'
import { translateUnit } from '@/lib/utils/translate-unit'

interface MealItem {
  id: string
  ingredient_name: string
  quantity: number
  unit: string
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  was_corrected: boolean | null
  confidence: string | null
  source: string
}

interface Meal {
  id: string
  meal_type: string
  human_description: string | null
  image_url: string | null
  logged_at: string
  revision_of: string | null
  meal_items: MealItem[]
}

interface Props {
  meal: Meal
  returnDate?: string
}

export default function MealDetailContent({ meal, returnDate }: Props) {
  const { t, lang } = useLanguage()

  const mealLabel = (type: string) =>
    (t[('meal_' + type) as keyof Translations] as string) ?? type

  const items = meal.meal_items ?? []
  const ingredientNames = items.map(i => i.ingredient_name)
  const translatedNames = useTranslatedNames(ingredientNames, lang)
  const totalCal = items.reduce((s, i) => s + (i.calories ?? 0), 0)
  const totalProtein = items.reduce((s, i) => s + (i.protein_g ?? 0), 0)
  const totalCarbs = items.reduce((s, i) => s + (i.carbs_g ?? 0), 0)
  const totalFat = items.reduce((s, i) => s + (i.fat_g ?? 0), 0)

  return (
    <div className="min-h-screen bg-background pb-20">
      <div dir="ltr" className="sticky top-0 bg-background/80 backdrop-blur-sm shadow-[0_0_2px_0_rgba(0,0,0,0.1)] px-4 h-14 flex items-center justify-between">
        <NavBackButton href={returnDate ? `/dashboard?date=${returnDate}` : '/dashboard'} />
        <span className="font-semibold capitalize">{mealLabel(meal.meal_type)}</span>
        <Link href={`/meal/new?revisionOf=${meal.id}${returnDate ? `&returnDate=${returnDate}` : ''}`} className="text-accent text-sm">{t.edit_btn}</Link>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <div className="text-sm text-muted-foreground">{formatTime(meal.logged_at)}</div>

        {meal.image_url && (
          <img src={meal.image_url} alt="Meal photo" className="w-full h-48 object-cover rounded-xl" />
        )}

        {meal.human_description && (
          <p className="text-sm text-muted-foreground">{meal.human_description}</p>
        )}

        {/* Summary */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: t.calories, value: Math.round(totalCal), unit: t.unit_kcal },
            { label: t.protein, value: Math.round(totalProtein), unit: translateUnit('g', lang) },
            { label: t.carbs, value: Math.round(totalCarbs), unit: translateUnit('g', lang) },
            { label: t.fat, value: Math.round(totalFat), unit: translateUnit('g', lang) },
          ].map(({ label, value, unit }) => (
            <div key={label} className="p-3 rounded-xl bg-card shadow-[0_0_2px_0_rgba(0,0,0,0.1)]">
              <div className="text-lg font-bold">{value}<span className="text-xs font-normal text-muted-foreground">{unit}</span></div>
              <div className="text-[10px] text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {/* Items */}
        <div className="space-y-2">
          <h2 className="font-semibold text-sm">{t.ingredients_heading}</h2>
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-[0_0_2px_0_rgba(0,0,0,0.1)]">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{translatedNames[item.ingredient_name] ?? item.ingredient_name}</span>
                  <ConfidenceBadge confidence={item.confidence as 'high' | 'medium' | 'low' | null} />
                  {item.was_corrected && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500/30 text-blue-500">{t.edited_badge}</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{item.quantity} {translateUnit(item.unit, lang)}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{Math.round(item.calories ?? 0)} {t.unit_kcal}</div>
                <div className="text-xs text-muted-foreground">{Math.round(item.protein_g ?? 0)}g {t.protein.toLowerCase()}</div>
              </div>
            </div>
          ))}
        </div>

        {meal.revision_of && (
          <p className="text-xs text-muted-foreground text-center">
            {t.revised_version}{' '}
            <Link href={`/meal/${meal.revision_of}`} className="text-accent underline">{t.view_original}</Link>
          </p>
        )}
      </div>
    </div>
  )
}
