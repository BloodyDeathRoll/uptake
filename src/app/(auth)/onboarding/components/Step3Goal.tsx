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
          className="absolute inset-0 flex gap-3 overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {EXTENDED.map((goal, i) => {
            const isSelected = selectedGoal === goal
            const imgIndex = GOALS.indexOf(goal) + 1
            return (
              <div
                key={`${goal}-${i}`}
                onClick={() => setSelectedGoal(goal)}
                className={`relative snap-start shrink-0 w-full h-full flex flex-col rounded-2xl cursor-pointer select-none overflow-hidden transition-colors ${
                  isSelected ? 'bg-primary/80' : 'bg-primary'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-foreground flex items-center justify-center z-10">
                    <Check className="w-2.5 h-2.5 text-primary" />
                  </div>
                )}
                {/* Illustration — fills all space above text */}
                <div className="flex-1 flex items-center justify-center p-6 min-h-0">
                  <img
                    src={`/onboarding_svgs/goals_${imgIndex}.svg?v=3`}
                    alt=""
                    className="max-h-full max-w-full object-contain invert opacity-90"
                  />
                </div>
                {/* Text — pinned to bottom */}
                <div className="shrink-0 px-6 pb-6">
                  <p className="text-[10px] font-medium text-primary-foreground/60 uppercase tracking-widest mb-1">
                    {displayNum(i)} / {GOALS.length}
                  </p>
                  <h2 className="text-base font-bold tracking-tight text-primary-foreground leading-tight">{GOAL_LABELS[goal]}</h2>
                  <p className="text-primary-foreground/70 mt-1 text-sm leading-relaxed">{GOAL_DESCRIPTIONS[goal]}</p>
                  <p className="text-[10px] text-primary-foreground/60 mt-1 font-medium">Focus: {GOAL_FOCUS_METRICS[goal]}</p>
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
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">Back</Button>
        <Button type="submit" className="flex-1" disabled={!selectedGoal}>Finalize</Button>
      </div>
    </form>
  )
}
