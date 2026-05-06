import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

export function generateFormNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 9000) + 1000
  return `REC-${year}${month}${day}-${random}`
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    CONFORME: 'Conforme',
    NAO_CONFORME: 'Não Conforme',
    APROVADO_RESSALVA: 'Aprovado com Ressalva',
    REPROVADO: 'Reprovado',
    AGUARDANDO: 'Aguardando Tratativa',
    NAO_APLICAVEL: 'Não Aplicável',
    ABERTA: 'Aberta',
    EM_ANALISE: 'Em Análise',
    CONCLUIDA: 'Concluída',
  }
  return labels[status] || status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    CONFORME: 'bg-green-100 text-green-800 border-green-200',
    NAO_CONFORME: 'bg-red-100 text-red-800 border-red-200',
    APROVADO_RESSALVA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    REPROVADO: 'bg-red-200 text-red-900 border-red-300',
    AGUARDANDO: 'bg-blue-100 text-blue-800 border-blue-200',
    NAO_APLICAVEL: 'bg-gray-100 text-gray-600 border-gray-200',
    ABERTA: 'bg-orange-100 text-orange-800 border-orange-200',
    EM_ANALISE: 'bg-blue-100 text-blue-800 border-blue-200',
    CONCLUIDA: 'bg-green-100 text-green-800 border-green-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-600 border-gray-200'
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: 'Administrador',
    QUALIDADE: 'Qualidade',
    OPERACAO: 'Operação',
  }
  return labels[role] || role
}

export function interpolateTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match
  })
}
