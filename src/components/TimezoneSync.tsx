'use client'

import { useEffect } from 'react'

export default function TimezoneSync() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    document.cookie = `tz=${tz}; path=/; max-age=31536000; SameSite=Lax`
  }, [])

  return null
}
