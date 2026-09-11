import type { NextConfig } from 'next'

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
        hostname: '*.supabase.co',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
