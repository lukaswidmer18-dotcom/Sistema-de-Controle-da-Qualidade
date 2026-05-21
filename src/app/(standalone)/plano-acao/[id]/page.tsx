'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import {
  FileText,
  Camera,
  Loader2,
  CheckCircle2,
  Download,
  AlertTriangle,
  ClipboardList,
  LinkIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDateTime, getStatusLabel, getStatusColor } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface NonConformityItem {
  id: string
  section: string
  description?: string | null
  photoUrl?: string | null
  checklistItem?: {
    photos: Array<{ id: string; fileUrl: string; fileName: string }>
  } | null
}

interface ReceiptData {
  id: string
  formNumber: string
  invoiceNumber: string
  receivingOrder: string
  trailerPlate: string
  generalStatus: string
  qualityResponsible: string
  evaluatorName: string
  receivedAt: string
  pdfUrl?: string | null
  htmlUrl?: string | null
  nonConformities: NonConformityItem[]
  products: Array<{ productCode: string; lot: string }>
  actionPlan?: {
    id: string
    description: string
    responsible: string
    deadline: string
    rootCause: string
    status: string
    pdfUrl?: string | null
    createdAt: string
  } | null
}

export default function PlanoAcaoPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const receiptId = params.id as string
  const canFill = searchParams.get('fill') === '1'

  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [actionPlanPdfUrl, setActionPlanPdfUrl] = useState<string | null>(null)
  const [showPhotos, setShowPhotos] = useState(false)

  const [form, setForm] = useState({
    rootCause: '',
    description: '',
    responsible: '',
    deadline: '',
  })

  useEffect(() => {
    fetch(`/api/action-plans/${receiptId}`)
      .then(r => r.json())
      .then((data: { receipt: ReceiptData }) => {
        setReceipt(data.receipt)
        if (data.receipt.actionPlan) {
          const ap = data.receipt.actionPlan
          setForm({
            rootCause: ap.rootCause,
            description: ap.description,
            responsible: ap.responsible,
            deadline: ap.deadline.split('T')[0],
          })
          if (ap.status === 'CONCLUIDO') {
            setSubmitted(true)
            setActionPlanPdfUrl(ap.pdfUrl ?? null)
            if (canFill) setAlreadySubmitted(true)
          }
        }
      })
      .catch(() => toast.error('Erro ao carregar dados'))
      .finally(() => setLoading(false))
  }, [receiptId])

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.rootCause || !form.description || !form.responsible || !form.deadline) {
      toast.error('Preencha todos os campos')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/action-plans/${receiptId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json() as { success?: boolean; pdfUrl?: string; emailSent?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')

      setSubmitted(true)
      setActionPlanPdfUrl(data.pdfUrl ?? null)

      if (data.emailSent) {
        toast.success('Plano de ação registrado e e-mail enviado!')
      } else {
        toast.success('Plano de ação registrado. PDF gerado.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const allPhotos = receipt?.nonConformities.flatMap(nc => {
    const photos: Array<{ url: string; label: string }> = []
    if (nc.photoUrl) {
      photos.push({ url: nc.photoUrl, label: nc.description || nc.section })
    }
    nc.checklistItem?.photos.forEach(p => {
      photos.push({ url: p.fileUrl, label: p.fileName })
    })
    return photos
  }) ?? []

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green/40" />
      </div>
    )
  }

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-brand-green/60">Recebimento não encontrado.</p>
      </div>
    )
  }

  if (canFill && alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="brand-card rounded-2xl p-10 max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(239,68,68,0.08)' }}>
            <LinkIcon className="w-8 h-8 text-red-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-gray-800">Link Expirado</h1>
            <p className="text-sm text-gray-500">
              O plano de ação para o formulário <span className="font-mono font-semibold text-brand-green">{receipt.formNumber}</span> já foi registrado.
            </p>
            <p className="text-xs text-gray-400">
              Este link é de uso único e não está mais disponível.
            </p>
          </div>
          <div
            className="rounded-lg px-4 py-3 text-xs text-left space-y-1"
            style={{ background: 'rgba(22,65,58,0.04)', border: '1px solid rgba(22,65,58,0.08)' }}
          >
            <p className="text-gray-400 uppercase tracking-wider font-semibold text-[0.65rem]">Recebimento</p>
            <p className="text-gray-600 font-mono">{receipt.invoiceNumber} · {receipt.trailerPlate}</p>
            <p className="text-gray-400">{receipt.qualityResponsible}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

      {/* Receipt summary */}
      <div className="brand-card rounded-xl p-5 motion-enter">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap gap-5">
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-gray-400 mb-0.5">Formulário</p>
              <p className="font-mono font-semibold text-brand-green">{receipt.formNumber}</p>
            </div>
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-gray-400 mb-0.5">Nota Fiscal</p>
              <p className="text-sm font-semibold text-gray-700">{receipt.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-gray-400 mb-0.5">Placa</p>
              <p className="font-mono font-bold text-gray-700">{receipt.trailerPlate}</p>
            </div>
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-gray-400 mb-0.5">Data Recebimento</p>
              <p className="text-sm text-gray-600">{formatDateTime(receipt.receivedAt)}</p>
            </div>
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-gray-400 mb-0.5">Resp. Qualidade</p>
              <p className="text-sm text-gray-600">{receipt.qualityResponsible}</p>
            </div>
          </div>
          <Badge className={cn('text-xs border shrink-0', getStatusColor(receipt.generalStatus))}>
            {getStatusLabel(receipt.generalStatus)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Left: Non-conformities + PDF */}
        <div className="space-y-5">

          {/* Non-conformities */}
          <div className="brand-card rounded-xl overflow-hidden motion-enter">
            <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(22,65,58,0.08)', background: '#fee2e2' }}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-red-700">
                  Não Conformidades ({receipt.nonConformities.length})
                </p>
              </div>
              {allPhotos.length > 0 && (
                <button
                  onClick={() => setShowPhotos(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-900 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Ver {allPhotos.length} foto(s)
                </button>
              )}
            </div>
            <div className="divide-y divide-brand-green/[0.06]">
              {receipt.nonConformities.map((nc, i) => (
                <div key={nc.id} className="px-5 py-3.5" style={{ background: 'rgba(254,226,226,0.3)' }}>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold text-red-600 shrink-0 mt-0.5">NC {i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-red-500 mb-0.5">
                        {nc.section === 'VEICULO' ? 'Condições do Veículo' : nc.section === 'CARGA' ? 'Condições da Carga' : nc.section}
                      </p>
                      <p className="text-sm text-gray-700">{nc.description || 'Sem descrição'}</p>
                      {nc.photoUrl && (
                        <img
                          src={nc.photoUrl}
                          alt="Evidência"
                          className="mt-2 rounded-lg border border-red-200 max-h-32 object-cover cursor-pointer"
                          onClick={() => setShowPhotos(true)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PDF Viewer */}
          {receipt.pdfUrl && (
            <div className="brand-card rounded-xl overflow-hidden motion-enter-delay">
              <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(22,65,58,0.08)' }}>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-gold" />
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(22,65,58,0.42)' }}>
                    Relatório de Recebimento
                  </p>
                </div>
                <a
                  href={receipt.pdfUrl}
                  download
                  className="flex items-center gap-1 text-xs font-semibold text-brand-green/70 hover:text-brand-green transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar
                </a>
              </div>
              <div className="p-0" style={{ height: '480px' }}>
                <iframe
                  src={receipt.pdfUrl}
                  className="w-full h-full border-none"
                  title="Relatório de Recebimento"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Action plan */}
        <div className="motion-enter-delay">
          {!canFill ? (
            /* Read-only dashboard view */
            <div className="brand-card rounded-xl overflow-hidden">
              <div
                className="px-5 py-4 border-b flex items-center gap-2"
                style={{
                  borderColor: 'rgba(22,65,58,0.08)',
                  background: submitted ? 'rgba(52,211,153,0.06)' : 'rgba(251,191,36,0.06)',
                }}
              >
                {submitted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <ClipboardList className="w-5 h-5 text-amber-500" />
                )}
                <p className="font-bold text-brand-green">
                  {submitted ? 'Plano de Ação Finalizado' : 'Plano de Ação Pendente'}
                </p>
              </div>

              {submitted ? (
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Causa Raiz</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{form.rootCause}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Ação Corretiva</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{form.description}</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Responsável</p>
                      <p className="text-sm font-semibold text-gray-700">{form.responsible}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Prazo</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {new Date(form.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  {actionPlanPdfUrl && (
                    <a
                      href={actionPlanPdfUrl}
                      download
                      className="flex items-center gap-2 w-full justify-center rounded-lg px-4 py-2.5 text-sm font-semibold border transition-colors hover:bg-brand-cream"
                      style={{ borderColor: 'rgba(22,65,58,0.2)', color: '#16413a' }}
                    >
                      <Download className="w-4 h-4" />
                      Baixar PDF do Plano de Ação
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-5">
                  <p className="text-sm text-gray-500">
                    Nenhum plano de ação foi registrado para este recebimento ainda.
                  </p>
                </div>
              )}
            </div>
          ) : submitted ? (
            /* Plan already submitted */
            <div className="brand-card rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(22,65,58,0.08)', background: 'rgba(52,211,153,0.06)' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <p className="font-bold text-brand-green">Plano de Ação Registrado</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Causa Raiz</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{form.rootCause}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Ação Corretiva</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{form.description}</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Responsável</p>
                    <p className="text-sm font-semibold text-gray-700">{form.responsible}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Prazo</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {new Date(form.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                {actionPlanPdfUrl && (
                  <a
                    href={actionPlanPdfUrl}
                    download
                    className="flex items-center gap-2 w-full justify-center rounded-lg px-4 py-2.5 text-sm font-semibold border transition-colors hover:bg-brand-cream"
                    style={{ borderColor: 'rgba(22,65,58,0.2)', color: '#16413a' }}
                  >
                    <Download className="w-4 h-4" />
                    Baixar PDF do Plano de Ação
                  </a>
                )}
              </div>
            </div>
          ) : (
            /* Form to fill */
            <div className="brand-card rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b" style={{ borderColor: 'rgba(22,65,58,0.08)' }}>
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-brand-gold" />
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(22,65,58,0.42)' }}>
                    Formulário do Plano de Ação
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[0.8125rem] font-semibold text-gray-600">
                    Causa Raiz <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={form.rootCause}
                    onChange={e => updateForm('rootCause', e.target.value)}
                    placeholder="Descreva a causa raiz da não conformidade..."
                    className="min-h-[100px] text-sm resize-none"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[0.8125rem] font-semibold text-gray-600">
                    Descrição da Ação Corretiva <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={form.description}
                    onChange={e => updateForm('description', e.target.value)}
                    placeholder="Descreva detalhadamente a ação corretiva a ser tomada..."
                    className="min-h-[120px] text-sm resize-none"
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[0.8125rem] font-semibold text-gray-600">
                      Responsável <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.responsible}
                      onChange={e => updateForm('responsible', e.target.value)}
                      placeholder="Nome do responsável"
                      className="h-10 text-sm"
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[0.8125rem] font-semibold text-gray-600">
                      Prazo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={form.deadline}
                      onChange={e => updateForm('deadline', e.target.value)}
                      className="h-10 text-sm"
                      disabled={submitting}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div
                  className="rounded-lg px-4 py-3 text-xs"
                  style={{ background: 'rgba(22,65,58,0.04)', border: '1px solid rgba(22,65,58,0.08)', color: 'rgba(22,65,58,0.60)' }}
                >
                  Ao finalizar, será gerado um PDF do plano de ação e enviado por e-mail para o mesmo grupo do relatório original.
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold"
                  disabled={submitting}
                  style={{
                    background: submitting
                      ? 'rgba(22,65,58,0.40)'
                      : 'linear-gradient(135deg, #16413a 0%, #1d5c51 60%, #16413a 100%)',
                    color: '#fff',
                    border: 'none',
                    boxShadow: submitting ? 'none' : '0 8px 24px -10px rgba(22,65,58,0.58)',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Gerando PDF e enviando e-mail...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Finalizar Plano de Ação
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Photos modal */}
      <Dialog open={showPhotos} onOpenChange={setShowPhotos}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-red-500" />
              Fotos das Não Conformidades ({allPhotos.length})
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {allPhotos.map((photo, i) => (
              <div key={i} className="space-y-1.5">
                <img
                  src={photo.url}
                  alt={photo.label}
                  className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                />
                <p className="text-xs text-gray-500 truncate px-1">{photo.label}</p>
              </div>
            ))}
          </div>
          {allPhotos.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma foto registrada</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
