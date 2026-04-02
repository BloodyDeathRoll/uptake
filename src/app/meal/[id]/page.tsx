import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatTime } from '@/lib/utils/format'
import { MEAL_TYPE_LABELS } from '@/lib/utils/constants'
import ConfidenceBadge from '@/components/shared/ConfidenceBadge'
import { Badge } from '@/components/ui/badge'

export default async function MealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  type MealWithItems = {
    id: string; user_id: string; meal_type: string; human_description: string | null
    image_url: string | null; logged_at: string; revision_of: string | null
    meal_items: Array<{
      id: string; ingredient_name: string; quantity: number; unit: string
      calories: number | null; protein_g: number | null; carbs_g: number | null
      fat_g: number | null; was_corrected: boolean
      confidence: 'high' | 'medium' | 'low' | null; source: string
    }>
  }

  const { data: meal } = await supabase
    .from('meals')
    .select('*, meal_items(*)')
    .eq('id', id)
    .eq('user_id', user?.id ?? '')
    .single() as { data: MealWithItems | null; error: unknown }

  if (!meal) notFound()

  const items = meal.meal_items ?? []
  const totalCal = items.reduce((s: number, i: { calories: number | null }) => s + (i.calories ?? 0), 0)
  const totalProtein = items.reduce((s: number, i: { protein_g: number | null }) => s + (i.protein_g ?? 0), 0)
  const totalCarbs = items.reduce((s: number, i: { carbs_g: number | null }) => s + (i.carbs_g ?? 0), 0)
  const totalFat = items.reduce((s: number, i: { fat_g: number | null }) => s + (i.fat_g ?? 0), 0)

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm shadow-[0_0_2px_0_rgba(0,0,0,0.1)] px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-muted-foreground text-sm">← Back</Link>
        <span className="font-semibold capitalize">
          {MEAL_TYPE_LABELS[meal.meal_type as keyof typeof MEAL_TYPE_LABELS] ?? meal.meal_type}
        </span>
        <Link href={`/meal/new?revisionOf=${meal.id}`} className="text-accent text-sm">Edit</Link>
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
            { label: 'Calories', value: Math.round(totalCal), unit: 'kcal' },
            { label: 'Protein', value: Math.round(totalProtein), unit: 'g' },
            { label: 'Carbs', value: Math.round(totalCarbs), unit: 'g' },
            { label: 'Fat', value: Math.round(totalFat), unit: 'g' },
          ].map(({ label, value, unit }) => (
            <div key={label} className="p-3 rounded-xl bg-card shadow-[0_0_2px_0_rgba(0,0,0,0.1)]">
              <div className="text-lg font-bold">{value}<span className="text-xs font-normal text-muted-foreground">{unit}</span></div>
              <div className="text-[10px] text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {/* Items */}
        <div className="space-y-2">
          <h2 className="font-semibold text-sm">Ingredients</h2>
          {items.map((item: { id: string; ingredient_name: string; quantity: number; unit: string; calories: number | null; protein_g: number | null; was_corrected: boolean; confidence: 'high' | 'medium' | 'low' | null; source: string }) => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-[0_0_2px_0_rgba(0,0,0,0.1)]">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.ingredient_name}</span>
                  <ConfidenceBadge confidence={item.confidence} />
                  {item.was_corrected && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500/30 text-blue-500">edited</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{item.quantity} {item.unit}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{Math.round(item.calories ?? 0)} kcal</div>
                <div className="text-xs text-muted-foreground">{Math.round(item.protein_g ?? 0)}g protein</div>
              </div>
            </div>
          ))}
        </div>

        {meal.revision_of && (
          <p className="text-xs text-muted-foreground text-center">
            This is a revised version of an earlier log.{' '}
            <Link href={`/meal/${meal.revision_of}`} className="underline">View original</Link>
          </p>
        )}
      </div>
    </div>
  )
}
