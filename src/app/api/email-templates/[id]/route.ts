import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await request.json()
  const { name, subject, body: templateBody, isActive } = body

  const template = await prisma.emailTemplate.update({
    where: { id: params.id },
    data: { name, subject, body: templateBody, isActive },
  })

  return NextResponse.json({ template })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  await prisma.emailTemplate.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
