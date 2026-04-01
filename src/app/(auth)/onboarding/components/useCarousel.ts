import { useRef, useState, useEffect, useCallback } from 'react'

export function useCarousel<T extends string>(items: readonly T[]) {
  const extended = [items[items.length - 1], ...items, items[0]] as T[]
  const [activeIndex, setActiveIndex] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>()
  const jumping = useRef(false)

  const realIndex = (activeIndex - 1 + items.length) % items.length

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
      const dist = Math.abs(card.offsetLeft - scrollLeft)
      if (dist < minDist) { minDist = dist; closest = i }
    })
    setActiveIndex(closest)

    clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => {
      if (!scrollRef.current) return
      jumping.current = true
      if (closest === 0) jumpTo(items.length)
      else if (closest === extended.length - 1) jumpTo(1)
      jumping.current = false
    }, 120)
  }

  const handlePrev = () => smoothTo(activeIndex <= 1 ? items.length : activeIndex - 1)
  const handleNext = () => smoothTo(activeIndex >= items.length ? 1 : activeIndex + 1)
  const displayNum = (i: number) =>
    i === 0 ? items.length : i === extended.length - 1 ? 1 : i

  return { extended, activeIndex, realIndex, scrollRef, handleScroll, handlePrev, handleNext, displayNum }
}
