'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  Search,
  Download,
  Mail,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmailSendModal } from '@/components/form/email-send-modal'
import { getStatusLabel, getStatusColor, formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ProductSummary {
  productCode: string
  lot: string
}

interface NonConformitySummary {
  description?: string | null
}

interface ReceiptRow {
  id: string
  formNumber: string
  invoiceNumber: string
  receivingOrder: string
  trailerPlate: string
  generalStatus: string
  qualityResponsible: string
  receivedAt: string
  pdfUrl?: string | null
  htmlUrl?: string | null
  emailSentAt?: string | null
  products: ProductSummary[]
  nonConformities: NonConformitySummary[]
}

interface Filters {
  dateFrom: string
  dateTo: string
  receivingOrder: string
  invoiceNumber: string
  trailerPlate: string
  productCode: string
  lot: string
  generalStatus: string
  qualityResponsible: string
}

const EMPTY_FILTERS: Filters = {
  dateFrom: '',
  dateTo: '',
  receivingOrder: '',
  invoiceNumber: '',
  trailerPlate: '',
  productCode: '',
  lot: '',
  generalStatus: '',
  qualityResponsible: '',
}

const PAGE_SIZE = 10

export default function PdfsSalvosPage() {
  const [rows, setRows] = useState<ReceiptRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [emailModal, setEmailModal] = useState<ReceiptRow | null>(null)

  const fetchData = useCallback(async (currentFilters: Filters, currentPage: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(currentPage))
      params.set('limit', String(PAGE_SIZE))

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) params.set(key, value)
      })

      const res = await fetch(`/api/receipts?${params.toString()}`)
      if (!res.ok) throw new Error('Erro ao buscar dados')
      const data = await res.json() as { receipts: ReceiptRow[]; total: number }
      setRows(data.receipts || [])
      setTotal(data.total || 0)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData(appliedFilters, page)
  }, [appliedFilters, page, fetchData])

  const applyFilters = () => {
    setAppliedFilters({ ...filters })
    setPage(1)
  }

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen brand-shell">
      {/* Header */}
      <div className="brand-header px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">PDFs Salvos</h1>
            <p className="text-sm text-white/65">{total} formulário(s) encontrado(s)</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(prev => !prev)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">

        {/* Filter panel */}
        {showFilters && (
          <div className="brand-card motion-enter rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Filtros de pesquisa</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Data de (recebimento)</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={e => updateFilter('dateFrom', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Data até</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={e => updateFilter('dateTo', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Ordem de Recebimento</Label>
                <Input
                  value={filters.receivingOrder}
                  onChange={e => updateFilter('receivingOrder', e.target.value)}
                  placeholder="OR-2024-001"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Nota Fiscal</Label>
                <Input
                  value={filters.invoiceNumber}
                  onChange={e => updateFilter('invoiceNumber', e.target.value)}
                  placeholder="NF-123456"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Placa</Label>
                <Input
                  value={filters.trailerPlate}
                  onChange={e => updateFilter('trailerPlate', e.target.value)}
                  placeholder="ABC-1234"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Código do Produto</Label>
                <Input
                  value={filters.productCode}
                  onChange={e => updateFilter('productCode', e.target.value)}
                  placeholder="000001"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Lote</Label>
                <Input
                  value={filters.lot}
                  onChange={e => updateFilter('lot', e.target.value)}
                  placeholder="LOT001"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Status Geral</Label>
                <Select
                  value={filters.generalStatus || 'ALL'}
                  onValueChange={val => updateFilter('generalStatus', val === 'ALL' ? '' : val)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="CONFORME">Conforme</SelectItem>
                    <SelectItem value="NAO_CONFORME">Não Conforme</SelectItem>
                    <SelectItem value="APROVADO_RESSALVA">Aprovado com Ressalva</SelectItem>
                    <SelectItem value="REPROVADO">Reprovado</SelectItem>
                    <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Resp. Qualidade</Label>
                <Input
                  value={filters.qualityResponsible}
                  onChange={e => updateFilter('qualityResponsible', e.target.value)}
                  placeholder="Nome"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={applyFilters} size="sm" className="gap-1.5">
                <Search className="w-3.5 h-3.5" />
                Pesquisar
              </Button>
              <Button onClick={clearFilters} variant="outline" size="sm">
                Limpar
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="brand-card motion-enter-delay rounded-xl overflow-hidden">
          {loading ? (
            <SkeletonRows />
          ) : rows.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Nenhum formulário encontrado</p>
              <p className="text-xs mt-1">Tente ajustar os filtros ou crie um novo formulário</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-cream border-b border-brand-gold/20">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Formulário</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">NF</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Placa</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produto / Lote</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Resp. Qualidade</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map(row => (
                    <tr key={row.id} className="hover:bg-brand-cream/60 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDateTime(row.receivedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-gray-800">{row.formNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{row.invoiceNumber}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-gray-700">{row.trailerPlate}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5 max-w-[160px]">
                          {row.products.slice(0, 2).map((p, i) => (
                            <div key={i} className="text-xs text-gray-600 truncate">
                              <span className="font-medium">{p.productCode}</span>
                              {p.lot && <span className="text-gray-400"> / {p.lot}</span>}
                            </div>
                          ))}
                          {row.products.length > 2 && (
                            <span className="text-xs text-gray-400">+{row.products.length - 2} mais</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Badge className={cn('text-xs border', getStatusColor(row.generalStatus))}>
                            {getStatusLabel(row.generalStatus)}
                          </Badge>
                          {row.emailSentAt && (
                            <span title="E-mail enviado" aria-label="E-mail enviado">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-[120px] truncate">
                        {row.qualityResponsible}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {row.htmlUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title="Ver relatório"
                              onClick={() => window.open(row.htmlUrl!, '_blank')}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {row.pdfUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title="Baixar PDF"
                              asChild
                            >
                              <a href={row.pdfUrl} download>
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="Enviar por e-mail"
                            onClick={() => setEmailModal(row)}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Página {page} de {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-1 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="gap-1 text-xs"
                >
                  Próximo
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {emailModal && (
        <EmailSendModal
          open={!!emailModal}
          onOpenChange={open => { if (!open) setEmailModal(null) }}
          receipt={{
            id: emailModal.id,
            formNumber: emailModal.formNumber,
            invoiceNumber: emailModal.invoiceNumber,
            receivingOrder: emailModal.receivingOrder,
            trailerPlate: emailModal.trailerPlate,
            generalStatus: emailModal.generalStatus,
            qualityResponsible: emailModal.qualityResponsible,
            pdfUrl: emailModal.pdfUrl ?? undefined,
            products: emailModal.products,
            nonConformities: emailModal.nonConformities,
          }}
          onSent={() => {
            toast.success('E-mail enviado!')
            void fetchData(appliedFilters, page)
          }}
        />
      )}
    </div>
  )
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-4 py-4 flex gap-4 animate-pulse">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 flex-1 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}
