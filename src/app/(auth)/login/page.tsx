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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isEntering, setIsEntering] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

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
      toast.success('Login realizado com sucesso!')
      setTimeout(() => {
        router.push('/pdfs-salvos')
        router.refresh()
      }, 360)
    }
  }

  return (
    <div className="brand-shell min-h-screen flex items-center justify-center p-4">
      <div className={cn('w-full max-w-md transition-all duration-300', isEntering && 'translate-y-1 scale-[0.985] opacity-0')}>
        <div className="motion-enter text-center mb-8">
          <div className="brand-icon inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.34em] text-brand-gold">Grupo Pluma</p>
          <h1 className="text-3xl font-black text-brand-green">Controle da Qualidade</h1>
          <p className="text-brand-green/62 mt-1">Recebimento de Veículos</p>
        </div>

        <Card className="motion-enter-delay border-brand-green/12 bg-white/94 shadow-[var(--shadow-brand-deep)]">
          <CardHeader>
            <CardTitle className="text-brand-green">Acesso ao Sistema</CardTitle>
            <CardDescription>
              Informe suas credenciais para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register('email')}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
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

            <div className="brand-subtle mt-6 p-4 rounded-md text-xs text-brand-green/70">
              <p className="font-bold mb-1 text-brand-green">Usuários de demonstração:</p>
              <p>admin@empresa.com / admin123</p>
              <p>qualidade@empresa.com / qualidade123</p>
              <p>operacao@empresa.com / operacao123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
