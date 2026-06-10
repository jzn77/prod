import type { NextConfig } from 'next'

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const isDev  = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  // ─── Output ──────────────────────────────────────────────
  compress: true,
  poweredByHeader: false,          // remove X-Powered-By header

  // ─── Experimental ────────────────────────────────────────
  experimental: {
    typedRoutes: true,
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-dialog'],
  },

  // ─── Images ──────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
    formats:  ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // ─── Security & Cache Headers ─────────────────────────────
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.vercel-insights.com https://*.sentry.io",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co https://*.sentry.io https://api.openai.com https://api.openweathermap.org",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          // Helmet-equivalent headers
          { key: 'X-Frame-Options',                       value: 'DENY' },
          { key: 'X-Content-Type-Options',                value: 'nosniff' },
          { key: 'X-DNS-Prefetch-Control',                value: 'on' },
          { key: 'Referrer-Policy',                       value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',                    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'Strict-Transport-Security',             value: 'max-age=63072000; includeSubDomains; preload' },
          // CSP only in production (dev uses HMR inline scripts)
          ...(isProd ? [{ key: 'Content-Security-Policy', value: csp }] : []),
          // Cross-origin isolation
          { key: 'Cross-Origin-Opener-Policy',            value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy',          value: 'require-corp' },
          { key: 'Cross-Origin-Resource-Policy',          value: 'same-origin' },
        ],
      },
      // Static assets — aggressive caching
      {
        source: '/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // API routes — no cache
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma',        value: 'no-cache' },
        ],
      },
    ]
  },

  // ─── Redirects ────────────────────────────────────────────
  async redirects() {
    return [
      // www → non-www (if using custom domain)
      {
        source: '/',
        has: [{ type: 'host', value: 'www.personalhub.app' }],
        destination: 'https://personalhub.app/',
        permanent: true,
      },
    ]
  },

  // ─── Webpack ─────────────────────────────────────────────
  webpack(config, { isServer }) {
    if (!isServer) {
      // Don't bundle server-only packages on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    return config
  },
}

export default withBundleAnalyzer(nextConfig)
