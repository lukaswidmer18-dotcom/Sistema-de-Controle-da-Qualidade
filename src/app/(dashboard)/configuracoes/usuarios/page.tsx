'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, ShieldAlert, Loader2, User, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { getRoleLabel } from '@/lib/utils'
import type { UserRole } from '@/types'

interface UserRow {
  id: string
  name: string
  email: string
  role: UserRole
  unit: string | null
  isActive: boolean
  createdAt: string
}

interface UserFormData {
  name: string
  email: string
  password: string
  role: UserRole
  unit: string
  isActive: boolean
}

interface UnitOption {
  label: string
  value: string
}

const EMPTY_FORM: UserFormData = {
  name: '',
  email: '',
  password: '',
  role: 'QUALIDADE',
  unit: '',
  isActive: true,
}

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-brand-gold/16 text-brand-green border-brand-gold/35',
  QUALIDADE: 'bg-brand-green/10 text-brand-green border-brand-green/20',
}

export default function UsuariosPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<UserRow[]>([])
  const [units, setUnits] = useState<UnitOption[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN'

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Erro ao carregar usuários')
      const data = await res.json() as { users: UserRow[] }
      setUsers(data.users || [])
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await fetch('/api/config-lists?name=AVALIADORES')
        if (!res.ok) return
        const data = await res.json() as { list?: { options: UnitOption[] } }
        if (data.list?.options) setUnits(data.list.options)
      } catch {
        // lista de unidades é auxiliar; falha silenciosa não bloqueia gestão de usuários
      }
    }
    void fetchUnits()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (user: UserRow) => {
    setEditingId(user.id)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      unit: user.unit || '',
      isActive: user.isActive,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('E-mail válido é obrigatório')
      return
    }
    if (!editingId && !formData.password) {
      toast.error('Senha é obrigatória para novos usuários')
      return
    }
    if (formData.role === 'QUALIDADE' && !formData.unit) {
      toast.error('Unidade é obrigatória para o perfil Qualidade')
      return
    }

    setSaving(true)
    try {
      const url = editingId ? `/api/users/${editingId}` : '/api/users'
      const method = editingId ? 'PUT' : 'POST'

      const payload: Partial<UserFormData> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        unit: formData.role === 'QUALIDADE' ? formData.unit : '',
        isActive: formData.isActive,
      }
      if (formData.password) {
        payload.password = formData.password
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Erro ao salvar usuário')
      }

      toast.success(editingId ? 'Usuário atualizado!' : 'Usuário criado!')
      setModalOpen(false)
      void fetchUsers()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const updateForm = <K extends keyof UserFormData>(key: K, value: UserFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Erro ao deletar usuário')
      }
      toast.success('Usuário deletado!')
      setDeleteTarget(null)
      void fetchUsers()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen brand-shell flex items-center justify-center">
        <div className="brand-card motion-enter text-center rounded-xl p-12 max-w-sm">
          <ShieldAlert className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-sm text-gray-500">
            Somente administradores podem gerenciar usuários.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen brand-shell">
      {/* Header */}
      <div className="brand-header px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Gerenciamento de Usuários</h1>
            <p className="text-sm text-white/65">{users.length} usuário(s) cadastrado(s)</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="brand-card motion-enter text-center py-16 text-gray-400 rounded-xl">
            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhum usuário cadastrado</p>
          </div>
        ) : (
          <div className="brand-card motion-enter rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-brand-cream border-b border-brand-gold/20">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuário</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">E-mail</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Perfil</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unidade</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-brand-cream/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-gray-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900 text-sm">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs border ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {user.role === 'QUALIDADE'
                        ? (units.find(u => u.value === user.unit)?.label || user.unit || '-')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {user.isActive
                          ? <CheckCircle2 className="w-4 h-4 text-brand-green" />
                          : <XCircle className="w-4 h-4 text-gray-400" />}
                        <span className={`text-xs ${user.isActive ? 'text-brand-green' : 'text-gray-400'}`}>
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(user)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(user)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          disabled={user.id === (session?.user as { id?: string } | undefined)?.id}
                          title={user.id === (session?.user as { id?: string } | undefined)?.id ? 'Não é possível deletar sua própria conta' : 'Deletar usuário'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Confirmação Delete */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Deletar Usuário</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Tem certeza que deseja deletar <strong>{deleteTarget?.name}</strong>?
            Essa ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="gap-2"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Criar/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Nome Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={e => updateForm('name', e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                E-mail <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => updateForm('email', e.target.value)}
                placeholder="usuario@empresa.com"
                disabled={!!editingId}
              />
              {editingId && (
                <p className="text-xs text-gray-400">E-mail não pode ser alterado</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Senha {!editingId && <span className="text-red-500">*</span>}
                {editingId && <span className="text-gray-400 font-normal ml-1">(deixe em branco para não alterar)</span>}
              </Label>
              <Input
                type="password"
                value={formData.password}
                onChange={e => updateForm('password', e.target.value)}
                placeholder={editingId ? 'Nova senha (opcional)' : 'Senha'}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Perfil</Label>
              <Select
                value={formData.role}
                onValueChange={val => updateForm('role', val as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="QUALIDADE">Qualidade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'QUALIDADE' && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Unidade <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.unit}
                  onValueChange={val => updateForm('unit', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.isActive}
                onCheckedChange={val => updateForm('isActive', val)}
              />
              <Label className="text-sm">Usuário ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
