import type { Metadata, Viewport } from 'next'
import { Toaster } from '@/components/ui/sonner'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'
import TimezoneSync from '@/components/TimezoneSync'
import { LanguageProvider } from '@/lib/i18n'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Uptake — Nutrition Tracker',
  description: 'Track your food intake with AI-powered nutrition estimation',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Uptake',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF8' },
    { media: '(prefers-color-scheme: dark)', color: '#1C1917' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@100..900&display=swap" />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
          <Toaster />
        </ThemeProvider>
        <ServiceWorkerRegistrar />
        <TimezoneSync />
      </body>
    </html>
  )
}
