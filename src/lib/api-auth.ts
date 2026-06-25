import { auth } from '@/lib/auth'
import { jwtVerify } from 'jose'
import { headers } from 'next/headers'

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'fallback-secret-change-in-production'
)

export async function getApiSession() {
  // Try NextAuth session (web browser cookie)
  const session = await auth()
  if (session) return session

  // Try Bearer JWT (mobile app)
  const authHeader = headers().get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return null

  try {
    const token = authHeader.slice(7)
    const { payload } = await jwtVerify(token, secret)
    const { id, email, name, role, unit } = payload as {
      id: string; email: string; name: string; role: string; unit?: string | null
    }
    if (!id || !email) return null
    return {
      user: { id, email, name: name ?? '', role: role ?? '', unit: unit ?? null },
      expires: new Date((payload.exp ?? 0) * 1000).toISOString(),
    }
  } catch {
    return null
  }
}
