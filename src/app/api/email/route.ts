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

  try {
    const body = await request.json()
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

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Controle da Qualidade" <${process.env.SMTP_USER}>`,
      to: Array.isArray(recipients) ? recipients.join(', ') : recipients,
      subject,
      text: emailBody,
      html: emailBody.replace(/\n/g, '<br>'),
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
    console.error('Email error:', error)

    try {
      const body = await request.json().catch(() => ({}))
      if (body.receiptId) {
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
      }
    } catch {}

    return NextResponse.json({ error: 'Erro ao enviar e-mail' }, { status: 500 })
  }
}
