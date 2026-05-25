'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  ShieldCheck,
  CheckCircle2,
  ClipboardCheck,
  Package,
  FileText,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type LoginForm = z.infer<typeof loginSchema>

const LOADING_STEPS = [
  'Verificando credenciais...',
  'Validando parâmetros de Qualidade...',
  'Inspecionando certificações...',
  'Acessando ambiente seguro...',
]

const FEATURES = [
  {
    icon: ClipboardCheck,
    label: 'Checklists de recebimento',
    desc: 'Formulários completos com fotos e não conformidades',
  },
  {
    icon: Package,
    label: 'Rastreabilidade de produtos',
    desc: 'Controle por lote, nota fiscal e placa do veículo',
  },
  {
    icon: FileText,
    label: 'Relatórios em PDF',
    desc: 'Exportação e envio automático por e-mail',
  },
  {
    icon: Lock,
    label: 'Acesso controlado',
    desc: 'Autenticação com controle de perfis por unidade',
  },
]


export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isEntering, setIsEntering] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const loadingProgress = Math.min(100, Math.round(((loadingStep + 1) / LOADING_STEPS.length) * 100))

  useEffect(() => {
    if (isEntering) {
      const interval = setInterval(() => {
        setLoadingStep(prev => prev < LOADING_STEPS.length - 1 ? prev + 1 : prev)
      }, 800)
      return () => clearInterval(interval)
    }
  }, [isEntering])

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError('')
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (result?.error) {
        setError('E-mail ou senha incorretos.')
        setIsLoading(false)
      } else {
        setIsEntering(true)
        setTimeout(() => {
          router.push('/pdfs-salvos')
          router.refresh()
        }, 3200)
      }
    } catch {
      setError('Erro ao conectar com o servidor. Tente novamente.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Loading overlay */}
      {isEntering && (
        <div className="login-entry-overlay overflow-hidden">
          <div className="login-entry-glow" aria-hidden="true" />
          <div className="login-verification-panel relative z-10 w-full max-w-[620px] rounded-xl p-6 sm:p-8 lg:p-10">
            <div className="flex items-start gap-5 sm:gap-6">
              <div className="login-verification-emblem flex h-20 w-20 shrink-0 items-center justify-center rounded-full sm:h-24 sm:w-24">
                <ShieldCheck className="login-verification-icon h-10 w-10 text-white sm:h-12 sm:w-12" />
              </div>
              <div className="min-w-0 pt-1.5 sm:pt-2">
                <div className="flex flex-col leading-none">
                  <span className="text-[0.5rem] font-black uppercase tracking-[0.50em] leading-none" style={{ color: 'rgba(188,147,63,0.70)' }}>Grupo</span>
                  <span className="text-[1.125rem] font-black uppercase tracking-[0.04em] leading-none mt-0.5 text-brand-gold">Pluma</span>
                </div>
                <h2 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Validando acesso
                </h2>
                <p className="mt-2 text-base font-semibold text-white/[0.62]" aria-live="polite">
                  {LOADING_STEPS[loadingStep]}
                </p>
              </div>
            </div>
            <div className="mt-8 space-y-2.5 sm:mt-10">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-white/[0.46]">
                <span>Progresso</span>
                <span>{loadingProgress}%</span>
              </div>
              <div className="login-progress-track h-2.5 overflow-hidden rounded-full">
                <div
                  className="login-progress-bar h-full rounded-full"
                  style={{ transform: `scaleX(${loadingProgress / 100})` }}
                />
              </div>
            </div>
            <div className="mt-7 space-y-3">
              {LOADING_STEPS.map((step, idx) => {
                const complete = idx < loadingStep
                const active = idx === loadingStep
                return (
                  <div
                    key={step}
                    className="login-step-row flex items-center gap-4 rounded-lg px-4 py-3"
                    data-active={active}
                    data-complete={complete}
                    style={{ animationDelay: `${idx * 90}ms` }}
                  >
                    <span className="login-step-marker flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                      {complete
                        ? <CheckCircle2 className="h-5 w-5" />
                        : <span className="h-2 w-2 rounded-full bg-current" />}
                    </span>
                    <span className="min-w-0 text-base font-semibold">{step}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-xs font-bold uppercase tracking-[0.18em] text-white/[0.38]">
              <span>Ambiente seguro</span>
              <span>Bello Alimentos LTDA</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Left brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[56%] xl:w-[58%] login-brand-panel relative overflow-hidden flex-col">
        <div className="brand-blob-1" aria-hidden="true" />
        <div className="brand-blob-2" aria-hidden="true" />
        <div className="brand-mesh" aria-hidden="true" />

        <div className="relative z-10 flex flex-col h-full px-10 py-10 xl:px-14 xl:py-12">
          {/* Top: brand mark */}
          <div className="flex flex-col leading-none">
            <span className="text-[0.875rem] font-black uppercase tracking-[0.45em] leading-none" style={{ color: 'rgba(188,147,63,0.65)' }}>Grupo</span>
            <span className="text-[3.25rem] font-black uppercase tracking-[0.04em] leading-none mt-1 text-brand-gold">Pluma</span>
          </div>

          {/* Middle: headline + stats + features */}
          <div className="my-auto pt-8">
            <h1 className="login-hero-headline text-white">
              Controle<br />
              <span className="login-headline-gold">da Qualidade</span>
            </h1>
            <p className="mt-5 text-[0.9375rem] text-white/50 max-w-[380px] leading-relaxed">
              Plataforma integrada de monitoramento e rastreabilidade no recebimento de insumos e produtos.
            </p>

            {/* Section divider */}
            <div className="login-section-divider mt-8 mb-6" />

            {/* Features */}
            <div className="space-y-2.5">
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  className="login-feature-item flex items-center gap-3.5"
                  style={{ animationDelay: `${150 + i * 75}ms` }}
                >
                  <div className="login-feature-icon-box w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0">
                    <f.icon className="w-[17px] h-[17px]" />
                  </div>
                  <div>
                    <p className="text-[0.8125rem] font-semibold text-white/85 leading-tight">{f.label}</p>
                    <p className="text-[0.75rem] text-white/60 leading-snug mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: footer */}
          <p className="text-[0.6875rem] text-white/70 tracking-wide">
            © 2026 Bello Alimentos LTDA · Desenvolvido por Lukas Widmer
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div
        className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 login-form-panel"
        style={{ borderLeft: '1px solid rgba(22,65,58,0.07)' }}
      >
        <div className={cn(
          'w-full max-w-[360px] transition-all duration-700',
          isEntering && 'scale-[0.96] opacity-0 blur-sm'
        )}>

          {/* Mobile brand (hidden on desktop) */}
          <div className="lg:hidden text-center mb-10 motion-enter">
            <div className="flex flex-col items-center leading-none mb-4">
              <span className="text-[0.5625rem] font-black uppercase tracking-[0.52em] leading-none" style={{ color: 'rgba(188,147,63,0.70)' }}>Grupo</span>
              <span className="text-[2rem] font-black uppercase tracking-[0.04em] leading-none mt-1 text-brand-gold">Pluma</span>
            </div>
            <h1 className="text-[1.75rem] font-black tracking-tight text-brand-green leading-tight">
              Controle da Qualidade
            </h1>
            <p className="text-sm text-gray-400 mt-2">Recebimento de Veículos</p>
          </div>

          {/* Form header */}
          <div className="mb-7 motion-enter">
            <h2 className="text-[1.75rem] font-black tracking-tight text-brand-green leading-tight">
              Bem-vindo de volta
            </h2>
            <p className="text-sm text-gray-400 mt-1.5">
              Informe suas credenciais para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 motion-enter-delay">
            {error && (
              <Alert variant="destructive" className="text-sm py-2.5">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[0.8125rem] font-semibold text-gray-600">
                E-mail
              </Label>
              <div className="relative login-input-wrapper">
                <Mail className="login-input-icon" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register('email')}
                  disabled={isLoading}
                  className="h-11 pl-[2.375rem] bg-white border-gray-200 text-gray-900 placeholder:text-gray-300 focus-visible:ring-brand-green/20 focus-visible:border-brand-green/60 transition-colors"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[0.8125rem] font-semibold text-gray-600">
                Senha
              </Label>
              <div className="relative login-input-wrapper">
                <KeyRound className="login-input-icon" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  disabled={isLoading}
                  className="h-11 pl-[2.375rem] bg-white border-gray-200 text-gray-900 placeholder:text-gray-300 focus-visible:ring-brand-green/20 focus-visible:border-brand-green/60 transition-colors"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold transition-all active:scale-[0.985] mt-2 group"
              disabled={isLoading}
              style={{
                background: isLoading
                  ? 'rgba(22,65,58,0.40)'
                  : 'linear-gradient(135deg, #16413a 0%, #1d5c51 60%, #16413a 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: isLoading ? 'none' : '0 8px 24px -10px rgba(22,65,58,0.58)',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Entrando...
                </>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Entrar
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </Button>
          </form>

          {/* Trust row */}
          <div className="login-trust-row">
            <Lock className="w-3 h-3" />
            <span>Conexão segura</span>
            <span className="login-trust-dot" />
            <span>SSL</span>
            <span className="login-trust-dot" />
            <span>Bello Alimentos</span>
          </div>

        </div>
      </div>
    </div>
  )
}
