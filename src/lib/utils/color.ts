// Bidirectional progress color scale:
// 0% = red, 50% = orange, 80% = yellow, 100% = green (goal hit)
// 120% = yellow, 150% = orange, 200%+ = red (over goal)
// Stop colors are defined in globals.css as --nutrition-{red,orange,yellow,green}

type RGB = [number, number, number]

function parseCssColor(v: string): RGB | null {
  v = v.trim()
  if (v.startsWith('#') && v.length === 7) {
    const n = parseInt(v.slice(1), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const m = v.match(/\d+/g)
  if (m && m.length >= 3) return [+m[0], +m[1], +m[2]]
  return null
}

function cssRgb(prop: string, fallback: RGB): RGB {
  if (typeof document === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(prop)
  return parseCssColor(v) ?? fallback
}

function colorStops() {
  const red:    RGB = cssRgb('--nutrition-red',    [239,  68,  68])
  const orange: RGB = cssRgb('--nutrition-orange', [249, 115,  22])
  const yellow: RGB = cssRgb('--nutrition-yellow', [234, 179,   8])
  const green:  RGB = cssRgb('--nutrition-green',  [ 34, 197,  94])
  return {
    up:   [[0.00, red], [0.50, orange], [0.80, yellow], [1.00, green]] as [number, RGB][],
    over: [[1.00, green], [1.20, yellow], [1.50, orange], [2.00, red]] as [number, RGB][],
  }
}

function interpolate(stops: [number, RGB][], r: number): string {
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
  const { up, over } = colorStops()
  if (r <= 1) return interpolate(up, r)
  return interpolate(over, Math.min(r, 2))
}
