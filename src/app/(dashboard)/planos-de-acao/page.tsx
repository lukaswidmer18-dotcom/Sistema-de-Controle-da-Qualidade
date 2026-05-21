'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Search,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  CheckCircle2,
  Clock,
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
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ReceiptSummary {
  id: string
  formNumber: string
  invoiceNumber: string
  trailerPlate: string
  receivedAt: string
  qualityResponsible: string
  generalStatus: string
  _count: { nonConformities: number }
}

interface ActionPlanRow {
  id: string
  receiptId: string
  description: string
  responsible: string
  deadline: string
  rootCause: string
  status: string
  pdfUrl: string | null
  createdAt: string
  receipt: ReceiptSummary
}

interface Filters {
  dateFrom: string
  dateTo: string
  formNumber: string
  invoiceNumber: string
  trailerPlate: string
  responsible: string
  qualityResponsible: string
  status: string
}

const EMPTY_FILTERS: Filters = {
  dateFrom: '',
  dateTo: '',
  formNumber: '',
  invoiceNumber: '',
  trailerPlate: '',
  responsible: '',
  qualityResponsible: '',
  status: '',
}

const PAGE_SIZE = 15

function getPlanStatusStyle(status: string) {
  if (status === 'CONCLUIDO') {
    return {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      row: { boxShadow: 'inset 4px 0 0 rgba(52,211,153,0.75)', background: 'rgba(52,211,153,0.03)' },
    }
  }
  return {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    row: { boxShadow: 'inset 4px 0 0 rgba(251,191,36,0.85)', background: 'rgba(251,191,36,0.03)' },
  }
}

