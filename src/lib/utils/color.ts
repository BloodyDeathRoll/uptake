// Multi-stop color scale: green → amber → orange → coral
// Matches Anthropic's usage bar color logic (0% = green, 100%+ = coral)
const STOPS: [number, [number, number, number]][] = [
  [0.00, [126, 200, 160]], // #7EC8A0 green
  [0.50, [245, 185,  66]], // #F5B942 amber
  [0.80, [240, 120,  64]], // #F07840 orange
  [1.00, [239,  95,  95]], // #EF5F5F coral
]

export function nutritionColor(ratio: number): string {
  const r = Math.max(0, ratio)
  for (let i = STOPS.length - 2; i >= 0; i--) {
    if (r >= STOPS[i][0]) {
      const t = Math.min((r - STOPS[i][0]) / (STOPS[i + 1][0] - STOPS[i][0]), 1)
      const [c1, c2] = [STOPS[i][1], STOPS[i + 1][1]]
      return `rgb(${Math.round(c1[0] + (c2[0] - c1[0]) * t)},${Math.round(c1[1] + (c2[1] - c1[1]) * t)},${Math.round(c1[2] + (c2[2] - c1[2]) * t)})`
    }
  }
  return `rgb(${STOPS[0][1].join(',')})`
}
