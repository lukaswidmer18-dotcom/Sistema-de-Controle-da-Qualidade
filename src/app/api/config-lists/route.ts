import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/config-lists
 * Retorna todas as listas de configuração e suas opções
 */
export async function GET(request: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')

  if (name) {
    const list = await prisma.configList.findUnique({
      where: { name },
      include: { 
        options: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        } 
      },
    })
    return NextResponse.json({ list })
  }

  const lists = await prisma.configList.findMany({
    include: { 
      options: {
        orderBy: { order: 'asc' }
      } 
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ lists })
}

/**
 * POST /api/config-lists/options
 * Adiciona uma nova opção a uma lista
 */
export async function POST(request: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await request.json()
  const { listName, label, value, order } = body

  if (!listName || !label || !value) {
    return NextResponse.json({ error: 'Nome da lista, label e valor são obrigatórios' }, { status: 400 })
  }

  // Busca a lista pelo nome
  const configList = await prisma.configList.findUnique({
    where: { name: listName }
  })

  if (!configList) {
    return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })
  }

  try {
    const option = await prisma.configListOption.create({
      data: {
        configListId: configList.id,
        label,
        value,
        order: order || 0,
        isActive: true,
      }
    })

    return NextResponse.json({ option }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar opção:', error)
    return NextResponse.json({ error: 'Erro ao criar opção (provavelmente valor duplicado)' }, { status: 400 })
  }
}

/**
 * DELETE /api/config-lists?optionId=xxx
 * Remove uma opção de uma lista
 */
export async function DELETE(request: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const optionId = searchParams.get('optionId')

  if (!optionId) {
    return NextResponse.json({ error: 'ID da opção é obrigatório' }, { status: 400 })
  }

  try {
    await prisma.configListOption.delete({ where: { id: optionId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar opção:', error)
    return NextResponse.json({ error: 'Erro ao deletar opção' }, { status: 500 })
  }
}
