import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Privacy Policy — Uptake' }

export default function PrivacyPage() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Privacy Policy</h1>
      </div>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p className="text-foreground font-medium">Last updated: April 2026</p>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">1. Who We Are</h2>
          <p>
            Uptake (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a personal nutrition tracking application. This Privacy Policy
            explains how we collect, use, and protect your personal information when you use the App.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">2. Information We Collect</h2>
          <p>We collect the following categories of information:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="text-foreground font-medium">Account data:</span> Email address and authentication credentials.</li>
            <li><span className="text-foreground font-medium">Profile data:</span> Weight, height, age, sex, and activity level that you provide during onboarding.</li>
            <li><span className="text-foreground font-medium">Nutrition data:</span> Meal logs, ingredient descriptions, photos, and nutritional goals you create in the App.</li>
            <li><span className="text-foreground font-medium">Location data:</span> Approximate city and country, only if you grant permission, used solely to suggest locally relevant meals. This is cached on your device and never stored on our servers.</li>
            <li><span className="text-foreground font-medium">Usage data:</span> Basic app interaction data used to improve the product (e.g. feature usage patterns).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide and personalise the App&apos;s features (nutrition tracking, goal setting, meal suggestions).</li>
            <li>To calculate nutritional targets based on your profile.</li>
            <li>To generate AI-powered meal estimates and suggestions via third-party AI providers.</li>
            <li>To authenticate your account and keep it secure.</li>
            <li>To improve the App based on aggregated, anonymised usage patterns.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">4. Third-Party Services</h2>
          <p>We use the following third-party services to operate the App:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="text-foreground font-medium">Supabase:</span> Secure database and authentication. Your data is stored on Supabase&apos;s infrastructure.</li>
            <li><span className="text-foreground font-medium">Google Gemini:</span> Vision AI used to analyse meal photos. Images are sent to Google&apos;s API and are not stored by Google beyond the duration of the request.</li>
            <li><span className="text-foreground font-medium">Groq:</span> LLM used to parse meal descriptions and generate suggestions. Text descriptions are sent to Groq&apos;s API and are not stored by Groq beyond the request.</li>
            <li><span className="text-foreground font-medium">OpenStreetMap Nominatim:</span> Used for reverse geocoding your GPS coordinates into a city name, if location permission is granted. No personally identifiable data is sent.</li>
          </ul>
          <p>We do not sell your data to any third party.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">5. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active. You may request deletion of your
            account and associated data at any time by contacting us through the App.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">6. Data Security</h2>
          <p>
            We use industry-standard measures to protect your data, including encrypted connections (HTTPS),
            row-level security policies on the database, and secure authentication flows. No system is completely
            secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">7. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your data.</li>
            <li>Object to or restrict certain processing of your data.</li>
          </ul>
          <p>To exercise any of these rights, please contact us through the App&apos;s settings page.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">8. Children&apos;s Privacy</h2>
          <p>
            Uptake is not intended for users under the age of 16. We do not knowingly collect personal
            information from children.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes
            within the App. Continued use after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-foreground">10. Contact</h2>
          <p>
            For any privacy-related questions or requests, please contact us through the App&apos;s settings page.
          </p>
        </section>
      </div>
    </div>
  )
}
