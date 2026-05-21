import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AuthProvider } from '@/components/layout/session-provider'

export default async function StandaloneLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  return (
    <AuthProvider>
      <div className="brand-shell min-h-screen">
        {children}
      </div>
    </AuthProvider>
  )
}
