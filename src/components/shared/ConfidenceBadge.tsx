'use client'

import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/i18n'

interface Props {
  confidence: 'high' | 'medium' | 'low' | null
  showLabel?: boolean
}

const CLASSES = {
  high:   'bg-neutral-500/15 text-neutral-600 border-neutral-500/30 dark:text-neutral-400',
  medium: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400',
  low:    'bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400',
}

export default function ConfidenceBadge({ confidence, showLabel = true }: Props) {
  const { t } = useLanguage()
  if (!confidence) return null
  const labelMap = { high: t.confidence_high, medium: t.confidence_medium, low: t.confidence_low }
  return (
    <Badge variant="outline" className={`text-[10px] font-medium px-1.5 py-0.5 ${CLASSES[confidence]}`}>
      {showLabel ? labelMap[confidence] : '●'}
    </Badge>
  )
}
