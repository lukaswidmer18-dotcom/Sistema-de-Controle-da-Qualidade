'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mail, Plus, X } from 'lucide-react'
import { interpolateTemplate, getStatusLabel } from '@/lib/utils'
import toast from 'react-hot-toast'

interface EmailList {
  id: string
  name: string
  isActive?: boolean
  recipients: Array<{ email: string; name?: string | null }>
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  isActive?: boolean
}

interface ReceiptData {
  id: string
  formNumber: string
  invoiceNumber: string
  receivingOrder: string
  trailerPlate: string
  generalStatus: string
  qualityResponsible: string
  pdfUrl?: string | null
  products: Array<{ productCode: string; lot: string }>
  nonConformities: Array<{ description?: string | null }>
}

interface EmailSendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt: ReceiptData
  onSent?: () => void
}

export function EmailSendModal({ open, onOpenChange, receipt, onSent }: EmailSendModalProps) {
  const [lists, setLists] = useState<EmailList[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedListIds, setSelectedListIds] = useState<string[]>([])
  const [manualEmail, setManualEmail] = useState('')
  const [recipients, setRecipients] = useState<string[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (open) {
      Promise.all([
        fetch('/api/email-lists').then(r => r.json()),
        fetch('/api/email-templates').then(r => r.json()),
      ]).then(([listsData, templatesData]) => {
        setLists(listsData.lists || [])
        setTemplates(templatesData.templates || [])
      })
    }
  }, [open])

  const getVariables = () => ({
    numero_formulario: receipt.formNumber,
    data_recebimento: new Date().toLocaleDateString('pt-BR'),
    ordem_recebimento: receipt.receivingOrder,
    nota_fiscal: receipt.invoiceNumber,
    placa: receipt.trailerPlate,
    codigo_produto: receipt.products.map(p => p.productCode).join(', '),
    lote: receipt.products.map(p => p.lot).join(', '),
    status_geral: getStatusLabel(receipt.generalStatus),
    responsavel_qualidade: receipt.qualityResponsible,
    resumo_nao_conformidade: receipt.nonConformities
      .map(nc => nc.description)
      .filter(Boolean)
      .join('; ') || 'Sem não conformidades',
  })

  const applyTemplate = (template: EmailTemplate) => {
    const vars = getVariables()
    setSubject(interpolateTemplate(template.subject, vars))
    setBody(interpolateTemplate(template.body, vars))
  }

  const toggleList = (listId: string) => {
    setSelectedListIds(prev =>
      prev.includes(listId) ? prev.filter(id => id !== listId) : [...prev, listId]
    )
  }

  const addManualEmail = () => {
    const email = manualEmail.trim()
    if (!email || !email.includes('@')) {
      toast.error('E-mail inválido')
      return
    }
    if (!recipients.includes(email)) {
      setRecipients(prev => [...prev, email])
    }
    setManualEmail('')
  }

  const getAllRecipients = (): string[] => {
    const listEmails = lists
      .filter(l => selectedListIds.includes(l.id))
      .flatMap(l => l.recipients.map(r => r.email))
    return Array.from(new Set([...recipients, ...listEmails]))
  }

  const handleSend = async () => {
    const allRecipients = getAllRecipients()
    if (!allRecipients.length) {
      toast.error('Adicione pelo menos um destinatário')
      return
    }
    if (!subject || !body) {
      toast.error('Assunto e corpo do e-mail são obrigatórios')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptId: receipt.id,
          recipients: allRecipients,
          subject,
          body,
          pdfUrl: receipt.pdfUrl,
        }),
      })

      if (!response.ok) throw new Error('Erro ao enviar')

      toast.success('E-mail enviado com sucesso!')
      onSent?.()
      onOpenChange(false)
    } catch {
      toast.error('Erro ao enviar e-mail. Verifique as configurações SMTP.')
    } finally {
      setSending(false)
    }
  }

  const allRecipients = getAllRecipients()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Enviar Relatório por E-mail
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Modelos */}
          <div>
            <Label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Modelo de e-mail</Label>
            <div className="flex flex-wrap gap-2">
              {templates.filter(t => t.isActive !== false).map(template => (
                <Button
                  key={template.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(template)}
                  className="text-xs"
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Listas de transmissão */}
          <div>
            <Label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Listas de transmissão</Label>
            <div className="flex flex-wrap gap-2">
              {lists.filter(l => l.isActive !== false).map(list => (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => toggleList(list.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedListIds.includes(list.id)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {list.name} ({list.recipients.length})
                </button>
              ))}
            </div>
          </div>

          {/* E-mail manual */}
          <div>
            <Label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Adicionar e-mail manual</Label>
            <div className="flex gap-2">
              <Input
                value={manualEmail}
                onChange={e => setManualEmail(e.target.value)}
                placeholder="email@exemplo.com"
                type="email"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addManualEmail())}
                className="text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={addManualEmail}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Destinatários */}
          {allRecipients.length > 0 && (
            <div>
              <Label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                Destinatários ({allRecipients.length})
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {allRecipients.map(email => (
                  <Badge key={email} variant="secondary" className="gap-1 text-xs">
                    {email}
                    {recipients.includes(email) && (
                      <button onClick={() => setRecipients(r => r.filter(e => e !== email))}>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Assunto */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Assunto *</Label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Assunto do e-mail"
              className="text-sm"
            />
          </div>

          {/* Corpo */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Mensagem *</Label>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Escreva a mensagem..."
              className="text-sm min-h-[160px]"
            />
          </div>

          {receipt.pdfUrl && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded p-2">
              📎 PDF do relatório será anexado automaticamente
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={sending || !allRecipients.length}>
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Enviar para {allRecipients.length} destinatário(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
