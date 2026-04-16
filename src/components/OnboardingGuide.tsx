'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Layers, Camera, ChevronRight, Sparkles, ArrowRight, X } from 'lucide-react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const STORAGE_KEY = 'uptake_onboarding_seen'
const ANIM_MS = 280

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

// --- keyframes injected once into the document ---
const KEYFRAMES = `
  @keyframes guide-from-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
  @keyframes guide-from-left  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  @keyframes guide-to-left    { from { transform: translateX(0); } to { transform: translateX(-100%); } }
  @keyframes guide-to-right   { from { transform: translateX(0); } to { transform: translateX(100%); } }
`

function SlidePanel({
  slide,
  role,
  dir,
}: {
  slide: Slide
  role: 'idle' | 'entering' | 'exiting'
  dir: 1 | -1
}) {
  const animName =
    role === 'entering' ? (dir === 1 ? 'guide-from-right' : 'guide-from-left') :
    role === 'exiting'  ? (dir === 1 ? 'guide-to-left'    : 'guide-to-right')  :
    undefined

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '1.25rem',
        padding: '0 1.5rem 0.5rem',
        animation: animName ? `${animName} ${ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards` : undefined,
      }}
    >
      <div className="w-[4.5rem] h-[4.5rem] rounded-2xl flex items-center justify-center shrink-0 bg-[var(--emphasis-bg)] text-[var(--emphasis)]">
        {slide.icon}
      </div>
      <div className="space-y-1.5">
        <h2 className="font-semibold text-base tracking-tight">{slide.title}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{slide.body}</p>
      </div>
    </div>
  )
}

interface Props {
  show: boolean
}

export default function OnboardingGuide({ show }: Props) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [dir, setDir] = useState<1 | -1>(1)
  const animTimer = useRef<ReturnType<typeof setTimeout>>()
  const pointerStartX = useRef<number | null>(null)

  // Inject keyframes once
  useEffect(() => {
    if (document.getElementById('guide-keyframes')) return
    const el = document.createElement('style')
    el.id = 'guide-keyframes'
    el.textContent = KEYFRAMES
    document.head.appendChild(el)
  }, [])

  useEffect(() => {
    if (show && !localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setOpen(true), 600)
      return () => clearTimeout(t)
    }
  }, [show])

  const go = (to: number, d: 1 | -1) => {
    if (to === current) return
    clearTimeout(animTimer.current)
    setDir(d)
    setPrev(current)
    setCurrent(to)
    animTimer.current = setTimeout(() => setPrev(null), ANIM_MS)
  }

  const next = () => { if (current < SLIDES.length - 1) go(current + 1, 1) }
  const back = () => { if (current > 0) go(current - 1, -1) }

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setOpen(false)
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartX.current = e.clientX
  }
  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStartX.current === null) return
    const delta = e.clientX - pointerStartX.current
    if (delta < -50) next()
    else if (delta > 50) back()
    pointerStartX.current = null
  }

  const isLast = current === SLIDES.length - 1

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => { if (!o) dismiss() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-200" />
        <DialogPrimitive.Popup
          aria-label="How to use Uptake"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] sm:max-w-xs -translate-x-1/2 -translate-y-1/2 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-200"
        >
          <div className="bg-card rounded-2xl ring-1 ring-foreground/10 shadow-2xl overflow-hidden select-none">

            {/* X close */}
            <div className="flex justify-end px-4 pt-4">
              <button
                onClick={dismiss}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Slide area — fixed height, clips the animation */}
            <div className="relative overflow-hidden" style={{ height: 220 }}>
              {prev !== null && (
                <SlidePanel key={`prev-${prev}`} slide={SLIDES[prev]} role="exiting" dir={dir} />
              )}
              <SlidePanel
                key={`curr-${current}`}
                slide={SLIDES[current]}
                role={prev !== null ? 'entering' : 'idle'}
                dir={dir}
              />
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-1.5 pt-2 pb-3">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i, i > current ? 1 : -1)}
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

            {/* Footer */}
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
