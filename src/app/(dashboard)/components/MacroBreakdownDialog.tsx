'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Meal } from '@/hooks/useMeals'
import { useLanguage, type Translations } from '@/lib/i18n'
import { useTranslatedNames } from '@/hooks/useTranslatedNames'
import { translateUnit } from '@/lib/utils/translate-unit'

type MacroKey = 'calories' | 'protein' | 'carbs' | 'fat'

const MACRO_FIELDS: Record<MacroKey, { field: 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'; unit: string; labelKey: keyof Translations }> = {
  calories: { field: 'calories',   unit: 'kcal', labelKey: 'calories' },
  protein:  { field: 'protein_g',  unit: 'g',    labelKey: 'protein' },
  carbs:    { field: 'carbs_g',    unit: 'g',    labelKey: 'carbs' },
  fat:      { field: 'fat_g',      unit: 'g',    labelKey: 'fat' },
}

function QualityBar({ label, value, total, color, description }: { label: string; value: number; total: number; color: string; description: string }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{Math.round(value)}g <span className="text-muted-foreground font-normal">· {description}</span></span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack']

function fmt(n: number, unit: string) {
  return `${Math.round(n)} ${unit}`
}

interface Props {
  macro: MacroKey | null
  meals: Meal[]
  target: number
  onClose: () => void
}

export default function MacroBreakdownDialog({ macro, meals, target, onClose }: Props) {
  const { t, lang } = useLanguage()
  const allNames = meals.flatMap(m => m.meal_items.map(i => i.ingredient_name))
  const translatedNames = useTranslatedNames(allNames, lang)
  if (!macro) return null
  const cfg = MACRO_FIELDS[macro]
  const label = t[cfg.labelKey] as string

  // Group meals by type, sorted by known order
  const grouped = meals
    .filter(m => m.meal_items.some(i => (i[cfg.field] ?? 0) > 0))
    .sort((a, b) => {
      const ai = MEAL_ORDER.indexOf(a.meal_type.toLowerCase())
      const bi = MEAL_ORDER.indexOf(b.meal_type.toLowerCase())
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })

  const total = meals.reduce((sum, m) => sum + m.meal_items.reduce((s, i) => s + (i[cfg.field] ?? 0), 0), 0)

  // Quality breakdown totals
  const quality = meals.reduce((acc, m) => {
    m.meal_items.forEach(i => {
      acc.fiber       += i.fiber_g          ?? 0
      acc.sugar       += i.sugar_g          ?? 0
      acc.saturated   += i.saturated_fat_g  ?? 0
      acc.sodium      += i.sodium_mg        ?? 0
    })
    return acc
  }, { fiber: 0, sugar: 0, saturated: 0, sodium: 0 })

  const mealTypeLabel = (type: string) =>
    (t[('meal_' + type.toLowerCase()) as keyof Translations] as string) || type

  return (
    <Dialog open={!!macro} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-none w-[min(92vw,32rem)] max-h-[82dvh] overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>{label} {t.breakdown_suffix}</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fmt(total, cfg.unit)} {t.consumed_label} · {fmt(target, cfg.unit)} {t.goal_word}
          </p>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {/* Quality breakdown panel */}
          {macro === 'carbs' && (quality.fiber > 0 || quality.sugar > 0) && (
            <div className="rounded-xl bg-muted/50 p-3 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t.quality_breakdown}</p>
              {quality.fiber > 0 && (
                <QualityBar label={t.fiber_complex} value={quality.fiber} total={total} color="#22c55e" description={t.fiber_desc} />
              )}
              {quality.sugar > 0 && (
                <QualityBar label={t.sugar_simple} value={quality.sugar} total={total} color="#f97316" description={t.sugar_desc} />
              )}
              {total > 0 && quality.fiber === 0 && quality.sugar === 0 && (
                <p className="text-xs text-muted-foreground">{t.no_fiber_sugar_data}</p>
              )}
            </div>
          )}

          {macro === 'fat' && (quality.saturated > 0 || total > 0) && (
            <div className="rounded-xl bg-muted/50 p-3 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t.quality_breakdown}</p>
              {quality.saturated > 0 && (
                <QualityBar label={t.saturated_label} value={quality.saturated} total={total} color="#f97316" description={t.saturated_desc} />
              )}
              {total > 0 && (
                <QualityBar
                  label={t.unsaturated_label}
                  value={Math.max(total - quality.saturated, 0)}
                  total={total}
                  color="#22c55e"
                  description={t.unsaturated_desc}
                />
              )}
            </div>
          )}

          {macro === 'calories' && quality.sodium > 0 && (
            <div className="rounded-xl bg-muted/50 p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.sodium_macro_label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.sodium_daily_limit}</p>
              </div>
              <div className="text-end">
                <span className={`text-sm font-semibold tabular-nums ${quality.sodium > 2300 ? 'text-red-500' : quality.sodium > 1500 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {Math.round(quality.sodium)} mg
                </span>
                <p className="text-xs text-muted-foreground">{Math.round((quality.sodium / 2300) * 100)}{t.pct_of_limit}</p>
              </div>
            </div>
          )}

          {macro === 'protein' && quality.fiber > 0 && (
            <div className="rounded-xl bg-muted/50 p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.fiber_from_protein}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.fiber_goal_note}</p>
              </div>
              <span className={`text-sm font-semibold tabular-nums ${quality.fiber >= 25 ? 'text-emerald-500' : quality.fiber >= 15 ? 'text-amber-500' : 'text-red-500'}`}>
                {Math.round(quality.fiber)}g
              </span>
            </div>
          )}

          {grouped.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">{t.no_data_logged}</p>
          )}

          {grouped.map(meal => {
            const mealTotal = meal.meal_items.reduce((s, i) => s + (i[cfg.field] ?? 0), 0)
            if (mealTotal === 0) return null
            return (
              <div key={meal.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {mealTypeLabel(meal.meal_type)}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    {fmt(mealTotal, cfg.unit)}
                  </span>
                </div>

                <div className="rounded-xl bg-card divide-y divide-border overflow-hidden">
                  {meal.meal_items
                    .filter(i => (i[cfg.field] ?? 0) > 0)
                    .sort((a, b) => (b[cfg.field] ?? 0) - (a[cfg.field] ?? 0))
                    .map((item, idx) => {
                      const val = item[cfg.field] ?? 0
                      const pct = mealTotal > 0 ? (val / mealTotal) * 100 : 0
                      return (
                        <div key={idx} className="flex items-center justify-between px-3 py-2 gap-3">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm truncate block">{translatedNames[item.ingredient_name] ?? item.ingredient_name}</span>
                            <span className="text-xs text-muted-foreground">{item.quantity} {translateUnit(item.unit, lang)}</span>
                          </div>
                          <div className="text-end shrink-0">
                            <span className="text-sm font-medium tabular-nums">{fmt(val, cfg.unit)}</span>
                            <span className="text-xs text-muted-foreground block">{Math.round(pct)}{t.pct_of_meal}</span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )
          })}

          {/* Total row */}
          {grouped.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-semibold">{t.total_label}</span>
              <div className="text-end">
                <span className="text-sm font-semibold tabular-nums">{fmt(total, cfg.unit)}</span>
                <span className="text-xs text-muted-foreground block">{Math.round(target > 0 ? (total / target) * 100 : 0)}{t.pct_of_goal}</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
