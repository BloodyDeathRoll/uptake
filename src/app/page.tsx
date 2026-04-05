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
        <div className="space-y-4 max-w-xl">
          <h1 className="text-4xl font-bold tracking-tight leading-tight">
            Nutrition tracking,<br />powered by AI
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Snap a photo or describe your meal in plain English. Uptake instantly
            breaks down calories, protein, carbs, and fat — and keeps you on track
            toward your personal health goals.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
          >
            Open app
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mt-4">
          {[
            { title: 'Photo & text logging', body: 'Log any meal from a photo or a quick description. AI fills in the nutrition.' },
            { title: 'Personalised goals', body: 'Set goals for weight loss, muscle gain, endurance, and more. Targets adapt to you.' },
            { title: 'Smart suggestions', body: 'Get AI meal suggestions based on what you\'ve eaten and your remaining targets.' },
          ].map(({ title, body }) => (
            <div key={title} className="p-4 rounded-xl bg-card shadow-[0_0_2px_0_rgba(0,0,0,0.1)] text-left space-y-1">
              <div className="font-semibold text-sm">{title}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
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
