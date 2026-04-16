'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Layers, Camera, ChevronRight, Sparkles, ArrowRight, X } from 'lucide-react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const STORAGE_KEY = 'uptake_onboarding_seen'

interface Slide {
  icon: React.ReactNode
  title: string
  body: string
}

const SLIDES: Slide[] = [
  {
    icon: <Sparkles className="w-9 h-9" />,
    title: 'How to Use Uptake',
    body: 'Log meals in 3 different ways. The AI handles the nutrition — you just tell it what you ate.',
  },
  {
    icon: <MessageSquare className="w-9 h-9" />,
    title: 'Free Text',
    body: "Describe your meal in plain language. The AI estimates quantities if you don't include them. Edit any ingredient and it learns from your corrections.",
  },
  {
    icon: <Layers className="w-9 h-9" />,
    title: 'By Ingredient',
    body: 'Add ingredients one by one. Tap the quantity for a 100g / 100ml baseline, then adjust to match your actual portion.',
  },
  {
    icon: <Camera className="w-9 h-9" />,
    title: 'By Photo',
    body: 'Take a picture of your meal and let the AI identify what it sees. Correct it and it gets smarter every time.',
  },
]

interface Props {
  /** Pass true when the user has no meals logged yet */
  show: boolean
}

export default function OnboardingGuide({ show }: Props) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (show && typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setOpen(true), 600)
      return () => clearTimeout(t)
    }
  }, [show])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setOpen(false)
  }

  const next = () => setCurrent(c => Math.min(c + 1, SLIDES.length - 1))

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta < -50) next()
    else if (delta > 50) setCurrent(c => Math.max(c - 1, 0))
    touchStartX.current = null
  }

  const isLast = current === SLIDES.length - 1
  const slide = SLIDES[current]

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => { if (!o) dismiss() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-200" />
        <DialogPrimitive.Popup
          aria-label="How to use Uptake"
          className="fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] sm:max-w-xs -translate-x-1/2 -translate-y-1/2 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-200"
        >
          <div
            className="bg-card rounded-2xl ring-1 ring-foreground/10 shadow-2xl overflow-hidden select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >

            {/* X close button */}
            <div className="flex justify-end px-4 pt-4 pb-0">
              <button
                onClick={dismiss}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Slide body */}
            <div className="px-6 pt-4 pb-4 flex flex-col items-center text-center gap-5 min-h-[200px]">
              <div
                key={current}
                className="contents animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="w-[4.5rem] h-[4.5rem] rounded-2xl flex items-center justify-center shrink-0 bg-[var(--emphasis-bg)] text-[var(--emphasis)]">
                  {slide.icon}
                </div>
                <div className="space-y-1.5">
                  <h2 className="font-semibold text-base tracking-tight">{slide.title}</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">{slide.body}</p>
                </div>
              </div>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 pt-1 pb-3">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === current
                      ? 'w-5 bg-[var(--emphasis)]'
                      : 'w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/40'
                  )}
                />
              ))}
            </div>

            {/* Footer nav */}
            <div className="px-5 pb-5 pt-1">
              {isLast ? (
                <Link href="/meal/new" onClick={dismiss} className="block">
                  <Button className="w-full gap-1.5">
                    Log my first meal
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Button onClick={next} className="w-full gap-1">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>

          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
