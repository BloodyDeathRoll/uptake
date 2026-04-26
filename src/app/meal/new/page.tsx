'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Camera, ImageIcon, X, Sunrise, Sandwich, Moon, Cookie, Utensils, PenLine } from 'lucide-react'
import VerificationCard from '../components/VerificationCard'
import type { MealItem } from '@/hooks/useMeals'
import type { MealType } from '@/lib/utils/constants'
import { useLanguage, type Translations } from '@/lib/i18n'

interface RecentMeal {
  id: string
  meal_type: string
  human_description: string | null
  display_description: string
  logged_at: string
  meal_items: Array<{ calories: number | null; [key: string]: unknown }>
}

const MEAL_ICON: Record<string, React.ElementType> = {
  breakfast: Sunrise,
  lunch: Sandwich,
  dinner: Moon,
  snack: Cookie,
}

function mapItems(
  items: Record<string, unknown>[],
  source: MealItem['source'],
  wasCorrection = false
): MealItem[] {
  return items.map(item => ({
    ingredient_name: (item.name ?? item.ingredient_name) as string,
    quantity: item.quantity as number,
    unit: item.unit as string,
    calories: item.calories as number ?? null,
    protein_g: item.protein_g as number ?? null,
    carbs_g: item.carbs_g as number ?? null,
    fat_g: item.fat_g as number ?? null,
    fiber_g: item.fiber_g as number ?? null,
    sugar_g: item.sugar_g as number ?? null,
    saturated_fat_g: item.saturated_fat_g as number ?? null,
    sodium_mg: item.sodium_mg as number ?? null,
    food_group: item.food_group as string ?? null,
    confidence: item.confidence as 'high' | 'medium' | 'low' ?? 'medium',
    source,
    was_corrected: wasCorrection,
    original_ai_estimate: item,
  }))
}

function NewMealPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, lang } = useLanguage()
  const revisionOf = searchParams.get('revisionOf')
  const relogOf = searchParams.get('relogOf')
  const returnDate = searchParams.get('returnDate')
  const isEdit = !!revisionOf

  // Pre-populate from daily menu suggestion link (?description=...&mealType=...)
  const urlDescription = searchParams.get('description') ?? ''
  const urlMealType = (searchParams.get('mealType') as MealType) || null

  const [mealType, setMealType] = useState<MealType>(urlMealType ?? 'snack')
  const [description, setDescription] = useState(urlDescription)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [pendingImage, setPendingImage] = useState<{ base64: string; mimeType: string } | null>(null)
  const [items, setItems] = useState<MealItem[] | null>(null)
  const [imageType, setImageType] = useState<'meal' | 'ingredient_list' | null>(null)
  const [analyzeCount, setAnalyzeCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [navigating, setNavigating] = useState(false)
  const [showPhotoChoice, setShowPhotoChoice] = useState(false)
  const [recentMeals, setRecentMeals] = useState<RecentMeal[] | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const suggestionScrolling = useRef(false)

  const mealLabel = (type: string) =>
    (t[('meal_' + type) as keyof Translations] as string) ?? type

  // Shared function: fetch a meal by ID and populate state (used for relogOf param and suggestion cards)
  const loadRelogMeal = useCallback((id: string) => {
    setLoading(true)
    setError(null)
    fetch(`/api/meals/${id}`)
      .then(r => r.json())
      .then(json => {
        if (!json.data) return
        const meal = json.data
        setMealType(meal.meal_type as MealType)
        setDescription(meal.human_description ?? '')
        setAnalyzeCount(c => c + 1)
        setItems(
          (meal.meal_items ?? []).map((item: Record<string, unknown>) => ({
            ingredient_name: item.ingredient_name as string,
            quantity: item.quantity as number,
            unit: item.unit as string,
            calories: item.calories as number ?? null,
            protein_g: item.protein_g as number ?? null,
            carbs_g: item.carbs_g as number ?? null,
            fat_g: item.fat_g as number ?? null,
            fiber_g: item.fiber_g as number ?? null,
            sugar_g: item.sugar_g as number ?? null,
            saturated_fat_g: item.saturated_fat_g as number ?? null,
            sodium_mg: item.sodium_mg as number ?? null,
            food_group: item.food_group as string ?? null,
            confidence: item.confidence as 'high' | 'medium' | 'low' ?? null,
            source: 'memory' as MealItem['source'],
            was_corrected: false,
            original_ai_estimate: null,
          }))
        )
      })
      .catch(() => setError(t.err_load_meal))
      .finally(() => setLoading(false))
  }, [t.err_load_meal])

  // Auto-analyze when opened from a daily menu "Log this" link
  useEffect(() => {
    if (!urlDescription || revisionOf) return
    handleEstimate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally runs once on mount; description is already set in initial state

  // Pre-populate when editing an existing meal (revision)
  useEffect(() => {
    if (!revisionOf) return
    setLoading(true)
    fetch(`/api/meals/${revisionOf}`)
      .then(r => r.json())
      .then(json => {
        if (!json.data) return
        const meal = json.data
        setMealType(meal.meal_type as MealType)
        setDescription(meal.human_description ?? '')
        if (meal.image_url) setImagePreview(meal.image_url)
        setItems(
          (meal.meal_items ?? []).map((item: Record<string, unknown>) => ({
            ingredient_name: item.ingredient_name as string,
            quantity: item.quantity as number,
            unit: item.unit as string,
            calories: item.calories as number ?? null,
            protein_g: item.protein_g as number ?? null,
            carbs_g: item.carbs_g as number ?? null,
            fat_g: item.fat_g as number ?? null,
            fiber_g: item.fiber_g as number ?? null,
            sugar_g: item.sugar_g as number ?? null,
            saturated_fat_g: item.saturated_fat_g as number ?? null,
            sodium_mg: item.sodium_mg as number ?? null,
            food_group: item.food_group as string ?? null,
            confidence: item.confidence as 'high' | 'medium' | 'low' ?? null,
            source: (item.source as MealItem['source']) ?? 'user_manual',
            was_corrected: false,
            original_ai_estimate: null,
          }))
        )
      })
      .catch(() => setError(t.err_load_meal))
      .finally(() => setLoading(false))
  }, [revisionOf])

  // Pre-populate when opened via ?relogOf=<id> (e.g. "Log again" from detail page)
  useEffect(() => {
    if (!relogOf) return
    loadRelogMeal(relogOf)
  }, [relogOf, loadRelogMeal])

  // Fetch recent meals for the suggestions strip (only on a blank new meal form)
  useEffect(() => {
    if (revisionOf || relogOf || urlDescription) return
    fetch('/api/meals/recent')
      .then(r => r.json())
      .then(json => setRecentMeals(json.data ?? []))
      .catch(() => setRecentMeals([]))
  }, [revisionOf, relogOf, urlDescription])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError(null)
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      setImagePreview(dataUrl)
      setPendingImage({ base64, mimeType: file.type })
      try {
        const res = await fetch('/api/ai/parse-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type, lang }),
        })
        const json = await res.json()
        if (json.error) { setError(json.error); setLoading(false); return }
        setItems(mapItems(json.data.items, 'ai_vision'))
        setImageType(json.data.image_type ?? 'meal')
        setAnalyzeCount(c => c + 1)
        // Pre-fill description with AI suggestion only if user hasn't typed anything yet
        const suggested = json.data.suggested_description as string | undefined
        if (suggested && !description.trim()) {
          setDescription(suggested)
        }
      } catch {
        setError(t.err_analyze_image)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImagePreview(null)
    setPendingImage(null)
    setImageType(null)
    setShowPhotoChoice(false)
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  // Estimate/re-estimate: description takes priority; falls back to image.
  // When replacing a previous analysis, items are flagged as corrections so
  // the meal history context can learn from the user's input.
  const handleEstimate = async () => {
    const hasDesc = description.trim().length > 0
    const hasImage = !!pendingImage
    if (!hasDesc && !hasImage) {
      setError(t.err_no_meal)
      return
    }
    const isReanalysis = items !== null  // replacing a previous AI analysis
    setLoading(true)
    setError(null)
    try {
      if (hasDesc) {
        const res = await fetch('/api/ai/parse-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description, lang }),
        })
        const json = await res.json()
        if (json.error) { setError(json.error); return }
        setItems(mapItems(json.data.items, 'ai_text', isReanalysis))
        setAnalyzeCount(c => c + 1)
      } else {
        // Re-analyze image (no description provided)
        const res = await fetch('/api/ai/parse-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: pendingImage!.base64, mimeType: pendingImage!.mimeType, lang }),
        })
        const json = await res.json()
        if (json.error) { setError(json.error); return }
        setItems(mapItems(json.data.items, 'ai_vision', isReanalysis))
        setAnalyzeCount(c => c + 1)
      }
    } catch {
      setError(t.err_analyze)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (finalItems: MealItem[]) => {
    setSaving(true)
    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType,
          humanDescription: description || null,
          items: finalItems,
          ...(revisionOf ? { revisionOf } : {}),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      router.push(returnDate ? `/dashboard?date=${returnDate}` : '/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : t.err_save_meal)
    } finally {
      setSaving(false)
    }
  }

  const canEstimate = description.trim().length > 0 || !!pendingImage

  return (
    <div className="min-h-screen bg-background">
      <div dir="ltr" className="sticky top-0 bg-background/80 backdrop-blur-sm shadow-[0_0_2px_0_rgba(0,0,0,0.1)] px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => { setNavigating(true); router.back() }}
          className="text-sm text-accent font-medium underline underline-offset-2 flex items-center gap-1.5 min-w-[3.5rem]"
        >
          {navigating
            ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : t.cancel}
        </button>
        <span className="font-semibold">{isEdit ? t.edit_meal : t.log_meal}</span>
        <div className="w-12" />
      </div>

      <div className="px-4 py-6 space-y-6 max-w-[38.4rem] mx-auto">

        {/* Meal type */}
        <Tabs value={mealType} onValueChange={v => setMealType(v as MealType)}>
          <TabsList className="w-full">
            <TabsTrigger value="breakfast" className="flex-1">{t.meal_breakfast}</TabsTrigger>
            <TabsTrigger value="lunch" className="flex-1">{t.meal_lunch}</TabsTrigger>
            <TabsTrigger value="dinner" className="flex-1">{t.meal_dinner}</TabsTrigger>
            <TabsTrigger value="snack" className="flex-1">{t.meal_snack}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Form: suggestions → image preview → textarea → CTAs */}
        <div className="space-y-3">
          {/* Hidden file inputs */}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { setShowPhotoChoice(false); handleImageUpload(e) }} />
          <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={e => { setShowPhotoChoice(false); handleImageUpload(e) }} />

          {/* Recent meals suggestions — only when form is blank */}
          {items === null && !description && !imagePreview && recentMeals && recentMeals.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t.recent_meals}</p>
              <div
                className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none snap-x snap-mandatory"
                onScroll={() => { suggestionScrolling.current = true }}
              >
                {recentMeals.map(meal => {
                  const Icon = MEAL_ICON[meal.meal_type] ?? Utensils
                  const kcal = Math.round(meal.meal_items.reduce((s, i) => s + (i.calories ?? 0), 0))
                  return (
                    <button
                      key={meal.id}
                      onPointerDown={() => { suggestionScrolling.current = false }}
                      onClick={() => { if (!suggestionScrolling.current) loadRelogMeal(meal.id) }}
                      style={{ width: 'calc(100% / 2.2 - 5px)', minWidth: 'calc(100% / 2.2 - 5px)' }}
                      className="snap-start flex flex-col gap-1.5 p-3 rounded-xl bg-card border border-border text-left hover:border-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{mealLabel(meal.meal_type)}</span>
                      </div>
                      <span className="text-xs font-medium leading-snug line-clamp-3">{meal.display_description}</span>
                      <span className="text-[10px] text-muted-foreground mt-auto">{kcal} {t.unit_kcal}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Image preview */}
          {imagePreview && (
            <div className="relative rounded-xl overflow-hidden">
              <img src={imagePreview} alt="Meal photo" className="w-full h-48 object-cover" />
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {showPhotoChoice ? (
                <div className="absolute bottom-2 right-2 flex gap-1.5">
                  <button onClick={() => { setShowPhotoChoice(false); cameraInputRef.current?.click() }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/70 text-white text-xs hover:bg-black/90 transition-colors">
                    <Camera className="w-3 h-3" /> {t.camera_btn}
                  </button>
                  <button onClick={() => { setShowPhotoChoice(false); galleryInputRef.current?.click() }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/70 text-white text-xs hover:bg-black/90 transition-colors">
                    <ImageIcon className="w-3 h-3" /> {t.gallery_btn}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPhotoChoice(true)}
                  className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 text-white text-xs hover:bg-black/70 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" /> {t.replace_btn}
                </button>
              )}
            </div>
          )}

          <Textarea
            placeholder={t.meal_placeholder}
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="resize-none"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* CTAs */}
          {items === null ? (
            showPhotoChoice ? (
              // Expanded camera/gallery picker
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-12" onClick={() => { setShowPhotoChoice(false); cameraInputRef.current?.click() }} disabled={loading}>
                  <Camera className="w-4 h-4 mr-2" /> {t.camera_btn}
                </Button>
                <Button variant="outline" className="flex-1 h-12" onClick={() => { setShowPhotoChoice(false); galleryInputRef.current?.click() }} disabled={loading}>
                  <ImageIcon className="w-4 h-4 mr-2" /> {t.gallery_btn}
                </Button>
              </div>
            ) : (
              // [ 📷 ]  [ Estimate nutrition ]  [ ✏ ]
              <div className="flex gap-2 items-stretch">
                <Button
                  variant="outline"
                  className="h-12 w-12 flex-shrink-0 p-0"
                  onClick={() => setShowPhotoChoice(true)}
                  disabled={loading}
                  title={t.add_photo}
                >
                  <Camera className="w-5 h-5" />
                </Button>
                <Button
                  onClick={handleEstimate}
                  disabled={loading || !canEstimate}
                  className="flex-1 h-12"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {t.analyzing_meal}
                    </span>
                  ) : t.estimate_nutrition}
                </Button>
                <Button
                  variant="outline"
                  className="h-12 w-12 flex-shrink-0 p-0"
                  onClick={() => setItems([])}
                  title={t.enter_manually}
                >
                  <PenLine className="w-4 h-4" />
                </Button>
              </div>
            )
          ) : (
            // Re-analyze (VerificationCard is open)
            <Button
              variant="outline"
              onClick={handleEstimate}
              disabled={loading || !canEstimate}
              className="w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {t.analyzing_meal}
                </span>
              ) : t.re_analyze}
            </Button>
          )}
        </div>

        {/* Verification card — appears below, not instead of the input */}
        {items !== null && (
          <>
            {imageType === 'ingredient_list' && (
              <div className="px-3 py-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
                {t.ingredient_list_hint}
              </div>
            )}
            <VerificationCard
              key={analyzeCount}
              initialItems={items}
              onSave={handleSave}
              onReset={() => { setItems(null); setImageType(null) }}
              saving={saving}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default function NewMealPage() {
  return (
    <Suspense>
      <NewMealPageInner />
    </Suspense>
  )
}
