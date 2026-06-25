import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const receipt = await prisma.receipt.findUnique({
    where: { id: params.id },
    include: {
      products: true,
      checklistItems: {
        include: { photos: true },
        orderBy: { section: 'asc' },
      },
      temperatures: true,
      nonConformities: {
        include: { checklistItem: true },
      },
      emailLogs: {
        include: { sender: { select: { name: true, email: true } } },
        orderBy: { sentAt: 'desc' },
      },
      creator: { select: { name: true, email: true } },
    },
  })

  if (!receipt || (session.user.role === 'QUALIDADE' && receipt.unit !== session.user.unit)) {
    return NextResponse.json({ error: 'Recebimento não encontrado' }, { status: 404 })
  }

  const emailLogs = receipt.emailLogs.map(log => ({
    ...log,
    recipients: JSON.parse(log.recipients) as string[],
  }))

  return NextResponse.json({ receipt: { ...receipt, emailLogs } })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const existing = await prisma.receipt.findUnique({
    where: { id: params.id },
    select: { unit: true },
  })

  if (!existing || (session.user.role === 'QUALIDADE' && existing.unit !== session.user.unit)) {
    return NextResponse.json({ error: 'Recebimento não encontrado' }, { status: 404 })
  }

  const body = await request.json()
  if (session.user.role === 'QUALIDADE') {
    delete body.unit
  }

  const receipt = await prisma.receipt.update({
    where: { id: params.id },
    data: body,
  })

  return NextResponse.json({ receipt })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const id = params.id

    const existing = await prisma.receipt.findUnique({
      where: { id },
      select: { unit: true },
    })

    if (!existing || (session.user.role === 'QUALIDADE' && existing.unit !== session.user.unit)) {
      return NextResponse.json({ error: 'Recebimento não encontrado' }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.nonConformity.deleteMany({ where: { receiptId: id } }),
      prisma.checklistPhoto.deleteMany({ where: { receiptId: id } }),
      prisma.checklistItem.deleteMany({ where: { receiptId: id } }),
      prisma.temperatureMeasurement.deleteMany({ where: { receiptId: id } }),
      prisma.receiptProduct.deleteMany({ where: { receiptId: id } }),
      prisma.emailLog.deleteMany({ where: { receiptId: id } }),
      prisma.receipt.delete({ where: { id } })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir recibo:', error)
    return NextResponse.json({ error: 'Erro ao excluir o formulário' }, { status: 500 })
  }
}
