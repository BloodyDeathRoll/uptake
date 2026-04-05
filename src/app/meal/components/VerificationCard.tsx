'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, RotateCcw } from 'lucide-react'
import ConfidenceBadge from '@/components/shared/ConfidenceBadge'
import type { MealItem } from '@/hooks/useMeals'

interface Props {
  initialItems: MealItem[]
  onSave: (items: MealItem[]) => void
  onReset: () => void
  saving: boolean
}

function blankItem(): MealItem {
  return {
    ingredient_name: '',
    quantity: 0,
    unit: 'g',
    calories: null,
    protein_g: null,
    carbs_g: null,
    fat_g: null,
    fiber_g: null,
    sugar_g: null,
    saturated_fat_g: null,
    sodium_mg: null,
    food_group: null,
    confidence: 'low',
    source: 'user_manual',
    was_corrected: false,
  }
}

export default function VerificationCard({ initialItems, onSave, onReset, saving }: Props) {
  const [items, setItems] = useState<MealItem[]>(
    initialItems.length > 0 ? initialItems : [blankItem()]
  )

  const update = (index: number, field: keyof MealItem, value: unknown) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      const wasAI = item.source === 'ai_text' || item.source === 'ai_vision'

      let patch: Partial<MealItem> = { [field]: value }

      // When quantity changes, scale all macros proportionally
      if (field === 'quantity') {
        const newQty = Number(value)
        const oldQty = item.quantity
        if (oldQty > 0 && newQty > 0 && newQty !== oldQty) {
          const r = newQty / oldQty
          patch = {
            ...patch,
            calories:         item.calories         !== null ? Math.round(item.calories * r)              : null,
            protein_g:        item.protein_g         !== null ? Math.round(item.protein_g * r * 10) / 10  : null,
            carbs_g:          item.carbs_g           !== null ? Math.round(item.carbs_g * r * 10) / 10    : null,
            fat_g:            item.fat_g             !== null ? Math.round(item.fat_g * r * 10) / 10      : null,
            fiber_g:          item.fiber_g           !== null ? Math.round(item.fiber_g * r * 10) / 10    : null,
          }
        }
      }

      return {
        ...item,
        ...patch,
        was_corrected: wasAI,
        source: wasAI ? 'user_manual' as const : item.source,
      }
    }))
  }

  const remove = (index: number) => setItems(prev => prev.filter((_, i) => i !== index))

  const add = () => setItems(prev => [...prev, blankItem()])

  const totalCalories = items.reduce((sum, item) => sum + (item.calories ?? 0), 0)
  const totalProtein = items.reduce((sum, item) => sum + (item.protein_g ?? 0), 0)
  const totalCarbs = items.reduce((sum, item) => sum + (item.carbs_g ?? 0), 0)
  const totalFat = items.reduce((sum, item) => sum + (item.fat_g ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Review ingredients</h2>
        <button onClick={onReset} className="text-xs text-muted-foreground flex items-center gap-1">
          <RotateCcw className="w-3 h-3" /> Start over
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="p-3 rounded-xl bg-card space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={item.ingredient_name}
                onChange={e => update(i, 'ingredient_name', e.target.value)}
                placeholder="Ingredient name"
                className="flex-1 h-8 text-sm"
              />
              <ConfidenceBadge confidence={item.confidence} />
              <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground">Amount {item.unit}</span>
                <Input
                  type="number"
                  value={item.quantity || ''}
                  onChange={e => update(i, 'quantity', Number(e.target.value))}
                  placeholder="0"
                  className="w-20 h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground">kcal</span>
                <Input
                  type="number"
                  value={item.calories ?? ''}
                  onChange={e => update(i, 'calories', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="—"
                  className="h-8 text-xs w-20"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground">Protein g</span>
                <Input
                  type="number"
                  value={item.protein_g ?? ''}
                  onChange={e => update(i, 'protein_g', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="—"
                  className="h-8 text-xs w-20"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground">Carbs g</span>
                <Input
                  type="number"
                  value={item.carbs_g ?? ''}
                  onChange={e => update(i, 'carbs_g', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="—"
                  className="h-8 text-xs w-20"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground">Fat g</span>
                <Input
                  type="number"
                  value={item.fat_g ?? ''}
                  onChange={e => update(i, 'fat_g', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="—"
                  className="h-8 text-xs w-20"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add button */}
      <button onClick={add} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl shadow-[0_0_2px_0_rgba(0,0,0,0.1)] text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Plus className="w-4 h-4" /> Add ingredient
      </button>

      {/* Summary */}
      <div className="p-3 rounded-xl bg-muted/50 grid grid-cols-4 gap-2 text-center">
        <div><div className="text-xs text-muted-foreground">Cal</div><div className="font-bold text-sm">{Math.round(totalCalories)}</div></div>
        <div><div className="text-xs text-muted-foreground">Protein</div><div className="font-bold text-sm">{Math.round(totalProtein)}g</div></div>
        <div><div className="text-xs text-muted-foreground">Carbs</div><div className="font-bold text-sm">{Math.round(totalCarbs)}g</div></div>
        <div><div className="text-xs text-muted-foreground">Fat</div><div className="font-bold text-sm">{Math.round(totalFat)}g</div></div>
      </div>

      {/* Actions */}
      <div className="pt-2">
        <Button onClick={() => onSave(items)} disabled={saving} className="w-full">
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
