import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const lists = await prisma.emailList.findMany({
    include: { recipients: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ lists })
}

export async function POST(request: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await request.json()
  const { name, description, isActive, recipients } = body

  if (!name || !recipients?.length) {
    return NextResponse.json({ error: 'Nome e ao menos um e-mail são obrigatórios' }, { status: 400 })
  }

  const list = await prisma.emailList.create({
    data: {
      name,
      description,
      isActive: isActive !== false,
      recipients: {
        create: recipients.map((r: { email: string; name?: string }) => ({
          email: r.email,
          name: r.name,
        })),
      },
    },
    include: { recipients: true },
  })

  return NextResponse.json({ list }, { status: 201 })
}
