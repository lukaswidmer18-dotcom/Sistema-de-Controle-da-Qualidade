import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { generateReceiptHTML } from '@/lib/pdf-generator'
import { launchBrowser } from '@/lib/browser'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  const session = await getApiSession()
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

    if (!receipt || (session.user.role === 'QUALIDADE' && receipt.evaluatorName !== session.user.unit)) {
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

    // Save HTML for in-browser preview
    const htmlFileName = `Monitoramento-de-Recebimento-de-Produtos-${receipt.formNumber}.html`

    // Generate real PDF with puppeteer
    const pdfFileName = `Monitoramento-de-Recebimento-de-Produtos-${receipt.formNumber}.pdf`

    const browser = await launchBrowser()

    let pdfBuffer: Buffer
    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'load' })
      pdfBuffer = Buffer.from(await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      }))
    } finally {
      await browser.close()
    }

    const [htmlBlob, pdfBlob] = await Promise.all([
      put(`pdfs/${htmlFileName}`, html, { access: 'public', contentType: 'text/html', addRandomSuffix: false }),
      put(`pdfs/${pdfFileName}`, pdfBuffer, { access: 'public', contentType: 'application/pdf', addRandomSuffix: false }),
    ])

    const htmlUrl = htmlBlob.url
    const pdfUrl = pdfBlob.url

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
