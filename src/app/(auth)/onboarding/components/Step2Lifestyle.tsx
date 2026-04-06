'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { OnboardingData } from '../page'
import { ACTIVITY_LABELS, ACTIVITY_DESCRIPTIONS, type ActivityLevel } from '@/lib/utils/constants'
import { GOAL_LABELS, GOAL_DESCRIPTIONS, GOAL_FOCUS_METRICS, type GoalType } from '@/lib/utils/constants'
import { useCarousel } from './useCarousel'

interface Props {
  onNext: (data: Partial<OnboardingData>) => void
  onBack: () => void
}

const LEVELS = ['sedentary', 'light', 'moderate', 'very_active', 'athlete'] as const
const GOALS = [
  'muscle_gain', 'athlete_cut', 'weight_loss', 'maintenance',
  'recomposition', 'endurance', 'heart_healthy', 'longevity',
  'diabetic', 'recovery', 'custom',
] as const

function CarouselDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <div className="flex justify-center items-center gap-1.5 shrink-0 py-[10px]">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-3 bg-foreground' : 'w-1 bg-muted-foreground/30'}`} />
      ))}
    </div>
  )
}

export default function Step2Lifestyle({ onNext, onBack }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<ActivityLevel | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(null)

  const activity = useCarousel(LEVELS)
  const goal = useCarousel(GOALS)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedLevel && selectedGoal) onNext({ activityLevel: selectedLevel, goalType: selectedGoal })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your lifestyle</h1>
        <p className="text-muted-foreground mt-1">Activity and goals</p>
      </div>

      <div className="flex flex-col gap-4 pb-4">

      {/* Activity carousel */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-[550] text-foreground shrink-0">Activity level</p>
        <div className="relative h-36">
          <div
            ref={activity.scrollRef}
            onScroll={activity.handleScroll}
            className="absolute inset-0 flex gap-3 overflow-x-auto snap-x snap-mandatory px-1 -mx-1 py-2 -my-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {activity.extended.map((level, i) => {
              const isSelected = selectedLevel === level
              const imgIndex = LEVELS.indexOf(level as ActivityLevel) + 1
              return (
                <div
                  key={`${level}-${i}`}
                  onClick={() => setSelectedLevel(level as ActivityLevel)}
                  className={`relative snap-start shrink-0 w-full h-full flex flex-row rounded-2xl cursor-pointer select-none overflow-hidden transition-colors shadow-[0px_0px_3px_0px_rgba(0,0,0,0.2)] ${isSelected ? 'bg-muted' : 'bg-card'}`}
                >
                  {/* Illustration */}
                  <div className="w-2/5 shrink-0 flex items-center justify-center p-3">
                    <img
                      src={`/onboarding_svgs/activity_level_${imgIndex}.svg`}
                      alt=""
                      width={120}
                      height={120}
                      className="h-full w-full object-contain invert"
                    />
                  </div>
                  {/* Text — vertically centred */}
                  <div className="flex-1 flex flex-col justify-center pr-4 py-3 min-w-0">
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
                      {activity.displayNum(i)} / {LEVELS.length}
                    </p>
                    <h2 className="text-base font-bold tracking-tight text-foreground leading-tight">{ACTIVITY_LABELS[level as ActivityLevel]}</h2>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{ACTIVITY_DESCRIPTIONS[level as ActivityLevel]}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <button type="button" onClick={activity.handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-muted/80 hover:bg-muted shadow-sm transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 text-foreground" />
          </button>
          <button type="button" onClick={activity.handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-muted/80 hover:bg-muted shadow-sm transition-colors">
            <ChevronRight className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>
        <CarouselDots count={LEVELS.length} activeIndex={activity.realIndex} />
      </div>

      {/* Goal carousel */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-[550] text-foreground shrink-0">Goal</p>
        <div className="relative h-36">
          <div
            ref={goal.scrollRef}
            onScroll={goal.handleScroll}
            className="absolute inset-0 flex gap-3 overflow-x-auto snap-x snap-mandatory px-1 -mx-1 py-2 -my-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {goal.extended.map((g, i) => {
              const isSelected = selectedGoal === g
              const imgIndex = GOALS.indexOf(g as GoalType) + 1
              return (
                <div
                  key={`${g}-${i}`}
                  onClick={() => setSelectedGoal(g as GoalType)}
                  className={`relative snap-start shrink-0 w-full h-full flex flex-row rounded-2xl cursor-pointer select-none overflow-hidden transition-colors shadow-[0px_0px_3px_0px_rgba(0,0,0,0.2)] ${isSelected ? 'bg-muted' : 'bg-card'}`}
                >
                  {/* Illustration */}
                  <div className="w-2/5 shrink-0 flex items-center justify-center p-3">
                    <img
                      src={`/onboarding_svgs/goals_${imgIndex}.svg`}
                      alt=""
                      width={120}
                      height={120}
                      className="h-full w-full object-contain invert"
                    />
                  </div>
                  {/* Text — vertically centred */}
                  <div className="flex-1 flex flex-col justify-center pr-4 py-3 min-w-0">
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
                      {goal.displayNum(i)} / {GOALS.length}
                    </p>
                    <h2 className="text-base font-bold tracking-tight text-foreground leading-tight">{GOAL_LABELS[g as GoalType]}</h2>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{GOAL_DESCRIPTIONS[g as GoalType]}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">Focus: {GOAL_FOCUS_METRICS[g as GoalType]}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <button type="button" onClick={goal.handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-muted/80 hover:bg-muted shadow-sm transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 text-foreground" />
          </button>
          <button type="button" onClick={goal.handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-muted/80 hover:bg-muted shadow-sm transition-colors">
            <ChevronRight className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>
        <CarouselDots count={GOALS.length} activeIndex={goal.realIndex} />
      </div>

      </div>

      <div className="flex gap-3 shrink-0">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">Back</Button>
        <Button type="submit" className="flex-1" disabled={!selectedLevel || !selectedGoal}>Next</Button>
      </div>
    </form>
  )
}
