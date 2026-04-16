'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, RotateCcw, Camera, ImageIcon, ScanLine } from 'lucide-react'
import ConfidenceBadge from '@/components/shared/ConfidenceBadge'
import type { MealItem } from '@/hooks/useMeals'
import { scaleMacros, computePerUnit, applyPerUnit, type PerUnit } from '@/lib/nutrition/scaling'
import { useLanguage } from '@/lib/i18n'

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
  const { t, lang } = useLanguage()
  const [items, setItems] = useState<LocalItem[]>(
    (initialItems.length > 0 ? initialItems : [blankItem()]).map(item => ({
      ...item,
      _perUnit: computePerUnit(item),
      _ver: 0,
    }))
  )
  const [loadingQty, setLoadingQty] = useState<Record<number, boolean>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showScanChoice, setShowScanChoice] = useState<number | null>(null)
  const [scanningIngredient, setScanningIngredient] = useState<number | null>(null)
  const scanCameraRef = useRef<HTMLInputElement>(null)
  const scanGalleryRef = useRef<HTMLInputElement>(null)
  const scanTargetRef = useRef<number | null>(null)

  const handleQty = async (index: number, name: string) => {
    const unit = defaultUnit(name)
    const qty = 100

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
        setSaveError(null)
      }
    } catch {
      // silently leave quantity set, user can fill macros manually
    } finally {
      setLoadingQty(prev => ({ ...prev, [index]: false }))
    }
  }

  const triggerScan = (index: number, mode: 'camera' | 'gallery') => {
    scanTargetRef.current = index
    setShowScanChoice(null)
    if (mode === 'camera') scanCameraRef.current?.click()
    else scanGalleryRef.current?.click()
  }

  const handleIngredientScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const index = scanTargetRef.current
    if (!file || index === null) return
    e.target.value = '' // reset so same file can trigger again
    setScanningIngredient(index)
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      try {
        const res = await fetch('/api/ai/parse-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type, description: 'ingredient nutrition label', lang }),
        })
        const json = await res.json()
        const est = json.data?.items?.[0]
        if (est) {
          setItems(prev => prev.map((item, i) => {
            if (i !== index) return item
            const qty = (est.quantity > 0 ? est.quantity : null) ?? (item.quantity > 0 ? item.quantity : 100)
            const filled: LocalItem = {
              ...item,
              ingredient_name: item.ingredient_name.trim() || (est.name ?? item.ingredient_name),
              quantity:  qty,
              unit:      est.unit      ?? item.unit,
              calories:  est.calories  ?? null,
              protein_g: est.protein_g ?? null,
              carbs_g:   est.carbs_g   ?? null,
              fat_g:     est.fat_g     ?? null,
              fiber_g:   est.fiber_g   ?? null,
              confidence: est.confidence ?? 'medium',
              source: 'ai_vision',
            }
            filled._perUnit = computePerUnit(filled)
            filled._ver = (item._ver ?? 0) + 1
            return filled
          }))
          setSaveError(null)
        }
      } catch {
        // silently fail — user can fill manually
      } finally {
        setScanningIngredient(null)
      }
    }
    reader.readAsDataURL(file)
  }

  const update = (index: number, field: keyof MealItem, value: unknown) => {
    if (field === 'quantity' && Number(value) > 0) setSaveError(null)
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      const wasAI = item.source === 'ai_text' || item.source === 'ai_vision'

      let patch: Partial<LocalItem> = { [field]: value }

      if (field === 'quantity') {
        const newQty = Number(value)
        if (newQty <= 0) {
          // User cleared the field to re-enter — preserve macros and anchor _perUnit
          // so proportional scaling works when they type the new value
          patch = { quantity: newQty, _perUnit: item._perUnit ?? computePerUnit(item) }
        } else if (item._perUnit) {
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
        <h2 className="font-semibold">{t.review_ingredients}</h2>
        <button onClick={onReset} className="text-xs text-muted-foreground flex items-center gap-1">
          <RotateCcw className="w-3 h-3" /> {t.start_over}
        </button>
      </div>

      {/* Hidden file inputs for per-ingredient label scanning */}
      <input ref={scanCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleIngredientScan} />
      <input ref={scanGalleryRef} type="file" accept="image/*" className="hidden" onChange={handleIngredientScan} />

      {/* Items list */}
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={`${i}-${item._ver ?? 0}`} className="p-3 rounded-xl bg-card space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={item.ingredient_name}
                onChange={e => update(i, 'ingredient_name', e.target.value)}
                placeholder={t.ingredient_name_placeholder}
                className="flex-1 h-8 text-sm"
              />
              {item.ingredient_name.trim() && !item.quantity && !loadingQty[i] && !scanningIngredient && (
                <button
                  type="button"
                  onClick={() => handleQty(i, item.ingredient_name)}
                  className="h-8 px-2 rounded-md bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center gap-1"
                >
                  {t.qty_auto}
                </button>
              )}
              {/* Scan ingredient label */}
              {!loadingQty[i] && scanningIngredient !== i && (
                showScanChoice === i ? (
                  <div className="flex gap-1 shrink-0">
                    <button type="button" onClick={() => triggerScan(i, 'camera')} className="h-8 px-2 rounded-md bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                      <Camera className="w-3 h-3" /> {t.camera_btn}
                    </button>
                    <button type="button" onClick={() => triggerScan(i, 'gallery')} className="h-8 px-2 rounded-md bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> {t.file_btn}
                    </button>
                    <button type="button" onClick={() => setShowScanChoice(null)} className="h-8 px-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors">
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowScanChoice(i)}
                    className="h-8 w-8 rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center justify-center"
                    title={t.scan_label_title}
                  >
                    <ScanLine className="w-3.5 h-3.5" />
                  </button>
                )
              )}
              {item.quantity > 0 && <ConfidenceBadge confidence={item.confidence} />}
              <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {loadingQty[i] || scanningIngredient === i ? (
              <div className="flex items-center gap-2 h-8 text-xs text-muted-foreground">
                <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin shrink-0" />
                {scanningIngredient === i ? t.scanning_label : t.estimating_nutrition}
              </div>
            ) : item.quantity > 0 || item._perUnit != null ? (
              <div className="grid grid-cols-5 gap-1.5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground truncate">{t.col_amt} {item.unit}</span>
                  <Input
                    type="number"
                    value={item.quantity || ''}
                    onChange={e => update(i, 'quantity', Number(e.target.value))}
                    placeholder="0"
                    className="w-full h-8 text-xs px-1.5"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground truncate">{t.col_cal}</span>
                  <Input
                    type="number"
                    value={item.calories ?? ''}
                    onChange={e => update(i, 'calories', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="—"
                    className="w-full h-8 text-xs px-1.5"
                    disabled={item.quantity === 0}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground truncate">{t.col_prot_g}</span>
                  <Input
                    type="number"
                    value={item.protein_g ?? ''}
                    onChange={e => update(i, 'protein_g', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="—"
                    className="w-full h-8 text-xs px-1.5"
                    disabled={item.quantity === 0}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground truncate">{t.col_carbs_g}</span>
                  <Input
                    type="number"
                    value={item.carbs_g ?? ''}
                    onChange={e => update(i, 'carbs_g', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="—"
                    className="w-full h-8 text-xs px-1.5"
                    disabled={item.quantity === 0}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground truncate">{t.col_fat_g}</span>
                  <Input
                    type="number"
                    value={item.fat_g ?? ''}
                    onChange={e => update(i, 'fat_g', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="—"
                    className="w-full h-8 text-xs px-1.5"
                    disabled={item.quantity === 0}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* Add button */}
      <button onClick={add} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl shadow-[0_0_2px_0_rgba(0,0,0,0.1)] text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Plus className="w-4 h-4" /> {t.add_ingredient}
      </button>

      {/* Summary */}
      <div className="p-3 rounded-xl bg-muted/50 grid grid-cols-4 gap-2 text-center">
        <div><div className="text-xs text-muted-foreground">{t.col_cal}</div><div className="font-bold text-sm">{Math.round(totalCalories)}</div></div>
        <div><div className="text-xs text-muted-foreground">{t.protein}</div><div className="font-bold text-sm">{Math.round(totalProtein)}g</div></div>
        <div><div className="text-xs text-muted-foreground">{t.carbs}</div><div className="font-bold text-sm">{Math.round(totalCarbs)}g</div></div>
        <div><div className="text-xs text-muted-foreground">{t.fat}</div><div className="font-bold text-sm">{Math.round(totalFat)}g</div></div>
      </div>

      {/* Actions */}
      <div className="pt-2 space-y-2">
        {saveError && (
          <p className="text-xs text-destructive text-center">{saveError}</p>
        )}
        <Button
          onClick={() => {
            const missing = items.some(it => it.quantity === 0)
            if (missing) { setSaveError(t.must_fill_quantity); return }
            setSaveError(null)
            onSave(items.map(({ _perUnit: _p, _ver: _v, ...rest }) => rest))
          }}
          disabled={saving}
          className="w-full"
        >
          {saving ? t.saving : t.save}
        </Button>
      </div>
    </div>
  )
}
