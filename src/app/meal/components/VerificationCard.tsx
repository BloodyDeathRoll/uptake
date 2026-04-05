'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, RotateCcw } from 'lucide-react'
import ConfidenceBadge from '@/components/shared/ConfidenceBadge'
import type { MealItem } from '@/hooks/useMeals'
import { scaleMacros, computePerUnit, applyPerUnit, type PerUnit } from '@/lib/nutrition/scaling'

type LocalItem = MealItem & { _perUnit?: PerUnit; _ver?: number }

const LIQUID_KEYWORDS = ['milk', 'juice', 'water', 'drink', 'beverage', 'oil', 'sauce', 'soup', 'broth', 'stock', 'coffee', 'tea', 'smoothie', 'shake', 'beer', 'wine', 'soda', 'cola', 'kefir', 'syrup', 'vinegar']

function defaultUnit(name: string): 'ml' | 'g' {
  const lower = name.toLowerCase()
  return LIQUID_KEYWORDS.some(k => lower.includes(k)) ? 'ml' : 'g'
}

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
  const [items, setItems] = useState<LocalItem[]>(
    (initialItems.length > 0 ? initialItems : [blankItem()]).map(item => ({
      ...item,
      _perUnit: computePerUnit(item),
      _ver: 0,
    }))
  )
  const [loadingQty, setLoadingQty] = useState<Record<number, boolean>>({})

  const handleQty = async (index: number, name: string) => {
    const unit = defaultUnit(name)
    const qty = 100

    // Set quantity + unit immediately so it feels responsive
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity: qty, unit } : item
    ))
    setLoadingQty(prev => ({ ...prev, [index]: true }))

    try {
      const res = await fetch('/api/ai/estimate-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: [{ name, quantity: qty, unit }] }),
      })
      const json = await res.json()
      const est = json.data?.items?.[0]
      if (est) {
        setItems(prev => prev.map((item, i) => {
          if (i !== index) return item
          const filled: LocalItem = {
            ...item,
            quantity:   qty,
            unit,
            calories:   est.calories   ?? null,
            protein_g:  est.protein_g  ?? null,
            carbs_g:    est.carbs_g    ?? null,
            fat_g:      est.fat_g      ?? null,
            fiber_g:    est.fiber_g    ?? null,
            food_group: est.food_group ?? null,
            confidence: est.confidence ?? 'low',
          }
          filled._perUnit = computePerUnit(filled)
          filled._ver = (item._ver ?? 0) + 1
          return filled
        }))
      }
    } catch {
      // silently leave quantity set, user can fill macros manually
    } finally {
      setLoadingQty(prev => ({ ...prev, [index]: false }))
    }
  }

  const update = (index: number, field: keyof MealItem, value: unknown) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      const wasAI = item.source === 'ai_text' || item.source === 'ai_vision'

      let patch: Partial<LocalItem> = { [field]: value }

      if (field === 'quantity') {
        const newQty = Number(value)
        if (item._perUnit) {
          patch = applyPerUnit(item._perUnit, newQty)
        } else {
          patch = scaleMacros(item, newQty)
        }
      } else if (['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g'].includes(field as string)) {
        // Keep per-unit anchor in sync when user manually edits a macro
        const numVal = value === null || value === '' ? null : Number(value)
        const newQty = item.quantity > 0 ? item.quantity : 1
        patch = {
          [field]: numVal,
          _perUnit: {
            ...(item._perUnit ?? { calories: null, protein_g: null, carbs_g: null, fat_g: null, fiber_g: null }),
            [field]: numVal !== null ? numVal / newQty : null,
          },
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

  const add = () => setItems(prev => [...prev, { ...blankItem(), _perUnit: undefined, _ver: 0 }])

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
          <div key={`${i}-${item._ver ?? 0}`} className="p-3 rounded-xl bg-card space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={item.ingredient_name}
                onChange={e => update(i, 'ingredient_name', e.target.value)}
                placeholder="Ingredient name"
                className="flex-1 h-8 text-sm"
              />
              {item.ingredient_name.trim() && !item.quantity && (
                <button
                  type="button"
                  onClick={() => handleQty(i, item.ingredient_name)}
                  disabled={loadingQty[i]}
                  className="h-8 px-2 rounded-md bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1"
                >
                  {loadingQty[i]
                    ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    : `QTY`}
                </button>
              )}
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
        <Button onClick={() => onSave(items.map(({ _perUnit: _p, _ver: _v, ...rest }) => rest))} disabled={saving} className="w-full">
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
