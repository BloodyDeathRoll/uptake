import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MealDetailContent from './MealDetailContent'

export default async function MealDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ returnDate?: string }>
}) {
  const { id } = await params
  const { returnDate } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: meal } = await supabase
    .from('meals')
    .select('*, meal_items(*)')
    .eq('id', id)
    .eq('user_id', user?.id ?? '')
    .single()

  if (!meal) notFound()

  return <MealDetailContent meal={meal} returnDate={returnDate} />
}
