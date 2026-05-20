import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateReceiptHTML } from '@/lib/pdf-generator'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import puppeteer from 'puppeteer'

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

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'pdfs')
    await mkdir(uploadsDir, { recursive: true })

    // Save HTML for in-browser preview
    const htmlFileName = `Monitoramento-de-Recebimento-de-Produtos-${receipt.formNumber}.html`
    const htmlFilePath = join(uploadsDir, htmlFileName)
    await writeFile(htmlFilePath, html, 'utf-8')

    // Generate real PDF with puppeteer
    const pdfFileName = `Monitoramento-de-Recebimento-de-Produtos-${receipt.formNumber}.pdf`
    const pdfFilePath = join(uploadsDir, pdfFileName)

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      })
      await writeFile(pdfFilePath, pdfBuffer)
    } finally {
      await browser.close()
    }

    const htmlUrl = `/uploads/pdfs/${htmlFileName}`
    const pdfUrl = `/uploads/pdfs/${pdfFileName}`

    await prisma.receipt.update({
      where: { id: receiptId },
      data: { pdfUrl },
    })

    return NextResponse.json({ pdfUrl, htmlUrl, html })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 })
  }
}
