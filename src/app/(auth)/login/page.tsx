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

      {/* Loading Overlay Premium */}
      {isEntering && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0d2b26]/95 backdrop-blur-3xl animate-in fade-in duration-700 overflow-hidden">
          {/* Luzes de fundo dinâmicas */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-gold/10 blur-[120px] rounded-full animate-pulse" />
          
          <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-lg px-6">
            <div className="relative">
              {/* Escudo Central Maior */}
              <div className="relative w-48 h-48 rounded-full brand-icon-gold flex items-center justify-center border-4 border-white/20 shadow-[0_0_100px_-10px_rgba(188,147,63,0.5)] animate-shield-pulse overflow-hidden">
                <ShieldCheck className="w-24 h-24 text-white drop-shadow-2xl" />
                
                {/* Scanner Line mais visível */}
                <div className="absolute left-0 right-0 h-1.5 bg-white/80 shadow-[0_0_25px_4px_rgba(255,255,255,0.9)] z-10 animate-quality-scan" />
              </div>
              
              {/* Anéis orbitais */}
              <div className="absolute -inset-6 border-2 border-brand-gold/20 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
              <div className="absolute -inset-12 border border-white/5 rounded-full border-dashed animate-[spin_15s_linear_infinite_reverse]" />
            </div>

            <div className="text-center space-y-8 w-full">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                  Inspecionando Acesso
                </h2>
                <div className="h-1 w-24 bg-brand-gold mx-auto rounded-full opacity-50" />
              </div>
              
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-4 bg-white/5 py-3 px-6 rounded-2xl border border-white/10 backdrop-blur-md w-full max-w-sm">
                  <div className="relative flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-brand-gold animate-spin" />
                    <div className="absolute inset-0 bg-brand-gold/20 blur-md rounded-full animate-pulse" />
                  </div>
                  <p className="text-base font-bold text-white/90 animate-status-fade tracking-wide">
                    {LOADING_STEPS[loadingStep]}
                  </p>
                </div>

                <div className="flex justify-center gap-2">
                  {LOADING_STEPS.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-700",
                        idx <= loadingStep ? "w-10 bg-brand-gold shadow-[0_0_10px_rgba(188,147,63,0.5)]" : "w-3 bg-white/10"
                      )} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé fixado no fundo real */}
          <div className="absolute bottom-12 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-white/40 text-xs font-black uppercase tracking-[0.3em]">
              <CheckCircle2 className="w-4 h-4 text-brand-gold" />
              Padrão de Qualidade Grupo Pluma
            </div>
            <div className="text-[10px] text-white/20 font-medium">Bello Alimentos LTDA • Ambiente Seguro</div>
          </div>
        </div>
      )}

      <div className={cn('w-full max-w-md transition-all duration-700 relative z-10', isEntering && 'scale-[0.8] opacity-0 blur-3xl')}>
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
