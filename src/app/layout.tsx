import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import NextTopLoader from 'nextjs-toploader'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Controle da Qualidade — Recebimento de Veículos',
  description: 'Sistema de controle de qualidade para recebimento de veículos e produtos',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="%2316413a"/><text x="50%25" y="54%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial Black,sans-serif" font-weight="900" font-size="18" fill="%23bc933f">P</text></svg>',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <NextTopLoader color="#BC933F" height={3} showSpinner={false} />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#16413A',
              border: '1px solid rgba(188, 147, 63, 0.24)',
              borderRadius: '8px',
              boxShadow: '0 18px 45px -24px rgba(22, 65, 58, 0.55)',
            },
            success: { iconTheme: { primary: '#16413A', secondary: '#fff' } },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  )
}
