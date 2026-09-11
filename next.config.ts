import type { NextConfig } from 'next'

// Exactly OUR project's storage host, not every Supabase project on the
// internet: `/_next/image` fetches and re-serves whatever matches, so a
// wildcard turns the optimizer into an open image proxy (audit 2026-09-11).
// The env var is required at build time anyway.
const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname

// Site-wide response headers (audit 2026-09-11). No CSP yet — next-pwa and
// inline theme scripts need nonces/hashes first; see the audit's proposals.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=()' },
]

const nextConfig: NextConfig = {
  // Next 16.3 type-checks the whole tsconfig project (tests included) during
  // `next build`; the build checks app code only.
  typescript: {
    tsconfigPath: 'tsconfig.build.json',
  },
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHost,
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default nextConfig