export default function PlanosDeAcaoPage() {
  const [rows, setRows] = useState<ActionPlanRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)

  const prevFiltersRef = useRef<Filters>(EMPTY_FILTERS)

  const fetchData = useCallback(async (f: Filters, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(p))
      params.set('limit', String(PAGE_SIZE))
      Object.entries(f).forEach(([key, value]) => {
        if (value) params.set(key, value)
      })
      const res = await fetch(`/api/action-plans?${params.toString()}`)
      if (!res.ok) throw new Error('Erro ao buscar dados')
      const data = await res.json() as { actionPlans: ActionPlanRow[]; total: number }
      setRows(data.actionPlans || [])
      setTotal(data.total || 0)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const filtersChanged = prevFiltersRef.current !== filters
    prevFiltersRef.current = filters

    if (filtersChanged) {
      const t = setTimeout(() => void fetchData(filters, 1), 350)
      return () => clearTimeout(t)
    } else {
      void fetchData(filters, page)
    }
  }, [filters, page, fetchData])

  const updateFilter = (key: keyof Filters, value: string) => {
    setPage(1)
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setPage(1)
    setFilters(EMPTY_FILTERS)
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '')
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen brand-shell">
      {/* Header */}
      <div className="brand-header px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.24em] mb-0.5" style={{ color: 'rgba(188,147,63,0.60)' }}>
              Administração
            </p>
            <h1 className="text-xl font-black tracking-tight text-white leading-none">Planos de Ação</h1>
            <p className="text-[0.75rem] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{total} plano(s) encontrado(s)</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(prev => !prev)}
            className={cn(
              'gap-2 border-white/[0.14] backdrop-blur-sm transition-all',
              hasActiveFilters
                ? 'bg-brand-gold/20 border-brand-gold/40 text-white'
                : 'bg-white/[0.07] text-white/80 hover:bg-white/[0.14] hover:text-white hover:border-white/25'
            )}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-brand-gold" />
            )}
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">

        {/* Filter panel */}
        {showFilters && (
          <div className="brand-card motion-enter rounded-xl p-5 space-y-4">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(22,65,58,0.45)' }}>
              Filtros dinâmicos
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Data de (registro plano)</Label>
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
                <Label className="text-xs text-gray-500">Status do Plano</Label>
                <Select
                  value={filters.status || 'ALL'}
                  onValueChange={val => updateFilter('status', val === 'ALL' ? '' : val)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Responsável (plano)</Label>
                <Input
                  value={filters.responsible}
                  onChange={e => updateFilter('responsible', e.target.value)}
                  placeholder="Nome do responsável"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Formulário</Label>
                <Input
                  value={filters.formNumber}
                  onChange={e => updateFilter('formNumber', e.target.value)}
                  placeholder="CMP-001"
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
                <Label className="text-xs text-gray-500">Resp. Qualidade</Label>
                <Input
                  value={filters.qualityResponsible}
                  onChange={e => updateFilter('qualityResponsible', e.target.value)}
                  placeholder="Nome"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex pt-1">
                <Button onClick={clearFilters} variant="outline" size="sm" className="gap-1.5">
                  <Search className="w-3.5 h-3.5" />
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="brand-card motion-enter-delay rounded-xl overflow-hidden">
          {loading ? (
            <SkeletonRows />
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: 'linear-gradient(145deg, #16413a, #24584f)',
                  boxShadow: '0 14px 34px -20px rgba(22,65,58,0.85), inset 0 1px 0 rgba(255,255,255,0.18)',
                }}
              >
                <ClipboardList className="w-7 h-7 text-white/60" />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'rgba(22,65,58,0.68)' }}>
                Nenhum plano de ação encontrado
              </p>
              <p className="text-xs mt-1.5 max-w-[240px] text-center text-gray-400 leading-relaxed">
                {hasActiveFilters
                  ? 'Tente ajustar os filtros para encontrar resultados'
                  : 'Planos de ação são criados ao receber formulários com não conformidades'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-cream border-b border-brand-gold/20">
                  <tr>
                    {[
                      'Data Registro',
                      'Formulário',
                      'NF',
                      'Placa',
                      'NCs',
                      'Responsável',
                      'Prazo',
                      'Resp. Qualidade',
                      'Status',
                      'Ações',
                    ].map(col => (
                      <th
                        key={col}
                        className="text-left px-4 py-3 text-[0.6875rem] font-bold uppercase tracking-[0.09em] whitespace-nowrap"
                        style={{ color: 'rgba(22,65,58,0.42)' }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map(row => {
                    const style = getPlanStatusStyle(row.status)
                    return (
                      <tr key={row.id} className="transition-colors" style={style.row}>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatDateTime(row.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/pdfs-salvos/${row.receipt.id}`}
                            className="font-mono text-xs font-medium text-brand-green hover:underline"
                          >
                            {row.receipt.formNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {row.receipt.invoiceNumber}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-gray-700">
                            {row.receipt.trailerPlate}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                            style={{
                              background: 'rgba(239,68,68,0.1)',
                              color: '#dc2626',
                            }}
                          >
                            {row.receipt._count.nonConformities}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 font-medium max-w-[140px] truncate">
                          {row.responsible}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {new Date(row.deadline + (row.deadline.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[120px] truncate">
                          {row.receipt.qualityResponsible}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn('text-xs border gap-1', style.badge)}>
                            {row.status === 'CONCLUIDO' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {row.status === 'CONCLUIDO' ? 'Concluído' : 'Pendente'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Link href={`/plano-acao/${row.receipt.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Ver plano de ação"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                            {row.pdfUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Baixar PDF do plano"
                                asChild
                              >
                                <a href={row.pdfUrl} download>
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t px-4 py-3 flex items-center justify-between" style={{ borderColor: 'rgba(22,65,58,0.08)' }}>
              <p className="text-[0.75rem]" style={{ color: 'rgba(22,65,58,0.42)' }}>
                Página{' '}
                <span className="font-semibold" style={{ color: 'rgba(22,65,58,0.68)' }}>{page}</span>
                {' '}de {totalPages} &middot; {total} registros
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-1 text-xs h-8 border-brand-green/20 text-brand-green/70 hover:bg-brand-green/[0.06] hover:text-brand-green hover:border-brand-green/30 transition-all disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="gap-1 text-xs h-8 border-brand-green/20 text-brand-green/70 hover:bg-brand-green/[0.06] hover:text-brand-green hover:border-brand-green/30 transition-all disabled:opacity-30"
                >
                  Próximo
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const SKEL = { background: 'rgba(22,65,58,0.07)', borderRadius: '4px' }

function SkeletonRows() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-4 py-4 flex gap-4 animate-pulse">
          <div className="h-4 w-28" style={SKEL} />
          <div className="h-4 w-24" style={SKEL} />
          <div className="h-4 w-20" style={SKEL} />
          <div className="h-4 w-16" style={SKEL} />
          <div className="h-4 w-8" style={SKEL} />
          <div className="h-4 w-28" style={SKEL} />
          <div className="h-4 w-20" style={SKEL} />
          <div className="h-4 w-24" style={SKEL} />
          <div className="h-4 w-16" style={SKEL} />
          <div className="h-4 w-16" style={SKEL} />
        </div>
      ))}
    </div>
  )
}
