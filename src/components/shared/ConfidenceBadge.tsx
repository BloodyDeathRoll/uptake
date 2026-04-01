'use client'

import { Badge } from '@/components/ui/badge'

interface Props {
  confidence: 'high' | 'medium' | 'low' | null
  showLabel?: boolean
}

const CONFIG = {
  high:   { label: 'High confidence',   className: 'bg-neutral-500/15 text-neutral-600 border-neutral-500/30 dark:text-neutral-400' },
  medium: { label: 'Medium confidence', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400' },
  low:    { label: 'Low confidence',    className: 'bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400' },
}

export default function ConfidenceBadge({ confidence, showLabel = true }: Props) {
  if (!confidence) return null
  const { label, className } = CONFIG[confidence]
  return (
    <Badge variant="outline" className={`text-[10px] font-medium px-1.5 py-0.5 ${className}`}>
      {showLabel ? label : '●'}
    </Badge>
  )
}
