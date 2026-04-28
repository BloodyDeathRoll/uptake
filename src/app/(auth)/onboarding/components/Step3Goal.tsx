'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { OnboardingData } from '../page'
import type { GoalType } from '@/lib/utils/constants'
import { useLanguage, type Translations } from '@/lib/i18n'

interface Props {
  onNext: (data: Partial<OnboardingData>) => void
  onBack: () => void
}

const GOALS: GoalType[] = [
  'muscle_gain', 'athlete_cut', 'weight_loss', 'maintenance',
  'recomposition', 'endurance', 'heart_healthy', 'longevity',
  'diabetic', 'recovery'
]

export default function Step3Goal({ onNext, onBack }: Props) {
  const { lang, t } = useLanguage()
  const isRTL = lang === 'he'
  const goalLabel = (g: string) => (t[('goalLabel_' + g) as keyof Translations] as string) ?? g
  const goalDesc  = (g: string) => (t[('goalDesc_'  + g) as keyof Translations] as string) ?? g
  const goalFocus = (g: string) => (t[('goalFocus_' + g) as keyof Translations] as string) ?? g
  const n = GOALS.length
  const workGoals = isRTL ? ([...GOALS].reverse() as GoalType[]) : GOALS
  const extended = [workGoals[n - 1], ...workGoals, workGoals[0]] as GoalType[]
  const [activeIndex, setActiveIndex] = useState(isRTL ? n : 1)
  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const jumping = useRef(false)

  const physicalRealIndex = (activeIndex - 1 + n) % n
  const realIndex = isRTL ? n - 1 - physicalRealIndex : physicalRealIndex
  const displayNum = (i: number) => {
    const ltr = i === 0 ? n : i === extended.length - 1 ? 1 : i
    return isRTL ? n + 1 - ltr : ltr
  }

  const jumpTo = useCallback((extIndex: number) => {
    if (!scrollRef.current) return
    const card = scrollRef.current.children[extIndex] as HTMLElement
    scrollRef.current.scrollLeft = card.offsetLeft
    setActiveIndex(extIndex)
  }, [])

  const smoothTo = useCallback((extIndex: number) => {
    if (!scrollRef.current) return
    const card = scrollRef.current.children[extIndex] as HTMLElement
    scrollRef.current.scrollTo({ left: card.offsetLeft, behavior: 'smooth' })
    setActiveIndex(extIndex)
  }, [])

  useEffect(() => { jumpTo(isRTL ? n : 1) }, [jumpTo, isRTL, n])

  const handleScroll = () => {
    if (jumping.current || !scrollRef.current) return
    const { scrollLeft } = scrollRef.current
    const cards = Array.from(scrollRef.current.children) as HTMLElement[]
    let closest = 1
    let minDist = Infinity
    cards.forEach((card, i) => {
      const dist = Math.abs((card as HTMLElement).offsetLeft - scrollLeft)
      if (dist < minDist) { minDist = dist; closest = i }
    })
    setActiveIndex(closest)

    clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => {
      if (!scrollRef.current) return
      jumping.current = true
      if (closest === 0) jumpTo(n)
      else if (closest === extended.length - 1) jumpTo(1)
      jumping.current = false
    }, 120)
  }

  const handlePrev = () => smoothTo(activeIndex <= 1 ? n : activeIndex - 1)
  const handleNext = () => smoothTo(activeIndex >= n ? 1 : activeIndex + 1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedGoal) onNext({ goalType: selectedGoal })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.your_goal}</h1>
        <p className="text-muted-foreground mt-1">{t.goal_subtitle}</p>
      </div>

      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          dir="ltr"
          className="absolute inset-0 flex gap-3 overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {extended.map((goal, i) => {
            const isSelected = selectedGoal === goal
            const imgIndex = GOALS.indexOf(goal) + 1
            return (
              <div
                key={`${goal}-${i}`}
                onClick={() => setSelectedGoal(prev => prev === goal ? null : goal)}
                className={`relative snap-start shrink-0 w-full h-full flex flex-col rounded-2xl cursor-pointer select-none overflow-hidden transition-colors ${
                  isSelected ? 'bg-[#C8BCAE]' : 'bg-white'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center z-10">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                {/* Illustration — fills all space above text */}
                <div className="flex-1 flex items-center justify-center p-6 min-h-0">
                  <img
                    src={`/onboarding_svgs/goals_${imgIndex}.svg?v=3`}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                {/* Text — pinned to bottom */}
                <div dir="auto" className="shrink-0 px-6 pb-6">
                  <p className="text-[10px] font-medium text-black/60 uppercase tracking-widest mb-1">
                    {displayNum(i)} / {GOALS.length}
                  </p>
                  <h2 className="text-base font-bold tracking-tight text-black leading-tight">{goalLabel(goal)}</h2>
                  <p className="text-black/70 mt-1 text-sm leading-relaxed">{goalDesc(goal)}</p>
                  <p className="text-[10px] text-black/60 mt-1 font-medium">{t.focus_prefix}{goalFocus(goal)}</p>
                </div>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/20 hover:bg-black/30 shadow-sm transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-primary-foreground" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/20 hover:bg-black/30 shadow-sm transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5 text-primary-foreground" />
        </button>
      </div>

      <div className="flex justify-center items-center gap-1.5 shrink-0">
        {GOALS.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === realIndex ? 'w-3 bg-foreground' : 'w-1 bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      <div className="flex gap-3 shrink-0">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">{t.back}</Button>
        <Button type="submit" className="flex-1" disabled={!selectedGoal}>{t.finalize}</Button>
      </div>
    </form>
  )
}
