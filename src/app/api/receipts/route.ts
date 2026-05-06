import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateFormNumber } from '@/lib/utils'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const photoSchema = z.object({
  fileUrl: z.string(),
  fileName: z.string(),
  fileType: z.string(),
})

const checklistItemSchema = z.object({
  key: z.string().optional(),
  label: z.string().optional(),
  itemKey: z.string().optional(),
  itemLabel: z.string().optional(),
  status: z.string().optional(),
  observation: z.string().optional(),
  isNonConformity: z.boolean().default(false),
  photos: z.array(photoSchema).optional(),
}).transform((item, ctx) => {
  const itemKey = item.itemKey ?? item.key
  const itemLabel = item.itemLabel ?? item.label

  if (!itemKey || !itemLabel) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Checklist sem chave ou descrição',
    })
    return z.NEVER
  }

  return {
    itemKey,
    itemLabel,
    status: item.status,
    observation: item.observation,
    isNonConformity: item.isNonConformity || item.status === 'NAO_CONFORME',
    photos: item.photos,
  }
})

const receiptSchema = z.object({
  formNumber: z.string().optional(),
  receivedAt: z.string(),
  evaluatorName: z.string().min(1),
  unit: z.string().optional().default('N/A'),
  operationResponsible: z.string().min(1),
  qualityResponsible: z.string().min(1),
  receivingOrder: z.string().min(1),
  invoiceNumber: z.string().min(1),
  vehicleType: z.string().min(1),
  trailerPlate: z.string().min(1),
  platePicture: z.union([z.string(), photoSchema]).optional().transform(photo => {
    if (!photo) return undefined
    return typeof photo === 'string' ? photo : photo.fileUrl
  }),
  observations: z.string().optional(),
  generalStatus: z.string().default('AGUARDANDO'),
  products: z.array(z.object({
    productCode: z.string().min(1),
    productDescription: z.string().optional(),
    lot: z.string().min(1),
    quantity: z.string().optional(),
  })),
  vehicleChecklist: z.array(checklistItemSchema),
  cargoChecklist: z.array(checklistItemSchema),
  temperatures: z.array(z.object({
    productCode: z.string().optional(),
    productName: z.string().optional(),
    lot: z.string().optional(),
    temperatureType: z.string(),
    temperature: z.number().optional(),
    unit: z.string().default('°C'),
    status: z.string().optional(),
    observation: z.string().optional(),
    photoUrl: z.string().optional(),
  })).optional(),
})

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: Prisma.ReceiptWhereInput = {}

  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  if (dateFrom || dateTo) {
    where.receivedAt = {}
    if (dateFrom) (where.receivedAt as Record<string, unknown>).gte = new Date(dateFrom)
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      ;(where.receivedAt as Record<string, unknown>).lte = endDate
    }
  }

  const receivingOrder = searchParams.get('receivingOrder')
  if (receivingOrder) where.receivingOrder = { contains: receivingOrder }

  const invoiceNumber = searchParams.get('invoiceNumber')
  if (invoiceNumber) where.invoiceNumber = { contains: invoiceNumber }

  const trailerPlate = searchParams.get('trailerPlate')
  if (trailerPlate) where.trailerPlate = { contains: trailerPlate }

  const generalStatus = searchParams.get('generalStatus')
  if (generalStatus) where.generalStatus = { contains: generalStatus }

  const qualityResponsible = searchParams.get('qualityResponsible')
  if (qualityResponsible) where.qualityResponsible = { contains: qualityResponsible }

  const productCode = searchParams.get('productCode')
  const lot = searchParams.get('lot')
  if (productCode || lot) {
    const productWhere: Prisma.ReceiptProductWhereInput = {}
    if (productCode) productWhere.productCode = { contains: productCode }
    if (lot) productWhere.lot = { contains: lot }
    where.products = { some: productWhere }
  }

  const [receipts, total] = await Promise.all([
    prisma.receipt.findMany({
      where,
      include: {
        products: true,
        creator: { select: { name: true, email: true } },
        _count: { select: { nonConformities: true, emailLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.receipt.count({ where }),
  ])

  const rows = receipts.map(receipt => ({
    ...receipt,
    htmlUrl: receipt.pdfUrl,
    emailSentAt: receipt.lastEmailSentAt,
  }))

  return NextResponse.json({
    receipts: rows,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = receiptSchema.parse(body)

    const formNumber = data.formNumber || generateFormNumber()

    const receipt = await prisma.$transaction(async tx => {
      const createdReceipt = await tx.receipt.create({
        data: {
          formNumber,
          receivedAt: new Date(data.receivedAt),
          evaluatorName: data.evaluatorName,
          unit: data.unit,
          operationResponsible: data.operationResponsible,
          qualityResponsible: data.qualityResponsible,
          receivingOrder: data.receivingOrder,
          invoiceNumber: data.invoiceNumber,
          vehicleType: data.vehicleType,
          trailerPlate: data.trailerPlate,
          platePicture: data.platePicture,
          observations: data.observations,
          generalStatus: data.generalStatus,
          createdBy: session.user.id!,
          products: {
            create: data.products.map(p => ({
              productCode: p.productCode,
              productDescription: p.productDescription,
              lot: p.lot,
              quantity: p.quantity,
            })),
          },
          checklistItems: {
            create: [
              ...data.vehicleChecklist.map(item => ({
                section: 'VEICULO',
                itemKey: item.itemKey,
                itemLabel: item.itemLabel,
                status: item.status,
                observation: item.observation,
                isNonConformity: item.isNonConformity,
              })),
              ...data.cargoChecklist.map(item => ({
                section: 'CARGA',
                itemKey: item.itemKey,
                itemLabel: item.itemLabel,
                status: item.status,
                observation: item.observation,
                isNonConformity: item.isNonConformity,
              })),
            ],
          },
          temperatures: data.temperatures ? {
            create: data.temperatures.map(t => ({
              productCode: t.productCode,
              productName: t.productName,
              lot: t.lot,
              temperatureType: t.temperatureType,
              temperature: t.temperature,
              unit: t.unit,
              status: t.status,
              observation: t.observation,
              photoUrl: t.photoUrl,
            })),
          } : undefined,
        },
      })

      const createdChecklistItems = await tx.checklistItem.findMany({
        where: { receiptId: createdReceipt.id },
        select: { id: true, section: true, itemKey: true },
      })
      const checklistByKey = new Map(
        createdChecklistItems.map(item => [`${item.section}:${item.itemKey}`, item])
      )

      const allChecklist = [
        ...data.vehicleChecklist.map(item => ({ ...item, section: 'VEICULO' })),
        ...data.cargoChecklist.map(item => ({ ...item, section: 'CARGA' })),
      ]

      const checklistPhotos = allChecklist.flatMap(item => {
        const createdItem = checklistByKey.get(`${item.section}:${item.itemKey}`)
        if (!createdItem || !item.photos?.length) return []

        return item.photos.map(photo => ({
          receiptId: createdReceipt.id,
          checklistItemId: createdItem.id,
          fileUrl: photo.fileUrl,
          fileName: photo.fileName,
          fileType: photo.fileType,
        }))
      })

      if (checklistPhotos.length > 0) {
        await tx.checklistPhoto.createMany({ data: checklistPhotos })
      }

      const checklistNonConformities = allChecklist.flatMap(item => {
        if (item.status !== 'NAO_CONFORME') return []
        const createdItem = checklistByKey.get(`${item.section}:${item.itemKey}`)
        if (!createdItem) return []

        return [{
          receiptId: createdReceipt.id,
          checklistItemId: createdItem.id,
          section: item.section,
          description: item.observation || item.itemLabel,
          photoUrl: item.photos?.[0]?.fileUrl,
          status: 'ABERTA',
        }]
      })

      const temperatureNonConformities = (data.temperatures ?? []).flatMap((temperature, index) => {
        if (temperature.status !== 'NAO_CONFORME') return []

        return [{
          receiptId: createdReceipt.id,
          section: 'TEMPERATURA',
          description: temperature.observation ||
            `Medição ${index + 1}: ${temperature.temperature ?? '-'}${temperature.unit}`,
          photoUrl: temperature.photoUrl,
          status: 'ABERTA',
        }]
      })

      const nonConformities = [
        ...checklistNonConformities,
        ...temperatureNonConformities,
      ]

      if (nonConformities.length > 0) {
        await tx.nonConformity.createMany({ data: nonConformities })
      }

      return createdReceipt
    })

    return NextResponse.json({ id: receipt.id, receipt }, { status: 201 })
  } catch (error) {
    console.error('Error creating receipt:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao criar recebimento' }, { status: 500 })
  }
}
