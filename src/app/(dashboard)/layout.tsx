import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { AuthProvider } from '@/components/layout/session-provider'
import { MetricsGuide } from '@/components/layout/metrics-guide'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  return (
    <AuthProvider>
      <div className="brand-shell flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <MetricsGuide />
      </div>
    </AuthProvider>
  )
}
