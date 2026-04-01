import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-base shadow-[var(--input-shadow)] placeholder:text-muted-foreground hover:border-[var(--input-border-hover)] focus-visible:outline-none focus-visible:border-neutral-300 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
