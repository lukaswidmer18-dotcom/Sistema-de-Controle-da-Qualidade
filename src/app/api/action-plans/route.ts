import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: Prisma.ActionPlanWhereInput = {}

  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom)
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      ;(where.createdAt as Record<string, unknown>).lte = endDate
    }
  }

  const responsible = searchParams.get('responsible')
  if (responsible) where.responsible = { contains: responsible }

  const status = searchParams.get('status')
  if (status) where.status = status

  const receiptWhere: Prisma.ReceiptWhereInput = {}

  if (session.user.role === 'QUALIDADE') {
    receiptWhere.evaluatorName = session.user.unit ?? '__sem_unidade__'
  }

  const formNumber = searchParams.get('formNumber')
  if (formNumber) receiptWhere.formNumber = { contains: formNumber }

  const invoiceNumber = searchParams.get('invoiceNumber')
  if (invoiceNumber) receiptWhere.invoiceNumber = { contains: invoiceNumber }

  const trailerPlate = searchParams.get('trailerPlate')
  if (trailerPlate) receiptWhere.trailerPlate = { contains: trailerPlate }

  const qualityResponsible = searchParams.get('qualityResponsible')
  if (qualityResponsible) receiptWhere.qualityResponsible = { contains: qualityResponsible }

  if (Object.keys(receiptWhere).length > 0) {
    where.receipt = receiptWhere
  }

  try {
    const [actionPlans, total] = await Promise.all([
      prisma.actionPlan.findMany({
        where,
        include: {
          receipt: {
            select: {
              id: true,
              formNumber: true,
              invoiceNumber: true,
              trailerPlate: true,
              receivedAt: true,
              qualityResponsible: true,
              generalStatus: true,
              _count: { select: { nonConformities: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.actionPlan.count({ where }),
    ])

    return NextResponse.json({
      actionPlans,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching action plans:', error)
    return NextResponse.json({ error: 'Erro ao buscar planos de ação' }, { status: 500 })
  }
}
