import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { name, description, isActive, recipients } = body

  // Delete old recipients and recreate
  await prisma.emailListRecipient.deleteMany({ where: { emailListId: params.id } })

  const list = await prisma.emailList.update({
    where: { id: params.id },
    data: {
      name,
      description,
      isActive,
      recipients: {
        create: recipients.map((r: { email: string; name?: string }) => ({
          email: r.email,
          name: r.name,
        })),
      },
    },
    include: { recipients: true },
  })

  return NextResponse.json({ list })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  await prisma.emailList.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
