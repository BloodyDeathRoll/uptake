'use client'

import { useState } from 'react'
import { Sparkles, TrendingDown, TrendingUp, Minus, ChevronRight, Zap } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'

interface MacroResult {
  name: string
  pct: number
  status: 'under' | 'over' | 'on_track'
  impact: string
}

interface NextBestAction {
  nutrient: string
  label: string
}

interface Analysis {
  headline: string
  next_best_action: NextBestAction
  body_state: string
  macros: MacroResult[]
  recommendations: string[]
}

interface Props {
  consumed: { calories: number; protein: number; carbs: number; fat: number }
  targets: { calories: number; protein: number; carbs: number; fat: number }
  goalType: string
  days: number
}

function statusIcon(status: MacroResult['status']) {
  if (status === 'under') return <TrendingDown className="w-4 h-4 shrink-0" />
  if (status === 'over')  return <TrendingUp   className="w-4 h-4 shrink-0" />
  return <Minus className="w-4 h-4 shrink-0" />
}

function statusColor(status: MacroResult['status']) {
  if (status === 'under') return 'text-amber-500'
  if (status === 'over')  return 'text-red-500'
  return 'text-emerald-500'
}

export default function DayAnalysis({ consumed, targets, goalType, days }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/analyze-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consumed, targets, goalType, days }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed')
      setAnalysis(json.analysis)
    } catch {
      setError("Couldn't generate analysis right now. Try again in a moment.")
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setOpen(true)
    if (!analysis) fetchAnalysis()
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Analyze today's nutrition"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Analysis
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85dvh] overflow-y-auto pb-safe">
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Nutrition Analysis
            </SheetTitle>
          </SheetHeader>

          <div className="max-w-7xl mx-auto px-6 md:px-10 pb-10">
            {loading && (
              <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                <span className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Analyzing your nutrition…</span>
              </div>
            )}

            {error && (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-destructive">{error}</p>
                <button onClick={fetchAnalysis} className="text-sm text-accent underline underline-offset-4">
                  Try again
                </button>
              </div>
            )}

            {analysis && !loading && (
              <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-10">

                {/* Left — headline + body state + macro breakdown */}
                <div className="space-y-5">
                  <p className="font-semibold text-base leading-snug">{analysis.headline}</p>

                  <div className="p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground leading-relaxed">
                    {analysis.body_state}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Macro breakdown</h3>
                    {analysis.macros.map(macro => (
                      <div key={macro.name} className="flex gap-3 items-start p-3 rounded-xl bg-card">
                        <div className={`mt-0.5 ${statusColor(macro.status)}`}>
                          {statusIcon(macro.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{macro.name}</span>
                            <span className={`text-xs font-mono ${statusColor(macro.status)}`}>{macro.pct}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{macro.impact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right — priority callout + recommendations */}
                <div className="space-y-5">
                  {analysis.next_best_action && (
                    <div className="flex gap-3 items-start p-4 rounded-xl bg-primary/8 border border-primary/20">
                      <Zap className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                          Focus on {analysis.next_best_action.nutrient}
                        </span>
                        <p className="text-sm mt-1 leading-relaxed">{analysis.next_best_action.label}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What to do</h3>
                    {analysis.recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-card">
                        <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                        <p className="text-sm leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
