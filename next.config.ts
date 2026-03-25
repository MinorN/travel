import type { NextConfig } from 'next'

const cosDomain = process.env.COS_DOMAIN?.replace(/^https?:\/\//, '').trim()

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.myqcloud.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      ...(cosDomain
        ? [
            {
              protocol: 'https' as const,
              hostname: cosDomain,
            },
          ]
        : []),
    ],
  },
}

export default nextConfig
