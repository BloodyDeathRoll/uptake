'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function isPwa(): boolean {
  if (typeof window === 'undefined') return false
  // iOS Safari standalone
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true
  // Android / desktop Chrome
  return window.matchMedia('(display-mode: standalone)').matches
}

/**
 * Invisible component: if the user opens the app in PWA mode and already has
 * a valid session, redirect them straight to the dashboard and skip the landing page.
 *
 * Calls `onReady` once the check is done so the parent can un-hide the page.
 */
export default function PwaRedirect({ onReady }: { onReady: () => void }) {
  const router = useRouter()

  useEffect(() => {
    if (!isPwa()) {
      onReady()
      return
    }

    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard')
        // don't call onReady — keep the screen blank while navigating
      } else {
        onReady()
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
