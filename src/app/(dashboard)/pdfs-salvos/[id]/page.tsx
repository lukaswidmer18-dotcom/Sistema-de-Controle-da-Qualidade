'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Loader2,
  FileText,
  Download,
  Mail,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Thermometer,
  Truck,
  Package,
  ClipboardList,
  RefreshCw,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { EmailSendModal } from '@/components/form/email-send-modal'
import { getStatusLabel, getStatusColor, formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ProductDetail {
  id: string
  productCode: string
  productDescription?: string | null
  lot: string
  quantity?: string | null
}

interface ChecklistDetail {
  key: string
  label: string
  section: string
  status?: string | null
  observation?: string | null
  photos?: Array<{ fileUrl: string }>
}

interface TemperatureDetail {
  id: string
  productCode?: string | null
  lot?: string | null
  temperatureType: string
  temperature?: number | null
  unit: string
  status?: string | null
  observation?: string | null
  photoUrl?: string | null
}

interface NonConformityDetail {
  id: string
  section: string
  description?: string | null
  photoUrl?: string | null
  status: string
}

interface ReceiptDetail {
  id: string
  formNumber: string
  receivedAt: string
  evaluatorName: string
  unit: string
  operationResponsible: string
  qualityResponsible: string
  receivingOrder: string
  invoiceNumber: string
  vehicleType: string
  trailerPlate: string
  observations?: string | null
  generalStatus: string
  pdfUrl?: string | null
  htmlUrl?: string | null
  emailSentAt?: string | null
  products: ProductDetail[]
  vehicleChecklist?: ChecklistDetail[]
  cargoChecklist?: ChecklistDetail[]
  temperatures: TemperatureDetail[]
  nonConformities: NonConformityDetail[]
}

export default function ReceiptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await fetch(`/api/receipts/${id}`)
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        if (!res.ok) throw new Error('Erro ao carregar')
        const data = await res.json() as ReceiptDetail
        setReceipt(data)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro inesperado'
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }
    void fetchReceipt()
  }, [id])

  const generatePdf = async () => {
    if (!receipt) return
    setGeneratingPdf(true)
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptId: receipt.id }),
      })
      if (!res.ok) throw new Error('Erro ao gerar PDF')
      const data = await res.json() as { pdfUrl?: string }
      setReceipt(prev => prev ? { ...prev, pdfUrl: data.pdfUrl ?? prev.pdfUrl } : prev)
      toast.success('PDF gerado com sucesso!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      toast.error(message)
    } finally {
      setGeneratingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen brand-shell flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (notFound || !receipt) {
    return (
      <div className="min-h-screen brand-shell flex items-center justify-center">
        <div className="brand-card motion-enter text-center rounded-xl p-12 max-w-sm">
          <AlertTriangle className="w-14 h-14 text-orange-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Formulário não encontrado</h2>
          <p className="text-sm text-gray-500 mb-4">
            O formulário solicitado não existe ou foi removido.
          </p>
          <Button onClick={() => router.back()} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  const ncCount = receipt.nonConformities.length

  return (
    <div className="min-h-screen brand-shell">
      {/* Header */}
      <div className="brand-header px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0 shrink-0 text-white/60 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.24em] mb-0.5" style={{ color: 'rgba(188,147,63,0.60)' }}>
                Formulário
              </p>
              <h1 className="text-lg font-black tracking-tight text-white leading-none truncate">
                {receipt.formNumber}
              </h1>
              <p className="text-[0.75rem] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{formatDateTime(receipt.receivedAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge className={cn('border text-xs', getStatusColor(receipt.generalStatus))}>
              {getStatusLabel(receipt.generalStatus)}
            </Badge>
            {!receipt.pdfUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={generatePdf}
                disabled={generatingPdf}
                className="gap-1.5 text-xs border-white/[0.14] bg-white/[0.07] text-white/80 hover:bg-white/[0.14] hover:text-white hover:border-white/25 transition-all"
              >
                {generatingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Gerar PDF
              </Button>
            )}
            {receipt.htmlUrl && (
              <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs border-white/[0.14] bg-white/[0.07] text-white/80 hover:bg-white/[0.14] hover:text-white hover:border-white/25 transition-all">
                <a href={receipt.htmlUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="w-3.5 h-3.5" />
                  Ver HTML
                </a>
              </Button>
            )}
            {receipt.pdfUrl && (
              <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs border-white/[0.14] bg-white/[0.07] text-white/80 hover:bg-white/[0.14] hover:text-white hover:border-white/25 transition-all">
                <a href={receipt.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="w-3.5 h-3.5" />
                  Ver PDF
                </a>
              </Button>
            )}
            {receipt.pdfUrl && (
              <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs border-white/[0.14] bg-white/[0.07] text-white/80 hover:bg-white/[0.14] hover:text-white hover:border-white/25 transition-all">
                <a href={receipt.pdfUrl} download>
                  <Download className="w-3.5 h-3.5" />
                  Baixar
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmailModal(true)}
              className="gap-1.5 text-xs border-white/[0.14] bg-white/[0.07] text-white/80 hover:bg-white/[0.14] hover:text-white hover:border-white/25 transition-all"
            >
              <Mail className="w-3.5 h-3.5" />
              E-mail
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Identificação */}
        <Section icon={<ClipboardList className="w-4 h-4" />} title="Identificação">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <InfoField label="Formulário" value={receipt.formNumber} mono />
            <InfoField label="Data/Hora" value={formatDateTime(receipt.receivedAt)} />
            <InfoField label="Avaliador" value={receipt.evaluatorName} />
            <InfoField label="Unidade" value={receipt.unit} />
            <InfoField label="Resp. Operação" value={receipt.operationResponsible} />
            <InfoField label="Resp. Qualidade" value={receipt.qualityResponsible} />
            <InfoField label="Ordem Recebimento" value={receipt.receivingOrder} mono />
            <InfoField label="Nota Fiscal" value={receipt.invoiceNumber} />
            <InfoField label="Tipo Veículo" value={receipt.vehicleType} />
            <InfoField label="Placa" value={receipt.trailerPlate} mono />
          </div>
          {receipt.observations && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-500 mb-1">Observações</p>
              <p className="text-sm text-gray-700">{receipt.observations}</p>
            </div>
          )}
        </Section>

        {/* Produtos */}
        <Section icon={<Package className="w-4 h-4" />} title={`Produtos (${receipt.products.length})`}>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-brand-cream border-b border-brand-gold/20">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Código</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Descrição</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Lote</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Qtd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {receipt.products.map(product => (
                  <tr key={product.id}>
                    <td className="px-3 py-2 text-xs font-mono font-medium text-gray-800">{product.productCode}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{product.productDescription || '—'}</td>
                    <td className="px-3 py-2 text-xs font-mono text-gray-700">{product.lot}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{product.quantity || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Temperaturas */}
        {receipt.temperatures.length > 0 && (
          <Section icon={<Thermometer className="w-4 h-4" />} title={`Temperaturas (${receipt.temperatures.length})`}>
            <div className="space-y-2">
              {receipt.temperatures.map((temp, index) => (
                <div key={temp.id} className="flex items-center justify-between brand-subtle rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-16">{index + 1}. {temp.temperatureType === 'CONGELADO' ? 'Cong.' : 'Resf.'}</span>
                    {temp.productCode && <span className="text-xs font-mono text-gray-700">{temp.productCode}</span>}
                    {temp.lot && <span className="text-xs text-gray-500">/ {temp.lot}</span>}
                    {temp.temperature !== null && temp.temperature !== undefined && (
                      <span className="text-sm font-semibold text-gray-800">{temp.temperature}{temp.unit}</span>
                    )}
                  </div>
                  {temp.status && (
                    <Badge className={cn('text-xs border', getStatusColor(temp.status))}>
                      {getStatusLabel(temp.status)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Checklist resumo */}
        {(receipt.vehicleChecklist?.length || receipt.cargoChecklist?.length) ? (
          <Section icon={<Truck className="w-4 h-4" />} title="Checklist">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...(receipt.vehicleChecklist || []), ...(receipt.cargoChecklist || [])].map((item, i) => (
                <div key={i} className="flex items-center justify-between brand-subtle rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-700 truncate flex-1">{item.label}</span>
                  {item.status && (
                    <Badge className={cn('text-xs border ml-2 shrink-0', getStatusColor(item.status))}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {/* Não Conformidades */}
        <Section
          icon={<AlertTriangle className="w-4 h-4" />}
          title={`Não Conformidades (${ncCount})`}
        >
          {ncCount === 0 ? (
            <div className="flex items-center gap-2 py-3 text-brand-green">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm">Nenhuma não conformidade registrada</span>
            </div>
          ) : (
            <div className="space-y-2">
              {receipt.nonConformities.map(nc => (
                <div key={nc.id} className="border border-red-200 bg-red-50/30 rounded-lg p-3 flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-red-700 mb-0.5">{nc.section}</p>
                    <p className="text-sm text-gray-700">{nc.description || '—'}</p>
                    <div className="mt-1.5">
                      <Badge className={cn('text-xs border', getStatusColor(nc.status))}>
                        {getStatusLabel(nc.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Separator />

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-gray-400 pb-4">
          <span>ID: {receipt.id}</span>
          {receipt.emailSentAt && (
            <span className="flex items-center gap-1 text-brand-green">
              <CheckCircle2 className="w-3.5 h-3.5" />
              E-mail enviado em {formatDateTime(receipt.emailSentAt)}
            </span>
          )}
        </div>
      </div>

      <EmailSendModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        receipt={{
          id: receipt.id,
          formNumber: receipt.formNumber,
          invoiceNumber: receipt.invoiceNumber,
          receivingOrder: receipt.receivingOrder,
          trailerPlate: receipt.trailerPlate,
          generalStatus: receipt.generalStatus,
          qualityResponsible: receipt.qualityResponsible,
          pdfUrl: receipt.pdfUrl ?? undefined,
          products: receipt.products.map(p => ({ productCode: p.productCode, lot: p.lot })),
          nonConformities: receipt.nonConformities.map(nc => ({ description: nc.description })),
        }}
        onSent={() => toast.success('E-mail enviado!')}
      />
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="brand-card motion-enter rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-brand-gold">{icon}</span>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="brand-subtle rounded-lg px-3 py-2.5">
      <p className="text-xs text-brand-green/58 mb-0.5">{label}</p>
      <p className={cn('text-sm text-brand-green font-semibold truncate', mono && 'font-mono')}>{value || '—'}</p>
    </div>
  )
}
