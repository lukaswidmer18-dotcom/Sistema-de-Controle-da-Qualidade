import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateActionPlanHTML } from '@/lib/pdf-generator'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { join } from 'path'
import puppeteer from 'puppeteer'
import nodemailer from 'nodemailer'

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const receipt = await prisma.receipt.findUnique({
    where: { id: params.id },
    include: {
      products: true,
      nonConformities: {
        include: {
          checklistItem: {
            include: { photos: true },
          },
        },
      },
      actionPlan: true,
    },
  })

  if (!receipt) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json({ receipt })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json() as {
    description?: string
    responsible?: string
    deadline?: string
    rootCause?: string
  }

  const { description, responsible, deadline, rootCause } = body

  if (!description || !responsible || !deadline || !rootCause) {
    return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
  }

  const receipt = await prisma.receipt.findUnique({
    where: { id: params.id },
    include: {
      products: true,
      nonConformities: true,
    },
  })

  if (!receipt) return NextResponse.json({ error: 'Recebimento não encontrado' }, { status: 404 })

  const actionPlan = await prisma.actionPlan.upsert({
    where: { receiptId: params.id },
    create: {
      receiptId: params.id,
      description,
      responsible,
      deadline: new Date(deadline),
      rootCause,
      status: 'PENDENTE',
    },
    update: {
      description,
      responsible,
      deadline: new Date(deadline),
      rootCause,
    },
  })

  const html = generateActionPlanHTML({
    receipt: {
      formNumber: receipt.formNumber,
      invoiceNumber: receipt.invoiceNumber,
      trailerPlate: receipt.trailerPlate,
      receivedAt: receipt.receivedAt,
      qualityResponsible: receipt.qualityResponsible,
      nonConformities: receipt.nonConformities,
    },
    actionPlan: {
      description,
      responsible,
      deadline,
      rootCause,
      createdAt: actionPlan.createdAt,
    },
  })

  const uploadsDir = join(process.cwd(), 'public', 'uploads', 'pdfs')
  await mkdir(uploadsDir, { recursive: true })

  const pdfFileName = `Plano-de-Acao-${receipt.formNumber}.pdf`
  const pdfFilePath = join(uploadsDir, pdfFileName)

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    await writeFile(pdfFilePath, pdfBuffer)
  } finally {
    await browser.close()
  }

  const pdfUrl = `/uploads/pdfs/${pdfFileName}`

  await prisma.actionPlan.update({
    where: { id: actionPlan.id },
    data: { pdfUrl, status: 'CONCLUIDO' },
  })

  // Send email to same recipients as last email log
  const lastEmailLog = await prisma.emailLog.findFirst({
    where: { receiptId: params.id, status: 'SENT' },
    orderBy: { sentAt: 'desc' },
  })

  let emailSent = false

  if (lastEmailLog) {
    const recipients = JSON.parse(lastEmailLog.recipients) as string[]

    const ncList = receipt.nonConformities
      .map((nc, i) => `${i + 1}. ${nc.description || 'Sem descrição'}`)
      .join('\n')

    const emailBodyText = `Olá,

Segue em anexo o Plano de Ação referente ao recebimento ${receipt.formNumber}.

Não Conformidades identificadas:
${ncList}

Causa Raiz:
${rootCause}

Ação Corretiva:
${description}

Responsável: ${responsible}
Prazo: ${new Date(deadline).toLocaleDateString('pt-BR')}

Atenciosamente,
Equipe da Qualidade`

    const emailBodyHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#16413a;padding:20px 24px;border-radius:8px 8px 0 0">
    <p style="margin:0;color:rgba(255,255,255,0.5);font-size:11px;text-transform:uppercase;letter-spacing:0.1em">Controle da Qualidade</p>
    <h2 style="margin:4px 0 0;color:#bc933f;font-size:20px">Plano de Ação</h2>
  </div>
  <div style="padding:24px;background:#ffffff;border:1px solid #e5e7eb;border-top:none">
    <p style="margin:0 0 16px">Olá,</p>
    <p style="margin:0 0 20px">Segue em anexo o Plano de Ação referente ao recebimento <strong>${receipt.formNumber}</strong>.</p>

    <div style="background:#fff5f5;border:1px solid #fca5a5;border-radius:6px;padding:16px;margin-bottom:20px">
      <p style="margin:0 0 8px;font-weight:700;color:#991b1b;font-size:13px">Não Conformidades Identificadas:</p>
      ${receipt.nonConformities.map((nc, i) => `<p style="margin:0 0 4px;color:#450a0a;font-size:12px">${i + 1}. ${nc.description || 'Sem descrição'}</p>`).join('')}
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin-bottom:12px">
      <p style="margin:0 0 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280">Causa Raiz</p>
      <p style="margin:0;color:#1f2937;font-size:13px">${rootCause}</p>
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin-bottom:12px">
      <p style="margin:0 0 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280">Ação Corretiva</p>
      <p style="margin:0;color:#1f2937;font-size:13px">${description}</p>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:20px">
      <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px">
        <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;color:#166534">Responsável</p>
        <p style="margin:0;font-weight:600;color:#15803d">${responsible}</p>
      </div>
      <div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:12px">
        <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;color:#1e40af">Prazo</p>
        <p style="margin:0;font-weight:600;color:#1d4ed8">${new Date(deadline).toLocaleDateString('pt-BR')}</p>
      </div>
    </div>

    <p style="margin:0;color:#6b7280;font-size:12px">Atenciosamente,<br/><strong>Equipe da Qualidade</strong></p>
  </div>
  <div style="padding:12px 24px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;text-align:center">
    <p style="margin:0;font-size:11px;color:#9ca3af">Bello Alimentos LTDA · Sistema de Controle da Qualidade</p>
  </div>
</div>`

    const attachments: { filename: string; content: Buffer; contentType: string }[] = []

    const actionPlanBuffer = await readFile(pdfFilePath)
    attachments.push({ filename: pdfFileName, content: actionPlanBuffer, contentType: 'application/pdf' })

    if (receipt.pdfUrl) {
      try {
        const receiptPdfPath = join(process.cwd(), 'public', receipt.pdfUrl.replace(/^\//, ''))
        const receiptBuffer = await readFile(receiptPdfPath)
        attachments.push({
          filename: `Relatorio-${receipt.formNumber}.pdf`,
          content: receiptBuffer,
          contentType: 'application/pdf',
        })
      } catch {
        // Receipt PDF not found — skip attachment
      }
    }

    const transporter = getTransporter()
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Controle da Qualidade" <${process.env.SMTP_USER}>`,
      to: recipients.join(', '),
      subject: `Plano de Ação — ${receipt.formNumber}`,
      text: emailBodyText,
      html: emailBodyHtml,
      attachments,
    })

    await prisma.emailLog.create({
      data: {
        receiptId: params.id,
        sentBy: session.user.id!,
        recipients: JSON.stringify(recipients),
        subject: `Plano de Ação — ${receipt.formNumber}`,
        body: emailBodyText,
        status: 'SENT',
      },
    })

    emailSent = true
  }

  return NextResponse.json({ success: true, pdfUrl, emailSent })
}
