'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  FileText,
  Plus,
  Settings,
  Mail,
  FileStack,
  Users,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getRoleLabel } from '@/lib/utils'

const navItems = [
  {
    href: '/pdfs-salvos',
    label: 'PDFs Salvos',
    icon: FileStack,
    description: 'Biblioteca de relatórios',
  },
  {
    href: '/novo-formulario',
    label: 'Novo Formulário',
    icon: Plus,
    description: 'Registrar recebimento',
  },
]

const settingsItems = [
  {
    href: '/configuracoes/listas',
    label: 'Listas de E-mail',
    icon: Mail,
  },
  {
    href: '/configuracoes/modelos',
    label: 'Modelos de E-mail',
    icon: FileText,
  },
  {
    href: '/configuracoes/usuarios',
    label: 'Usuários',
    icon: Users,
    adminOnly: true,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">Controle da</p>
            <p className="text-sm font-bold text-blue-600 leading-tight">Qualidade</p>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.label}</p>
                <p className={cn('text-xs truncate', isActive ? 'text-blue-500' : 'text-gray-400')}>{item.description}</p>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0" />}
            </Link>
          )
        })}

        {/* Divider */}
        <div className="pt-4 pb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">Configurações</p>
        </div>

        {settingsItems.map((item) => {
          if (item.adminOnly && session?.user?.role !== 'ADMIN') return null
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all group',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-100">
        {session?.user && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-blue-600">
                {session.user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{session.user.name}</p>
              <Badge variant="secondary" className="text-xs mt-0.5">
                {getRoleLabel(session.user.role || 'OPERACAO')}
              </Badge>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair do sistema
        </Button>
      </div>
    </aside>
  )
}
