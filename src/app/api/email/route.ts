import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import { join } from 'path'
import { readFile } from 'fs/promises'

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

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: { receiptId?: string; recipients?: string[]; subject?: string; body?: string; pdfUrl?: string } = {}

  try {
    body = await request.json()
    const { receiptId, recipients, subject, body: emailBody, pdfUrl } = body

    if (!receiptId || !recipients?.length || !subject || !emailBody) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 })
    }

    const transporter = getTransporter()

    let attachments: { filename: string; content: Buffer; contentType: string }[] = []

    if (pdfUrl) {
      const pdfPath = join(process.cwd(), 'public', pdfUrl.replace('/uploads/', 'uploads/').replace(/^\//, ''))
      try {
        const pdfBuffer = await readFile(pdfPath)
        attachments = [{
          filename: `relatorio-${receiptId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }]
      } catch {
        // PDF file not found, send without attachment
      }
    }

    // Add action plan button to HTML for non-conformity receipts
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      select: { generalStatus: true },
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const actionPlanUrl = `${baseUrl}/plano-acao/${receiptId}?fill=1`

    const htmlEmail = receipt?.generalStatus === 'NAO_CONFORME'
      ? `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
          <div style="padding:24px">${emailBody.replace(/\n/g, '<br>')}</div>
          <div style="margin:0 24px 24px;padding:20px;background:#fff5f5;border-left:4px solid #dc2626;border-radius:0 8px 8px 0">
            <p style="margin:0 0 12px;font-weight:700;color:#991b1b;font-size:14px">⚠️ Não Conformidade Identificada — Ação necessária</p>
            <a href="${actionPlanUrl}" style="display:inline-block;background:#16413a;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.3px">
              📋 Criar Plano de Ação
            </a>
            <p style="margin:12px 0 0;font-size:12px;color:#9ca3af">Clique no botão para registrar as ações corretivas para esta não conformidade.</p>
          </div>
        </div>`
      : emailBody.replace(/\n/g, '<br>')

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Controle da Qualidade" <${process.env.SMTP_USER}>`,
      to: Array.isArray(recipients) ? recipients.join(', ') : recipients,
      subject,
      text: emailBody,
      html: htmlEmail,
      attachments,
    })

    // Log the email
    await prisma.emailLog.create({
      data: {
        receiptId,
        sentBy: session.user.id!,
        recipients: JSON.stringify(recipients),
        subject,
        body: emailBody,
        status: 'SENT',
      },
    })

    // Update receipt emailSent status
    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        emailSent: true,
        lastEmailSentAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (body.receiptId) {
      try {
        await prisma.emailLog.create({
          data: {
            receiptId: body.receiptId,
            sentBy: session.user.id!,
            recipients: JSON.stringify(body.recipients || []),
            subject: body.subject || '',
            body: body.body || '',
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      } catch {}
    }

    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: `Erro ao enviar e-mail: ${message}` }, { status: 500 })
  }
}
