/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', '@sparticuz/chromium', 'puppeteer-core'],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false
    }
    return config
  },
}

module.exports = nextConfig
