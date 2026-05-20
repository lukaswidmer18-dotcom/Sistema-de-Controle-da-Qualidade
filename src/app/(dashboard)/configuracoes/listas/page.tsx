'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Users, Loader2, Mail, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface Recipient {
  email: string
  name?: string | null
}

interface EmailList {
  id: string
  name: string
  description?: string | null
  isActive: boolean
  recipients: Recipient[]
}

interface ListFormData {
  name: string
  description: string
  isActive: boolean
  emailsRaw: string
}

const PAGE_SIZE = 8

const EMPTY_FORM: ListFormData = {
  name: '',
  description: '',
  isActive: true,
  emailsRaw: '',
}

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map(e => e.trim())
    .filter(e => e.includes('@'))
}

export default function ListasPage() {
  const [lists, setLists] = useState<EmailList[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ListFormData>(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(lists.length / PAGE_SIZE))
  const paginatedLists = lists.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const fetchLists = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/email-lists')
      if (!res.ok) throw new Error('Erro ao carregar listas')
      const data = await res.json() as { lists: EmailList[] }
      setLists(data.lists || [])
      setPage(1)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchLists()
  }, [fetchLists])

  const openCreate = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (list: EmailList) => {
    setEditingId(list.id)
    setFormData({
      name: list.name,
      description: list.description || '',
      isActive: list.isActive,
      emailsRaw: list.recipients.map(r => r.email).join('\n'),
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome da lista é obrigatório')
      return
    }

    const emails = parseEmails(formData.emailsRaw)
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      isActive: formData.isActive,
      recipients: emails.map(email => ({ email })),
    }

    setSaving(true)
    try {
      const url = editingId ? `/api/email-lists/${editingId}` : '/api/email-lists'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Erro ao salvar lista')
      }

      toast.success(editingId ? 'Lista atualizada!' : 'Lista criada!')
      setModalOpen(false)
      void fetchLists()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id)
  }

  const doDelete = async () => {
    if (!confirmDeleteId) return
    const id = confirmDeleteId
    setConfirmDeleteId(null)
    setDeleting(id)
    try {
      const res = await fetch(`/api/email-lists/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      toast.success('Lista excluída!')
      void fetchLists()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      toast.error(message)
    } finally {
      setDeleting(null)
    }
  }

  const updateForm = <K extends keyof ListFormData>(key: K, value: ListFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen brand-shell">
      {/* Header */}
      <div className="brand-header px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Listas de Transmissão</h1>
            <p className="text-sm text-white/65">Gerencie os grupos de destinatários de e-mail</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Lista
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : lists.length === 0 ? (
          <div className="brand-card motion-enter text-center py-16 text-gray-400 rounded-xl">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhuma lista criada</p>
            <p className="text-xs mt-1">Clique em "Nova Lista" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedLists.map(list => (
              <div
                key={list.id}
                className={cn(
                  'brand-card motion-enter rounded-xl p-5 flex items-center justify-between gap-4',
                  deleting === list.id && 'opacity-75'
                )}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${list.isActive ? 'bg-brand-green/10' : 'bg-gray-100'}`}>
                    <Users className={`w-5 h-5 ${list.isActive ? 'text-brand-green' : 'text-gray-400'}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 text-sm">{list.name}</span>
                      <Badge variant={list.isActive ? 'default' : 'secondary'} className="text-xs">
                        {list.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    {list.description && (
                      <p className="text-xs text-gray-500 mb-1 truncate max-w-sm">{list.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {list.recipients.length} destinatário(s)
                      {list.recipients.length > 0 && (
                        <span className="ml-1 text-gray-300">
                          — {list.recipients.slice(0, 3).map(r => r.email).join(', ')}
                          {list.recipients.length > 3 && ` +${list.recipients.length - 3}`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(list)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleDelete(list.id)}
                    disabled={deleting === list.id}
                    className={cn(
                      'h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50',
                      deleting === list.id && 'motion-delete'
                    )}
                  >
                    {deleting === list.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-1">
            <p className="text-xs text-gray-400">
              {lists.length} lista(s) — página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(p)}
                  className="h-8 w-8 p-0 text-xs"
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Lista' : 'Nova Lista de Transmissão'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Nome da Lista <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={e => updateForm('name', e.target.value)}
                placeholder="Ex: Equipe de Qualidade"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Descrição</Label>
              <Input
                value={formData.description}
                onChange={e => updateForm('description', e.target.value)}
                placeholder="Descrição opcional"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.isActive}
                onCheckedChange={val => updateForm('isActive', val)}
              />
              <Label className="text-sm">Lista ativa</Label>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Destinatários</Label>
              <Textarea
                value={formData.emailsRaw}
                onChange={e => updateForm('emailsRaw', e.target.value)}
                placeholder={'email1@empresa.com\nemail2@empresa.com\nou separados por vírgula'}
                rows={6}
                className="text-sm font-mono resize-none"
              />
              <p className="text-xs text-gray-400">
                Um e-mail por linha, ou separados por vírgula/ponto-e-vírgula.
                {formData.emailsRaw && (
                  <span className="ml-1 text-brand-gold">
                    {parseEmails(formData.emailsRaw).length} e-mail(s) válido(s)
                  </span>
                )}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? 'Salvar Alterações' : 'Criar Lista'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir lista</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Tem certeza que deseja excluir esta lista? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => void doDelete()}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
