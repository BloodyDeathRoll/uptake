'use client'

import UseAnimations from 'react-useanimations'
import loading2 from 'react-useanimations/lib/loading2'
import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: number
  className?: string
  strokeColor?: string
}

export default function Spinner({ size = 20, className, strokeColor }: SpinnerProps) {
  return (
    <span className={cn('inline-flex items-center justify-center', className)}>
      <UseAnimations
        animation={loading2}
        size={size}
        autoplay
        loop
        strokeColor={strokeColor ?? 'currentColor'}
      />
    </span>
  )
}
