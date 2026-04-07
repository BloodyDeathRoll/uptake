'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Camera, ImageIcon, X } from 'lucide-react'
import VerificationCard from '../components/VerificationCard'
import type { MealItem } from '@/hooks/useMeals'
import type { MealType } from '@/lib/utils/constants'

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
  const revisionOf = searchParams.get('revisionOf')
  const returnDate = searchParams.get('returnDate')
  const isEdit = !!revisionOf

  const [mealType, setMealType] = useState<MealType>('snack')
  const [description, setDescription] = useState('')
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
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // Pre-populate when editing an existing meal
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
      .catch(() => setError("Couldn't load the original meal."))
      .finally(() => setLoading(false))
  }, [revisionOf])

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
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
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
        setError("Couldn't analyze the image. You can still describe your meal below.")
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
      setError('Add a photo or describe your meal first')
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
          body: JSON.stringify({ description }),
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
          body: JSON.stringify({ imageBase64: pendingImage!.base64, mimeType: pendingImage!.mimeType }),
        })
        const json = await res.json()
        if (json.error) { setError(json.error); return }
        setItems(mapItems(json.data.items, 'ai_vision', isReanalysis))
        setAnalyzeCount(c => c + 1)
      }
    } catch {
      setError("We had trouble analyzing that. Try listing ingredients separately, e.g. '200g chicken, 1 cup rice, salad'.")
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
      setError(e instanceof Error ? e.message : "Couldn't save your meal. Your entries are preserved — tap Save to try again.")
    } finally {
      setSaving(false)
    }
  }

  const canEstimate = description.trim().length > 0 || !!pendingImage

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm shadow-[0_0_2px_0_rgba(0,0,0,0.1)] px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => { setNavigating(true); router.back() }}
          className="text-sm text-accent font-medium underline underline-offset-2 flex items-center gap-1.5 min-w-[3.5rem]"
        >
          {navigating
            ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : 'Cancel'}
        </button>
        <span className="font-semibold">{isEdit ? 'Edit meal' : 'Log meal'}</span>
        <div className="w-12" />
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">

        {/* Meal type */}
        <Tabs value={mealType} onValueChange={v => setMealType(v as MealType)}>
          <TabsList className="w-full">
            <TabsTrigger value="breakfast" className="flex-1">Breakfast</TabsTrigger>
            <TabsTrigger value="lunch" className="flex-1">Lunch</TabsTrigger>
            <TabsTrigger value="dinner" className="flex-1">Dinner</TabsTrigger>
            <TabsTrigger value="snack" className="flex-1">Snack</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Photo + description — always visible */}
        <div className="space-y-3">
          {/* Two hidden inputs: one forces camera, one opens gallery/files */}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { setShowPhotoChoice(false); handleImageUpload(e) }} />
          <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={e => { setShowPhotoChoice(false); handleImageUpload(e) }} />

          {imagePreview ? (
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
                    <Camera className="w-3 h-3" /> Camera
                  </button>
                  <button onClick={() => { setShowPhotoChoice(false); galleryInputRef.current?.click() }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/70 text-white text-xs hover:bg-black/90 transition-colors">
                    <ImageIcon className="w-3 h-3" /> Gallery
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPhotoChoice(true)}
                  className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 text-white text-xs hover:bg-black/70 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" /> Replace
                </button>
              )}
            </div>
          ) : showPhotoChoice ? (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowPhotoChoice(false); cameraInputRef.current?.click() }} disabled={loading}>
                <Camera className="w-4 h-4 mr-2" /> Camera
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { setShowPhotoChoice(false); galleryInputRef.current?.click() }} disabled={loading}>
                <ImageIcon className="w-4 h-4 mr-2" /> Gallery
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowPhotoChoice(true)}
              disabled={loading}
            >
              <Camera className="w-4 h-4 mr-2" /> Add a photo
            </Button>
          )}

          <Textarea
            placeholder="Describe your meal… e.g. '200g grilled chicken, 1 cup brown rice, mixed salad'"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="resize-none"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleEstimate}
            disabled={loading || !canEstimate}
            className="w-full h-12"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Analyzing…
              </span>
            ) : items !== null ? 'Re-analyze' : 'Estimate nutrition'}
          </Button>

          {items === null && (
            <Button variant="outline" onClick={() => setItems([])} className="w-full">
              Enter manually
            </Button>
          )}
        </div>

        {/* Verification card — appears below, not instead of the input */}
        {items !== null && (
          <>
            {imageType === 'ingredient_list' && (
              <div className="px-3 py-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
                Looks like an ingredient list. Each item defaults to 100g — update the amounts to what you actually ate.
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
