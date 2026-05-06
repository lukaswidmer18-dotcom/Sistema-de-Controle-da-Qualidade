import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
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

  if (!receipt) {
    return NextResponse.json({ error: 'Recebimento não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ receipt })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()

  const receipt = await prisma.receipt.update({
    where: { id: params.id },
    data: body,
  })

  return NextResponse.json({ receipt })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    await prisma.receipt.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir recibo:', error)
    return NextResponse.json({ error: 'Erro ao excluir o formulário' }, { status: 500 })
  }
}
