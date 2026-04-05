import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Terms & Conditions — Uptake' }

export default function TermsPage() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Terms &amp; Conditions</h1>
      </div>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p className="text-foreground font-medium">Last updated: April 2026</p>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Uptake (&quot;the App&quot;), you agree to be bound by these Terms &amp; Conditions. If you
            do not agree, please do not use the App.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">2. Use of the App</h2>
          <p>
            Uptake is a personal nutrition tracking tool. You must be at least 16 years old to create an account.
            You are responsible for maintaining the confidentiality of your login credentials.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">3. Health Disclaimer</h2>
          <p>
            The nutritional information and AI-generated estimates provided by Uptake are for informational
            purposes only and do not constitute medical or dietary advice. Always consult a qualified healthcare
            professional before making significant changes to your diet or exercise routine.
          </p>
          <p>
            AI-generated nutrition estimates may be inaccurate. Do not rely solely on Uptake for managing
            medical conditions such as diabetes, eating disorders, or food allergies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">4. Data &amp; Privacy</h2>
          <p>
            We collect the data you provide (meal logs, biometrics, goals) to power the App&apos;s features.
            Your data is stored securely and is not sold to third parties. We use third-party AI providers
            (Google Gemini, Groq) to process meal descriptions; these requests do not include personally
            identifiable information.
          </p>
          <p>
            Location data, if you choose to share it, is used only to provide culturally relevant meal
            suggestions and is cached locally on your device for 24 hours.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">5. Intellectual Property</h2>
          <p>
            All content, branding, and code within the App are the property of Uptake and may not be
            reproduced without permission.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">6. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Uptake is not liable for any direct, indirect, incidental,
            or consequential damages arising from your use of the App, including inaccurate nutrition estimates
            or data loss.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">7. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the App after changes constitutes
            your acceptance of the updated Terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">8. Contact</h2>
          <p>
            For questions about these Terms, please contact us through the App&apos;s settings page.
          </p>
        </section>
      </div>
    </div>
  )
}
