'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Mail, Loader2, ToggleLeft } from 'lucide-react'
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

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  isActive: boolean
}

interface TemplateFormData {
  name: string
  subject: string
  body: string
  isActive: boolean
}

const EMPTY_FORM: TemplateFormData = {
  name: '',
  subject: '',
  body: '',
  isActive: true,
}

const TEMPLATE_VARIABLES = [
  { key: '{{numero_formulario}}', label: 'Nº Formulário' },
  { key: '{{data_recebimento}}', label: 'Data Recebimento' },
  { key: '{{ordem_recebimento}}', label: 'Ordem Recebimento' },
  { key: '{{nota_fiscal}}', label: 'Nota Fiscal' },
  { key: '{{placa}}', label: 'Placa' },
  { key: '{{codigo_produto}}', label: 'Código Produto' },
  { key: '{{lote}}', label: 'Lote' },
  { key: '{{status_geral}}', label: 'Status Geral' },
  { key: '{{responsavel_qualidade}}', label: 'Resp. Qualidade' },
  { key: '{{resumo_nao_conformidade}}', label: 'Resumo NC' },
]

export default function ModelosPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<TemplateFormData>(EMPTY_FORM)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/email-templates')
      if (!res.ok) throw new Error('Erro ao carregar modelos')
      const data = await res.json() as { templates: EmailTemplate[] }
      setTemplates(data.templates || [])
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchTemplates()
  }, [fetchTemplates])

  const openCreate = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (template: EmailTemplate) => {
    setEditingId(template.id)
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      isActive: template.isActive,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome do modelo é obrigatório')
      return
    }
    if (!formData.subject.trim()) {
      toast.error('Assunto é obrigatório')
      return
    }
    if (!formData.body.trim()) {
      toast.error('Corpo do e-mail é obrigatório')
      return
    }

    setSaving(true)
    try {
      const url = editingId ? `/api/email-templates/${editingId}` : '/api/email-templates'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Erro ao salvar modelo')
      }

      toast.success(editingId ? 'Modelo atualizado!' : 'Modelo criado!')
      setModalOpen(false)
      void fetchTemplates()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este modelo?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/email-templates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      toast.success('Modelo excluído!')
      void fetchTemplates()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      toast.error(message)
    } finally {
      setDeleting(null)
    }
  }

  const insertVariable = (variable: string) => {
    const textarea = bodyRef.current
    if (!textarea) {
      setFormData(prev => ({ ...prev, body: prev.body + variable }))
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newBody = formData.body.substring(0, start) + variable + formData.body.substring(end)
    setFormData(prev => ({ ...prev, body: newBody }))
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variable.length, start + variable.length)
    }, 0)
  }

  const updateForm = <K extends keyof TemplateFormData>(key: K, value: TemplateFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Modelos de E-mail</h1>
            <p className="text-sm text-gray-500">Crie modelos reutilizáveis para envio de relatórios</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Modelo
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-xl border">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhum modelo criado</p>
            <p className="text-xs mt-1">Clique em "Novo Modelo" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map(template => (
              <div
                key={template.id}
                className="bg-white rounded-xl border shadow-sm p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${template.isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Mail className={`w-5 h-5 ${template.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 text-sm">{template.name}</span>
                      <Badge variant={template.isActive ? 'default' : 'secondary'} className="text-xs">
                        {template.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate max-w-sm">
                      <span className="text-gray-400">Assunto: </span>{template.subject}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(template)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleDelete(template.id)}
                    disabled={deleting === template.id}
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                  >
                    {deleting === template.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Modelo' : 'Novo Modelo de E-mail'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Nome do Modelo <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={e => updateForm('name', e.target.value)}
                  placeholder="Ex: Recebimento Conforme"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={val => updateForm('isActive', val)}
                />
                <Label className="text-sm flex items-center gap-1.5">
                  <ToggleLeft className="w-4 h-4 text-gray-400" />
                  Modelo ativo
                </Label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Assunto <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.subject}
                onChange={e => updateForm('subject', e.target.value)}
                placeholder="Ex: Relatório de Recebimento {{numero_formulario}}"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Variáveis disponíveis</Label>
              <p className="text-xs text-gray-400 mb-2">Clique para inserir no corpo do e-mail:</p>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLES.map(v => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-mono border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Corpo do E-mail <span className="text-red-500">*</span>
              </Label>
              <Textarea
                ref={bodyRef}
                value={formData.body}
                onChange={e => updateForm('body', e.target.value)}
                placeholder={`Prezado(a),\n\nSegue o relatório de recebimento {{numero_formulario}} referente ao pedido {{ordem_recebimento}}.\n\nStatus: {{status_geral}}\nPlaca: {{placa}}\n\nAtenciosamente,\n{{responsavel_qualidade}}`}
                rows={10}
                className="text-sm font-mono resize-none"
              />
              <p className="text-xs text-gray-400">
                Use as variáveis acima para personalizar o conteúdo automaticamente.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? 'Salvar Alterações' : 'Criar Modelo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
