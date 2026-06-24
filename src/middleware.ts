import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost:19000',
  'https://mobile-app-six-kohl.vercel.app',
  'https://controle-qualidade-mobile.vercel.app',
  process.env.EXPO_ORIGIN,
].filter(Boolean) as string[]

// Expo tunnel URLs are random per session (e.g. https://abc123-user-8081.exp.direct)
const ALLOWED_ORIGIN_PATTERNS = [/^https:\/\/[a-z0-9-]+\.exp\.direct$/]

function isOriginAllowed(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGIN_PATTERNS.some(p => p.test(origin))
}

function corsHeaders(origin: string | null) {
  const allowed = origin && isOriginAllowed(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin')

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return NextResponse.json({}, { headers: corsHeaders(origin) })
  }

  const res = NextResponse.next()
  const headers = corsHeaders(origin)
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

export const config = {
  matcher: '/api/:path*',
}
