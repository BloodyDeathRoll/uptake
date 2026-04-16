'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import PwaRedirect from './PwaRedirect'

export default function LandingPage() {
  const [ready, setReady] = useState(false)

  return (
    <>
      <PwaRedirect onReady={() => setReady(true)} />

      {ready && (
        <div className="min-h-screen bg-background flex flex-col">

          {/* Nav */}
          <header className="px-6 h-14 flex items-center justify-between">
            <span className="font-bold text-lg tracking-tight flex items-center gap-2">
              <Image src="/uptake-icon.svg" alt="Uptake" width={24} height={24} priority />
              Uptake
            </span>
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
          </header>

          {/* Hero */}
          <main className="flex-1 flex flex-col items-center sm:justify-center px-6 text-center gap-6 pt-0 pb-6 sm:py-6">
            <div className="overflow-hidden sm:overflow-visible flex justify-center w-full sm:w-auto sm:block mt-4 sm:mt-0">
              <Image src="/intro.svg" alt="" width={330} height={330} priority unoptimized className="h-[38vh] w-auto sm:w-[330px] sm:h-[330px]" />
            </div>

            <div className="space-y-3 max-w-xl -mt-4 sm:mt-0">
              <h1 className="text-4xl font-bold tracking-tight leading-tight">
                AI Powered Nutrition
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Set your goals and track your progress. Follow the apps recommendations and advanced analysis to max out your targets quickly.
              </p>
            </div>

            <Link
              href="/login"
              className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Start Here
            </Link>
          </main>

          {/* Footer */}
          <footer className="px-6 py-6 flex items-center justify-center gap-6 text-xs text-muted-foreground border-t border-border">
            <span>© {new Date().getFullYear()} Uptake</span>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms &amp; Conditions</Link>
          </footer>

        </div>
      )}
    </>
  )
}
