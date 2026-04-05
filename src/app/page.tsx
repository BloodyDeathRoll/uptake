import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Uptake — AI-Powered Nutrition Tracker',
  description: 'Track your nutrition with AI. Log meals from photos or descriptions, get personalised goals, and understand your diet in seconds.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Nav */}
      <header className="px-6 h-14 flex items-center justify-between">
        <span className="font-bold text-lg tracking-tight flex items-center gap-2">
          <Image src="/favicon.svg" alt="Uptake" width={24} height={24} priority />
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
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8 py-20">
        <div className="space-y-3 max-w-xl">
          <h1 className="text-4xl font-bold tracking-tight leading-tight">
            Nutrition goal tracking
          </h1>
          <p className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">AI powered</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Snap a picture of your meals and get ingredients &amp; nutritional values. Get advanced analytics and recommendations to reach your target.
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
  )
}
