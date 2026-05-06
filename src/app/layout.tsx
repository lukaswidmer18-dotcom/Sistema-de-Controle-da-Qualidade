import type { Metadata } from 'next'
import { Source_Sans_3 } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-source-sans',
})

export const metadata: Metadata = {
  title: 'Controle da Qualidade — Recebimento de Veículos',
  description: 'Sistema de controle de qualidade para recebimento de veículos e produtos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={sourceSans.className}>
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
