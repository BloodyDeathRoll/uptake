'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, id, className, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          ref={ref}
          id={id}
          // A space placeholder is required for :placeholder-shown to detect empty state
          placeholder=" "
          className={cn(
            'peer h-11 w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] shadow-[var(--input-shadow)]',
            'px-4 pb-[6px] pt-[18px] text-sm outline-none transition-all',
            'placeholder:opacity-0',
            'focus:border-neutral-300 focus:ring-0',
            'hover:border-[var(--input-border-hover)]',
            'disabled:pointer-events-none disabled:opacity-50',
            'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
            className
          )}
          {...props}
        />
        {/* Label sits AFTER input so Tailwind peer-* selectors work */}
        <label
          htmlFor={id}
          className={cn(
            // Active state (focused or filled): floated up
            'absolute left-4 top-1 text-[10px] font-medium tracking-wide text-muted-foreground',
            'pointer-events-none select-none transition-all duration-200 ease-out',
            // Empty + unfocused: back to center as placeholder
            'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2',
            'peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal',
            'peer-placeholder-shown:text-muted-foreground peer-placeholder-shown:tracking-normal',
            // Override back to floated when focused even if placeholder-shown
            'peer-focus:top-1 peer-focus:translate-y-0',
            'peer-focus:text-[10px] peer-focus:font-medium',
            'peer-focus:text-muted-foreground peer-focus:tracking-wide',
          )}
        >
          {label}
        </label>
      </div>
    )
  }
)

FloatingLabelInput.displayName = 'FloatingLabelInput'

export { FloatingLabelInput }
