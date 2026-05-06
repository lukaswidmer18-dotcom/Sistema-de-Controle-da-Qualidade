import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateReceiptHTML } from '@/lib/pdf-generator'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { receiptId } = await request.json()

    if (!receiptId) {
      return NextResponse.json({ error: 'ID do recebimento obrigatório' }, { status: 400 })
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
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
      },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Recebimento não encontrado' }, { status: 404 })
    }

    const html = generateReceiptHTML({
      formNumber: receipt.formNumber,
      receivedAt: receipt.receivedAt,
      evaluatorName: receipt.evaluatorName,
      unit: receipt.unit,
      operationResponsible: receipt.operationResponsible,
      qualityResponsible: receipt.qualityResponsible,
      receivingOrder: receipt.receivingOrder,
      invoiceNumber: receipt.invoiceNumber,
      vehicleType: receipt.vehicleType,
      trailerPlate: receipt.trailerPlate,
      platePicture: receipt.platePicture,
      generalStatus: receipt.generalStatus,
      observations: receipt.observations,
      products: receipt.products,
      checklistItems: receipt.checklistItems.map(item => ({
        ...item,
        photos: item.photos,
      })),
      temperatures: receipt.temperatures,
      nonConformities: receipt.nonConformities,
    })

    // Save the HTML as the PDF representation (would use puppeteer in production)
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'pdfs')
    await mkdir(uploadsDir, { recursive: true })

    const fileName = `receipt-${receipt.formNumber}-${Date.now()}.html`
    const filePath = join(uploadsDir, fileName)
    await writeFile(filePath, html, 'utf-8')

    const pdfUrl = `/uploads/pdfs/${fileName}`

    await prisma.receipt.update({
      where: { id: receiptId },
      data: { pdfUrl },
    })

    return NextResponse.json({ pdfUrl, html })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 })
  }
}
