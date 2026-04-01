import type { Metadata, Viewport } from 'next'
import { Toaster } from '@/components/ui/sonner'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Uptake — Nutrition Tracker',
  description: 'Track your food intake with AI-powered nutrition estimation',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Uptake',
  },
}

export const viewport: Viewport = {
  themeColor: '#27272a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
