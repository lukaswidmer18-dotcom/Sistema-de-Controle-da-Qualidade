import { GeneralStatus, ChecklistStatus } from './types'

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    CONFORME: 'Conforme',
    NAO_CONFORME: 'Não Conforme',
    APROVADO_RESSALVA: 'Aprovado c/ Ressalva',
    REPROVADO: 'Reprovado',
    AGUARDANDO: 'Aguardando',
    ABERTA: 'Aberta',
    EM_ANALISE: 'Em Análise',
    CONCLUIDA: 'Concluída',
    CONCLUIDO: 'Concluído',
    PENDENTE: 'Pendente',
  }
  return labels[status] ?? status
}

export function getStatusColor(status: GeneralStatus | string): string {
  const colors: Record<string, string> = {
    CONFORME: '#16a34a',
    NAO_CONFORME: '#dc2626',
    APROVADO_RESSALVA: '#d97706',
    REPROVADO: '#991b1b',
    AGUARDANDO: '#6b7280',
  }
  return colors[status] ?? '#6b7280'
}

export function getChecklistStatusLabel(status: ChecklistStatus | undefined): string {
  if (!status) return 'Não avaliado'
  const labels: Record<ChecklistStatus, string> = {
    CONFORME: 'Conforme',
    NAO_CONFORME: 'Não Conforme',
    NAO_APLICAVEL: 'N/A',
  }
  return labels[status]
}

export function generateFormNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `REC-${year}${month}${day}-${rand}`
}

export function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}

export function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
