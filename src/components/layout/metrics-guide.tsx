'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  HelpCircle,
  ClipboardList,
  Camera,
  FileStack,
  ClipboardCheck,
  Building2,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getStatusColor, getStatusLabel } from '@/lib/utils'

interface SectionProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  adminOnly?: boolean
}

function Section({ title, icon: Icon, children, adminOnly }: SectionProps) {
  return (
    <div className={`rounded-xl border p-5 space-y-3 ${adminOnly ? 'border-brand-gold/35 bg-brand-gold/[0.03]' : 'border-gray-100'}`}>
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${adminOnly ? 'bg-brand-gold/16' : 'bg-brand-green/10'}`}>
          <Icon className={`w-4 h-4 ${adminOnly ? 'text-brand-gold' : 'text-brand-green'}`} />
        </div>
        <h3 className="text-sm font-bold text-brand-green">{title}</h3>
        {adminOnly && (
          <Badge className="text-[0.65rem] border bg-brand-gold/16 text-brand-green border-brand-gold/35">
            Só administrador
          </Badge>
        )}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function StatusRow({ status, description }: { status: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <Badge className={`text-xs border shrink-0 mt-0.5 ${getStatusColor(status)}`}>
        {getStatusLabel(status)}
      </Badge>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

function ColorBar({ rgb, title, description }: { rgb: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-100 overflow-hidden">
      <div className="self-stretch w-1.5 shrink-0" style={{ background: `rgba(${rgb},0.85)` }} />
      <div className="py-2.5 pr-3">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{description}</p>
      </div>
    </div>
  )
}

export function MetricsGuide() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN'

  if (!session?.user) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Guia de Métricas"
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-brand-green text-brand-gold border border-brand-gold/40 shadow-[0_12px_30px_-10px_rgba(22,65,58,0.6)] flex items-center justify-center hover:bg-brand-green/90 hover:scale-105 transition-all"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand-gold" />
              Guia de Métricas
            </DialogTitle>
            <p className="text-sm text-gray-500">Como interpretar os status e cores do sistema</p>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <Section title="Status do recebimento" icon={ClipboardList}>
              <p className="text-sm text-gray-500 -mt-1">
                Aparece no formulário e na listagem de PDFs Salvos. Indica a situação geral do recebimento.
              </p>
              <StatusRow status="CONFORME" description="Recebimento sem nenhuma não conformidade. Tudo certo." />
              <StatusRow status="NAO_CONFORME" description="Foi identificado pelo menos um item fora do padrão (veículo, carga ou temperatura). Precisa de plano de ação." />
              <StatusRow status="APROVADO_RESSALVA" description="Recebido com alguma ressalva, mas aprovado — não chega a ser não conformidade." />
              <StatusRow status="REPROVADO" description="Recebimento reprovado. Caso mais grave de não conformidade." />
              <StatusRow status="AGUARDANDO" description="Formulário criado, ainda não finalizado ou aguardando alguma tratativa." />
            </Section>

            <Section title="Itens do checklist (veículo e carga)" icon={Camera}>
              <StatusRow status="CONFORME" description="Item verificado e dentro do esperado." />
              <StatusRow status="NAO_CONFORME" description="Item fora do padrão. Foto e observação ficam obrigatórias para registrar a não conformidade." />
              <StatusRow status="NAO_APLICAVEL" description="Item não se aplica a este recebimento específico." />
              <p className="text-xs text-red-500 flex items-center gap-1 pt-1">
                <span>⚠</span> &quot;Foto obrigatória&quot; em vermelho: aparece quando o item é crítico (termômetro, lacre, termógrafo) ou quando foi marcado Não Conforme. O formulário não é salvo sem essa foto.
              </p>
            </Section>

            <Section title="Cores na listagem &quot;PDFs Salvos&quot;" icon={FileStack}>
              <p className="text-sm text-gray-500 -mt-1">
                A barra colorida na lateral esquerda de cada linha resume a pendência do recebimento, sem precisar abrir o relatório.
              </p>
              <ColorBar
                rgb="239,68,68"
                title="Vermelho — e-mail ainda não enviado"
                description="O relatório desse recebimento ainda não foi enviado por e-mail pra ninguém."
              />
              <ColorBar
                rgb="251,191,36"
                title="Âmbar — não conformidade sem plano de ação"
                description="E-mail já foi enviado, mas existe não conformidade registrada e o plano de ação ainda não foi feito."
              />
              <ColorBar
                rgb="52,211,153"
                title="Verde — sem pendência"
                description="E-mail enviado e, se houve não conformidade, o plano de ação já foi concluído."
              />
            </Section>

            <Section title="Planos de ação" icon={ClipboardCheck}>
              <div className="flex items-start gap-3">
                <Badge className="text-xs border bg-amber-50 text-amber-700 border-amber-200 shrink-0 mt-0.5">Pendente</Badge>
                <p className="text-sm text-gray-600 leading-relaxed">Não conformidade identificada, plano de ação corretivo ainda não foi registrado.</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="text-xs border bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0 mt-0.5">Concluído</Badge>
                <p className="text-sm text-gray-600 leading-relaxed">Causa raiz e ação corretiva já foram registradas, PDF gerado e enviado por e-mail.</p>
              </div>
            </Section>

            {isAdmin && (
              <>
                <Section title="Unidades e isolamento de dado" icon={Building2} adminOnly>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Cada usuário de perfil <strong>Qualidade</strong> fica vinculado a uma unidade (Centro de Distribuição) em
                    Configurações → Usuários. Ele só vê e cria recibos da própria unidade.
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Você, como <strong>Administrador</strong>, vê recibos de todas as unidades sem restrição — inclusive a coluna
                    <strong> Unidade</strong> na listagem de PDFs Salvos, que fica oculta pro perfil Qualidade (ele já sabe qual é a própria unidade).
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    A unidade do recibo é definida pelo campo <strong>Avaliador</strong> do formulário — não confundir com
                    <strong> Avaliado</strong>, que é o fornecedor/cliente sendo inspecionado naquele recebimento.
                  </p>
                </Section>

                <Section title="Perfis de usuário" icon={Users} adminOnly>
                  <div className="flex items-start gap-3">
                    <Badge className="text-xs border bg-brand-gold/16 text-brand-green border-brand-gold/35 shrink-0 mt-0.5">Administrador</Badge>
                    <p className="text-sm text-gray-600 leading-relaxed">Acesso total: todas as unidades, configurações do sistema, gestão de usuários.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="text-xs border bg-brand-green/10 text-brand-green border-brand-green/20 shrink-0 mt-0.5">Qualidade</Badge>
                    <p className="text-sm text-gray-600 leading-relaxed">Acesso restrito à própria unidade: cria e visualiza só os recibos dela.</p>
                  </div>
                </Section>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
