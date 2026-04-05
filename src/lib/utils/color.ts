// Bidirectional progress color scale:
// 0% = red, 50% = orange, 80% = yellow, 100% = green (goal hit)
// 120% = yellow, 150% = orange, 200%+ = red (over goal)

const STOPS_UP: [number, [number, number, number]][] = [
  [0.00, [239,  68,  68]], // red
  [0.50, [249, 115,  22]], // orange
  [0.80, [234, 179,   8]], // yellow
  [1.00, [ 34, 197,  94]], // green
]

const STOPS_OVER: [number, [number, number, number]][] = [
  [1.00, [ 34, 197,  94]], // green
  [1.20, [234, 179,   8]], // yellow
  [1.50, [249, 115,  22]], // orange
  [2.00, [239,  68,  68]], // red
]

function interpolate(stops: [number, [number, number, number]][], r: number): string {
  for (let i = stops.length - 2; i >= 0; i--) {
    if (r >= stops[i][0]) {
      const t = Math.min((r - stops[i][0]) / (stops[i + 1][0] - stops[i][0]), 1)
      const [c1, c2] = [stops[i][1], stops[i + 1][1]]
      return `rgb(${Math.round(c1[0] + (c2[0] - c1[0]) * t)},${Math.round(c1[1] + (c2[1] - c1[1]) * t)},${Math.round(c1[2] + (c2[2] - c1[2]) * t)})`
    }
  }
  return `rgb(${stops[0][1].join(',')})`
}

export function nutritionColor(ratio: number): string {
  const r = Math.max(0, ratio)
  if (r <= 1) return interpolate(STOPS_UP, r)
  return interpolate(STOPS_OVER, Math.min(r, 2))
}
