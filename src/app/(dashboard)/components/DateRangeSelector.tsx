'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import { useLanguage } from '@/lib/i18n'

export interface DateRange {
  start: string
  end: string
  days: number
}

type Mode = 'day' | '7d' | '30d' | 'custom'

function localToday(): string {
  return new Date().toLocaleDateString('en-CA')
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d + n)
  return date.toLocaleDateString('en-CA')
}

function daysBetween(start: string, end: string): number {
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const ms = new Date(ey, em - 1, ed).getTime() - new Date(sy, sm - 1, sd).getTime()
  return Math.max(Math.round(ms / 86400000) + 1, 1)
}

function shortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7)
}

function prevYearMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

function nextYearMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

function getMonthDays(ym: string): { date: string; isCurrentMonth: boolean }[] {
  const [y, m] = ym.split('-').map(Number)
  const firstDate = `${y}-${String(m).padStart(2, '0')}-01`
  const firstDow = new Date(y, m - 1, 1).getDay() // 0=Sun
  const daysInMonth = new Date(y, m, 0).getDate()
  const result: { date: string; isCurrentMonth: boolean }[] = []

  for (let i = firstDow; i > 0; i--) {
    result.push({ date: addDays(firstDate, -i), isCurrentMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    result.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, isCurrentMonth: true })
  }
  const lastDate = `${y}-${String(m).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
  let t = 1
  while (result.length < 42) {
    result.push({ date: addDays(lastDate, t++), isCurrentMonth: false })
  }
  return result
}

interface Props {
  onChange: (range: DateRange) => void
  initialDate?: string
}

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function DateRangeSelector({ onChange, initialDate }: Props) {
  const { t, lang } = useLanguage()
  const rtl = lang === 'he'
  const TABS = [
    { key: 'day' as Mode, label: t.filter_day },
    { key: '7d' as Mode, label: t.filter_7d },
    { key: '30d' as Mode, label: t.filter_30d },
    { key: 'custom' as Mode, label: t.filter_custom },
  ]
  const today = localToday()
  const [mode, setMode] = useState<Mode>('day')
  const [dayDate, setDayDate] = useState(initialDate ?? today)
  const [customStart, setCustomStart] = useState(addDays(today, -6))
  const [customEnd, setCustomEnd] = useState(today)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(getYearMonth(today))
  const [pendingStart, setPendingStart] = useState<string | null>(null)
  const mounted = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setCalendarOpen(false)
        setPendingStart(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const computeRange = (m: Mode, dd: string, cs: string, ce: string): DateRange => {
    if (m === 'day') return { start: dd, end: dd, days: 1 }
    if (m === '7d') return { start: addDays(today, -6), end: today, days: 7 }
    if (m === '30d') return { start: addDays(today, -29), end: today, days: 30 }
    return { start: cs, end: ce, days: daysBetween(cs, ce) }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    onChange(computeRange(mode, dayDate, customStart, customEnd))
  }, [mode, dayDate, customStart, customEnd])

  const selectMode = (m: Mode) => {
    setMode(m)
    if (m === 'custom') {
      setCalendarMonth(getYearMonth(customEnd))
      setPendingStart(null)
      setCalendarOpen(true)
    } else {
      setCalendarOpen(false)
    }
  }

  const handleDayClick = (date: string) => {
    if (date > today) return
    if (pendingStart === null) {
      setPendingStart(date)
    } else {
      const start = date < pendingStart ? date : pendingStart
      const end = date < pendingStart ? pendingStart : date
      setCustomStart(start)
      setCustomEnd(end)
      setPendingStart(null)
      setCalendarOpen(false)
    }
  }

  const dateLabel = () => {
    if (mode === 'day') return formatDate(dayDate)
    if (mode === '7d') return `${shortDate(addDays(today, -6))} – ${shortDate(today)}`
    if (mode === '30d') return `${shortDate(addDays(today, -29))} – ${shortDate(today)}`
    if (customStart === customEnd) return shortDate(customStart)
    return `${shortDate(customStart)} – ${shortDate(customEnd)}`
  }

  // Calendar
  const [calY, calM] = calendarMonth.split('-').map(Number)
  const monthLabel = new Date(calY, calM - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const calDays = getMonthDays(calendarMonth)

  const getDayState = (date: string) => {
    const isFuture = date > today
    const isToday = date === today
    if (pendingStart) {
      return { isEdge: date === pendingStart, inRange: false, isToday, isFuture }
    }
    const isEdge = date === customStart || date === customEnd
    const inRange = customStart !== customEnd && date > customStart && date < customEnd
    return { isEdge, inRange, isToday, isFuture }
  }

  return (
    <div ref={containerRef} className="relative w-full md:w-auto">
      <div className="flex items-center justify-between gap-3 h-8">

        {/* Start: date label + chevrons (direction-aware) */}
        <div className="flex items-center gap-0.5 min-w-0 h-full">
          {mode === 'day' && (
            <button
              onClick={() => setDayDate(prev => addDays(prev, rtl ? 1 : -1))}
              className="w-7 h-full flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-xs text-muted-foreground select-none px-1 truncate leading-none">
            {dateLabel()}
          </span>
          {mode === 'day' && dayDate !== today && (
            <button
              onClick={() => setDayDate(prev => addDays(prev, rtl ? -1 : 1))}
              className="w-7 h-full flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
          {mode === 'custom' && (
            <button
              onClick={() => { setCalendarOpen(o => !o); setPendingStart(null) }}
              className="w-7 h-full flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-90" />
            </button>
          )}
        </div>

        {/* Right: mode tabs */}
        <div className="flex items-center gap-1 flex-shrink-0 h-full">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => selectMode(key)}
              className={`h-full px-2 text-xs font-medium transition-colors ${
                mode === key
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom calendar popover */}
      {calendarOpen && mode === 'custom' && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-card rounded-xl shadow-[0_0_2px_0_rgba(0,0,0,0.1)] p-4 w-72">

          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCalendarMonth(prevYearMonth)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-foreground">{monthLabel}</span>
            <button
              onClick={() => setCalendarMonth(nextYearMonth)}
              disabled={calendarMonth >= getYearMonth(today)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-default"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DOW.map(d => (
              <div key={d} className="text-center text-[10px] font-medium text-neutral-400 py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {calDays.map(({ date, isCurrentMonth }, idx) => {
              const { isEdge, inRange, isToday, isFuture } = getDayState(date)
              const [, , dd] = date.split('-').map(Number)
              const inactive = !isCurrentMonth || isFuture

              return (
                <button
                  key={idx}
                  onClick={() => !inactive && handleDayClick(date)}
                  className={[
                    'h-8 w-full text-xs font-medium rounded-lg transition-colors',
                    inactive ? 'text-muted-foreground/30 cursor-default' : 'cursor-pointer',
                    isEdge ? 'bg-primary text-primary-foreground' : '',
                    inRange && !isEdge ? 'bg-muted rounded-none' : '',
                    !isEdge && !inRange && !inactive ? 'hover:bg-muted' : '',
                    isToday && !isEdge ? 'font-bold text-foreground' : '',
                  ].filter(Boolean).join(' ')}
                >
                  {dd}
                </button>
              )
            })}
          </div>

          {pendingStart && (
            <p className="text-[10px] text-muted-foreground text-center mt-3">Now select an end date</p>
          )}
        </div>
      )}
    </div>
  )
}
