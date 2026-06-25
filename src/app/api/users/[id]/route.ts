import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await request.json()
  const { name, email, password, role, unit, isActive } = body

  if (role === 'QUALIDADE' && !unit) {
    return NextResponse.json({ error: 'Unidade é obrigatória para o perfil Qualidade' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {
    name,
    email,
    role,
    unit: role === 'QUALIDADE' ? unit : null,
    active: isActive,
  }
  if (password) {
    updateData.password = await bcrypt.hash(password, 10)
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, unit: true, active: true, createdAt: true },
  })

  return NextResponse.json({ user: { ...user, isActive: user.active } })
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  if (session.user.id === params.id) {
    return NextResponse.json({ error: 'Não é possível deletar sua própria conta' }, { status: 400 })
  }

  await prisma.user.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
