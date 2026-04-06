'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Meal } from '@/hooks/useMeals'

type MacroKey = 'calories' | 'protein' | 'carbs' | 'fat'

const MACRO_CONFIG: Record<MacroKey, { label: string; field: 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'; unit: string }> = {
  calories: { label: 'Calories',  field: 'calories',   unit: 'kcal' },
  protein:  { label: 'Protein',   field: 'protein_g',  unit: 'g' },
  carbs:    { label: 'Carbs',     field: 'carbs_g',    unit: 'g' },
  fat:      { label: 'Fat',       field: 'fat_g',      unit: 'g' },
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
  if (!macro) return null
  const cfg = MACRO_CONFIG[macro]

  // Group meals by type, sorted by known order
  const grouped = meals
    .filter(m => m.meal_items.some(i => (i[cfg.field] ?? 0) > 0))
    .sort((a, b) => {
      const ai = MEAL_ORDER.indexOf(a.meal_type.toLowerCase())
      const bi = MEAL_ORDER.indexOf(b.meal_type.toLowerCase())
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })

  const total = meals.reduce((sum, m) => sum + m.meal_items.reduce((s, i) => s + (i[cfg.field] ?? 0), 0), 0)

  return (
    <Dialog open={!!macro} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-none w-[min(92vw,32rem)] max-h-[82dvh] overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>{cfg.label} breakdown</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fmt(total, cfg.unit)} consumed · {fmt(target, cfg.unit)} goal
          </p>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {grouped.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No data logged yet.</p>
          )}

          {grouped.map(meal => {
            const mealTotal = meal.meal_items.reduce((s, i) => s + (i[cfg.field] ?? 0), 0)
            if (mealTotal === 0) return null
            return (
              <div key={meal.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground capitalize">
                    {meal.meal_type}
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
                            <span className="text-sm truncate block">{item.ingredient_name}</span>
                            <span className="text-xs text-muted-foreground">{item.quantity} {item.unit}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-medium tabular-nums">{fmt(val, cfg.unit)}</span>
                            <span className="text-xs text-muted-foreground block">{Math.round(pct)}% of meal</span>
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
              <span className="text-sm font-semibold">Total</span>
              <div className="text-right">
                <span className="text-sm font-semibold tabular-nums">{fmt(total, cfg.unit)}</span>
                <span className="text-xs text-muted-foreground block">{Math.round(target > 0 ? (total / target) * 100 : 0)}% of goal</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
