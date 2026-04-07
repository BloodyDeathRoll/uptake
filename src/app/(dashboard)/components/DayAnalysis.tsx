'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n'
import { Sparkles, TrendingDown, TrendingUp, Minus, ChevronRight, Zap, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

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

interface QualitySignal {
  label: string
  status: 'good' | 'watch' | 'concern'
  note: string
  priority: 'immediate' | 'important' | 'good_to_have'
}

interface Analysis {
  headline: string
  next_best_action: NextBestAction
  body_state: string
  macros: MacroResult[]
  recommendations: string[]
  quality_signals?: QualitySignal[]
}

interface QualityMetrics {
  fiber_g: number
  sugar_g: number
  saturated_fat_g: number
  sodium_mg: number
}

interface Props {
  consumed: { calories: number; protein: number; carbs: number; fat: number }
  targets: { calories: number; protein: number; carbs: number; fat: number }
  goalType: string
  days: number
  isCurrentPeriod: boolean
  quality?: QualityMetrics
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

function qualitySignalStyle(status: QualitySignal['status']) {
  if (status === 'good')    return { color: 'text-emerald-500', bg: 'bg-emerald-500/8 border-emerald-500/20', icon: <CheckCircle2 className="w-4 h-4 shrink-0" /> }
  if (status === 'concern') return { color: 'text-red-500',     bg: 'bg-red-500/8 border-red-500/20',         icon: <AlertTriangle  className="w-4 h-4 shrink-0" /> }
  return                           { color: 'text-amber-500',   bg: 'bg-amber-500/8 border-amber-500/20',     icon: <Info           className="w-4 h-4 shrink-0" /> }
}

export default function DayAnalysis({ consumed, targets, goalType, days, isCurrentPeriod, quality }: Props) {
  const { t } = useLanguage()
  const PRIORITY_LABEL: Record<QualitySignal['priority'], string> = {
    immediate:    t.act_now,
    important:    t.important,
    good_to_have: t.nice_to_have,
  }
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
        body: JSON.stringify({ consumed, targets, goalType, days, hourOfDay: new Date().getHours(), isCurrentPeriod, quality }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed')
      setAnalysis(json.analysis)
    } catch {
      setError(t.analysis_error)
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
        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border transition-colors"
        aria-label={t.analysis_aria}
      >
        <Sparkles className="w-3 h-3" />
        {t.analysis_btn}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-none w-[min(92vw,80rem)] max-h-[88dvh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-5 pb-3 md:px-10">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              {t.nutrition_analysis}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 md:px-10 pb-8">
            {loading && (
              <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                <span className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">{t.analyzing_nutrition}</span>
              </div>
            )}

            {error && (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-destructive">{error}</p>
                <button onClick={fetchAnalysis} className="text-sm text-accent underline underline-offset-4">
                  {t.try_again}
                </button>
              </div>
            )}

            {analysis && !loading && (
              <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-10">

                {/* Left — headline + body state + macro breakdown */}
                <div className="space-y-5">
                  <p className="font-normal text-base leading-snug">{analysis.headline}</p>

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
                  {isCurrentPeriod && analysis.next_best_action?.label && (
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

                  {isCurrentPeriod && analysis.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What to do</h3>
                      {analysis.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-card">
                          <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                          <p className="text-sm leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {analysis.quality_signals && analysis.quality_signals.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nutrition quality</h3>
                      {analysis.quality_signals
                        .sort((a, b) => {
                          const order = { immediate: 0, important: 1, good_to_have: 2 }
                          return order[a.priority] - order[b.priority]
                        })
                        .map((sig, i) => {
                          const style = qualitySignalStyle(sig.status)
                          return (
                            <div key={i} className={`flex gap-3 items-start p-3 rounded-xl border ${style.bg}`}>
                              <div className={`mt-0.5 ${style.color}`}>{style.icon}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium">{sig.label}</span>
                                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${style.bg} ${style.color}`}>
                                    {PRIORITY_LABEL[sig.priority]}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{sig.note}</p>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
