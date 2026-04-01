'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { OnboardingData } from '../page'
import { GOAL_LABELS, GOAL_DESCRIPTIONS, GOAL_FOCUS_METRICS, type GoalType } from '@/lib/utils/constants'

interface Props {
  onNext: (data: Partial<OnboardingData>) => void
  onBack: () => void
}

const GOALS: GoalType[] = [
  'muscle_gain', 'athlete_cut', 'weight_loss', 'maintenance',
  'recomposition', 'endurance', 'heart_healthy', 'longevity',
  'diabetic', 'recovery', 'custom'
]
const EXTENDED = [GOALS[GOALS.length - 1], ...GOALS, GOALS[0]]

export default function Step3Goal({ onNext, onBack }: Props) {
  const [activeIndex, setActiveIndex] = useState(1)
  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const jumping = useRef(false)

  const realIndex = (activeIndex - 1 + GOALS.length) % GOALS.length
  const displayNum = (i: number) =>
    i === 0 ? GOALS.length : i === EXTENDED.length - 1 ? 1 : i

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

  useEffect(() => { jumpTo(1) }, [jumpTo])

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
      if (closest === 0) jumpTo(GOALS.length)
      else if (closest === EXTENDED.length - 1) jumpTo(1)
      jumping.current = false
    }, 120)
  }

  const handlePrev = () => smoothTo(activeIndex <= 1 ? GOALS.length : activeIndex - 1)
  const handleNext = () => smoothTo(activeIndex >= GOALS.length ? 1 : activeIndex + 1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedGoal) onNext({ goalType: selectedGoal })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your goal</h1>
        <p className="text-muted-foreground mt-1">We'll optimize your targets around this</p>
      </div>

      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex h-full gap-3 overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {EXTENDED.map((goal, i) => {
            const isSelected = selectedGoal === goal
            return (
              <div
                key={`${goal}-${i}`}
                onClick={() => setSelectedGoal(goal)}
                className={`relative snap-start shrink-0 w-full flex flex-col justify-end rounded-2xl cursor-pointer select-none px-8 pb-6 pt-10 transition-colors ${
                  isSelected ? 'bg-neutral-200' : 'bg-neutral-100'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-foreground flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
                    {displayNum(i)} / {GOALS.length}
                  </p>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">{GOAL_LABELS[goal]}</h2>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{GOAL_DESCRIPTIONS[goal]}</p>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">Focus: {GOAL_FOCUS_METRICS[goal]}</p>
                </div>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      </div>

      <div className="flex justify-center items-center gap-1.5">
        {GOALS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === realIndex ? 'w-4 bg-foreground' : 'w-1.5 bg-neutral-300'
            }`}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">Back</Button>
        <Button type="submit" className="flex-1" disabled={!selectedGoal}>Next</Button>
      </div>
    </form>
  )
}
