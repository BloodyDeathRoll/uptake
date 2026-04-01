export function formatCalories(kcal: number | null | undefined): string {
  if (kcal == null) return '—'
  return `${Math.round(kcal).toLocaleString()} kcal`
}

export function formatGrams(g: number | null | undefined, decimals = 1): string {
  if (g == null) return '—'
  return `${g.toFixed(decimals)}g`
}

export function formatMg(mg: number | null | undefined): string {
  if (mg == null) return '—'
  return `${Math.round(mg)}mg`
}

export function formatMl(ml: number | null | undefined): string {
  if (ml == null) return '—'
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)}L`
  return `${Math.round(ml)}ml`
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return { feet, inches }
}

export function ftInToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54)
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10
}
