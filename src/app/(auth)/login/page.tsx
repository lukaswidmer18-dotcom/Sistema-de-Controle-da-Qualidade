'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type LoginForm = z.infer<typeof loginSchema>

const LOADING_STEPS = [
  "Verificando credenciais...",
  "Validando parâmetros de Qualidade...",
  "Inspecionando certificações...",
  "Acessando ambiente seguro..."
];

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
        setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isEntering]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError('')

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
      // Tempo maior para mostrar a animação de qualidade
      setTimeout(() => {
        router.push('/pdfs-salvos')
        router.refresh()
      }, 3200)
    }
  }

  return (
    <div className="login-shell min-h-screen flex items-center justify-center p-4">
      {/* Blobs animados de fundo */}
      <div className="brand-blob-1" aria-hidden="true" />
      <div className="brand-blob-2" aria-hidden="true" />
      <div className="brand-blob-3" aria-hidden="true" />
      <div className="brand-mesh" aria-hidden="true" />

      {isEntering && (
        <div className="login-entry-overlay fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-4">
          <div className="login-entry-glow" aria-hidden="true" />

          <div className="login-verification-panel relative z-10 w-full max-w-md rounded-lg p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="login-verification-emblem flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
                <ShieldCheck className="login-verification-icon h-8 w-8 text-white" />
              </div>
              <div className="min-w-0 pt-1">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-brand-gold">
                  Grupo Pluma
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
                  Validando acesso
                </h2>
                <p className="mt-1 text-sm font-medium text-white/[0.58]" aria-live="polite">
                  {LOADING_STEPS[loadingStep]}
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.16em] text-white/[0.42]">
                <span>Progresso</span>
                <span>{loadingProgress}%</span>
              </div>
              <div className="login-progress-track h-2 overflow-hidden rounded-full">
                <div
                  className="login-progress-bar h-full rounded-full"
                  style={{ transform: `scaleX(${loadingProgress / 100})` }}
                />
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              {LOADING_STEPS.map((step, idx) => {
                const complete = idx < loadingStep
                const active = idx === loadingStep

                return (
                  <div
                    key={step}
                    className="login-step-row flex items-center gap-3 rounded-md px-3 py-2"
                    data-active={active}
                    data-complete={complete}
                    style={{ animationDelay: `${idx * 90}ms` }}
                  >
                    <span className="login-step-marker flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                      {complete ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <span className="min-w-0 text-sm font-semibold">{step}</span>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/[0.36]">
              <span>Ambiente seguro</span>
              <span>Bello Alimentos LTDA</span>
            </div>
          </div>
        </div>
      )}

      <div className={cn('w-full max-w-md transition-all duration-700 relative z-10', isEntering && 'scale-[0.96] opacity-0 blur-sm')}>
        <div className="motion-enter text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-5"
            style={{
              background: 'linear-gradient(145deg, rgba(188,147,63,0.28) 0%, rgba(22,65,58,0.55) 100%)',
              boxShadow: '0 0 0 1px rgba(188,147,63,0.38), 0 20px 50px -16px rgba(22,65,58,0.9), inset 0 1px 0 rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <p
            className="text-xs font-black uppercase tracking-[0.42em] mb-1"
            style={{ color: '#d4a84b', textShadow: '0 0 24px rgba(188,147,63,0.5)' }}
          >
            Grupo Pluma
          </p>
          <h1
            className="text-4xl font-black tracking-tight"
            style={{ color: '#ffffff', textShadow: '0 2px 20px rgba(22,65,58,0.6)' }}
          >
            Controle da Qualidade
          </h1>
          <p className="mt-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.52)' }}>
            Recebimento de Veículos
          </p>
        </div>

        <div
          className="motion-enter-delay rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.07)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 32px 80px -24px rgba(0,0,0,0.55), 0 0 0 1px rgba(188,147,63,0.15), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          <div className="mb-5">
            <h2 className="text-lg font-bold" style={{ color: '#ffffff' }}>Acesso ao Sistema</h2>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.48)' }}>
              Informe suas credenciais para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" style={{ color: 'rgba(255,255,255,0.70)' }}>E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                disabled={isLoading}
                className="bg-white/10 border-white/16 text-white placeholder:text-white/30 focus:border-amber-400/50 focus:ring-amber-400/20"
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" style={{ color: 'rgba(255,255,255,0.70)' }}>Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                disabled={isLoading}
                className="bg-white/10 border-white/16 text-white placeholder:text-white/30 focus:border-amber-400/50 focus:ring-amber-400/20"
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full font-semibold mt-2 transition-all active:scale-95"
              disabled={isLoading}
              style={{
                background: isLoading
                  ? 'rgba(188,147,63,0.4)'
                  : 'linear-gradient(135deg, #c9a04a 0%, #bc933f 50%, #a07c30 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 8px 24px -8px rgba(188,147,63,0.6)',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div
            className="mt-5 p-3 rounded-xl text-xs"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            <p className="font-bold mb-1" style={{ color: 'rgba(188,147,63,0.85)' }}>Usuários de demonstração:</p>
            <p>admin@empresa.com / admin123</p>
            <p>qualidade@empresa.com / qualidade123</p>
            <p>operacao@empresa.com / operacao123</p>
          </div>
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ color: 'rgba(255,255,255,0.28)' }}
        >
          © 2026 Grupo Pluma{' '}
          <span style={{ color: 'rgba(188,147,63,0.45)' }}>•</span>
          {' '}Desenvolvido por Lukas Widmer
        </p>
      </div>
    </div>
  )
}
