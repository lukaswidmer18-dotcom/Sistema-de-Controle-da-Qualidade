import { useState, useEffect } from 'react'
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
  PanelLeftClose,
  PanelLeftOpen,
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
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load collapse state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setIsCollapsed(true)
  }, [])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  const handleSignOut = () => {
    setIsSigningOut(true)
    setTimeout(() => {
      void signOut({ callbackUrl: '/login' })
    }, 260)
  }

  return (
    <aside className={cn(
      "min-h-screen bg-brand-green text-white border-r border-brand-gold/20 flex flex-col shadow-[18px_0_60px_-42px_rgba(22,65,58,0.95)] transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo Area */}
      <div className={cn(
        "p-6 border-b border-white/10 flex items-center justify-between transition-all",
        isCollapsed ? "px-4" : "p-6"
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 brand-icon-gold rounded-lg flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-white drop-shadow-sm" />
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <p className="text-sm font-bold leading-tight text-white">Controle da</p>
              <p className="text-sm font-bold leading-tight text-brand-gold">Qualidade</p>
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleCollapse}
          className="text-white/40 hover:text-white hover:bg-white/10 hidden sm:flex"
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </Button>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                'flex items-center rounded-lg transition-all group px-3 py-2.5',
                isCollapsed ? 'justify-center gap-0' : 'gap-3',
                isActive
                  ? 'bg-white text-brand-green shadow-[0_16px_36px_-24px_rgba(0,0,0,0.5)]'
                  : 'text-white/74 hover:bg-white/9 hover:text-white'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-brand-gold' : 'text-white/46 group-hover:text-brand-gold')} />
              {!isCollapsed && (
                <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  <p className={cn('text-xs truncate', isActive ? 'text-brand-green/70' : 'text-white/42')}>{item.description}</p>
                </div>
              )}
              {isActive && !isCollapsed && <ChevronRight className="w-4 h-4 text-brand-gold flex-shrink-0" />}
            </Link>
          )
        })}

        {/* Divider */}
        <div className="pt-4 pb-2 px-3">
          {!isCollapsed ? (
            <p className="text-xs font-semibold text-brand-gold uppercase tracking-wider animate-in fade-in slide-in-from-left-2 duration-300">
              Configurações
            </p>
          ) : (
            <div className="h-px bg-white/10 w-full" />
          )}
        </div>

        {settingsItems.map((item) => {
          if (item.adminOnly && session?.user?.role !== 'ADMIN') return null
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                'flex items-center rounded-lg transition-all group px-3 py-2',
                isCollapsed ? 'justify-center gap-0' : 'gap-3',
                isActive
                  ? 'bg-white text-brand-green shadow-[0_16px_36px_-24px_rgba(0,0,0,0.5)]'
                  : 'text-white/74 hover:bg-white/9 hover:text-white'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-brand-gold' : 'text-white/46 group-hover:text-brand-gold')} />
              {!isCollapsed && (
                <span className="text-sm font-medium truncate animate-in fade-in slide-in-from-left-2 duration-300">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-white/10">
        {session?.user && (
          <div className={cn(
            "flex items-center gap-3 mb-3",
            isCollapsed && "justify-center"
          )}>
            <div className="w-8 h-8 bg-white/12 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-white/12">
              <span className="text-xs font-bold text-brand-gold">
                {session.user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
                <Badge variant="secondary" className="text-xs mt-0.5 border-brand-gold/30 bg-white/8 text-white">
                  {getRoleLabel(session.user.role || 'OPERACAO')}
                </Badge>
              </div>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "sm"}
          title={isCollapsed ? "Sair do sistema" : undefined}
          className={cn(
            'w-full justify-start text-white/70 hover:bg-white/10 hover:text-brand-gold',
            isCollapsed && 'justify-center',
            isSigningOut && 'motion-logout text-brand-gold'
          )}
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && (isSigningOut ? 'Saindo...' : 'Sair do sistema')}
        </Button>
      </div>
    </aside>
  )
}
