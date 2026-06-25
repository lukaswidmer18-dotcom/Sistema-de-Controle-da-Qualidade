import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'

const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'fallback-secret-change-in-production')

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json() as { email?: string; password?: string }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.active) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    const token = await new SignJWT({ id: user.id, email: user.email, name: user.name, role: user.role, unit: user.unit })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret)

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, unit: user.unit },
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
