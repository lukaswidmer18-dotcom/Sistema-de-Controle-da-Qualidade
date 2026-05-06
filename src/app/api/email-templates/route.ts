import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ templates })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { name, subject, body: templateBody, isActive } = body

  if (!name || !subject || !templateBody) {
    return NextResponse.json({ error: 'Nome, assunto e corpo são obrigatórios' }, { status: 400 })
  }

  const template = await prisma.emailTemplate.create({
    data: { name, subject, body: templateBody, isActive: isActive !== false },
  })

  return NextResponse.json({ template }, { status: 201 })
}
