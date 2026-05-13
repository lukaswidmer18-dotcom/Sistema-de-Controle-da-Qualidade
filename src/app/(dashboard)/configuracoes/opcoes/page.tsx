'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, Loader2, ListTree, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface ConfigOption {
  id: string
  label: string
  value: string
  isActive: boolean
  order: number
}

interface ConfigList {
  id: string
  name: string
  description?: string | null
  options: ConfigOption[]
}

export default function OpcoesPage() {
  const [lists, setLists] = useState<ConfigList[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedList, setSelectedList] = useState<ConfigList | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [newOption, setNewOption] = useState({ label: '', value: '' })
  const [filter, setFilter] = useState('')

  const fetchLists = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/config-lists')
      if (!res.ok) throw new Error('Erro ao carregar listas')
      const data = await res.json() as { lists: ConfigList[] }
      setLists(data.lists || [])
      
      if (selectedList) {
        const updated = data.lists.find(l => l.id === selectedList.id)
        if (updated) setSelectedList(updated)
      } else if (data.lists.length > 0) {
        setSelectedList(data.lists[0])
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [selectedList])

  useEffect(() => {
    void fetchLists()
  }, []) 

  const handleAddOption = async () => {
    if (!selectedList) return
    if (!newOption.label.trim()) {
      toast.error('O nome da opção é obrigatório')
      return
    }

    const payload = {
      listName: selectedList.name,
      label: newOption.label.trim(),
      value: newOption.value.trim() || newOption.label.trim(),
      order: selectedList.options.length + 1
    }

    setSaving(true)
    try {
      const res = await fetch('/api/config-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error || 'Erro ao adicionar opção')
      }

      toast.success('Opção adicionada!')
      setModalOpen(false)
      setNewOption({ label: '', value: '' })
      void fetchLists()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const filteredOptions = selectedList?.options.filter(opt => 
    opt.label.toLowerCase().includes(filter.toLowerCase()) ||
    opt.value.toLowerCase().includes(filter.toLowerCase())
  ) || []

  return (
    <div className="min-h-screen brand-shell">
      {/* Header */}
      <div className="brand-header px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Opções do Sistema</h1>
            <p className="text-sm text-white/65">Gerencie os valores das listas suspensas (dropdowns)</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Sidebar de Listas */}
          <div className="md:col-span-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-2">Categorias</h2>
            <div className="space-y-1">
              {loading && lists.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                </div>
              ) : (
                lists.map(list => (
                  <button
                    key={list.id}
                    onClick={() => {
                      setSelectedList(list)
                      setFilter('')
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left group",
                      selectedList?.id === list.id 
                        ? "bg-brand-green text-white shadow-lg shadow-brand-green/20" 
                        : "bg-white text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <ListTree className={cn("w-4 h-4", selectedList?.id === list.id ? "text-white" : "text-gray-400")} />
                      <span className="font-medium text-sm">{list.name}</span>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 opacity-0 transition-all", selectedList?.id === list.id ? "opacity-100 translate-x-0" : "group-hover:opacity-100 group-hover:-translate-x-1")} />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Conteúdo da Lista Selecionada */}
          <div className="md:col-span-8">
            {selectedList ? (
              <div className="space-y-6 motion-enter">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 truncate">{selectedList.name}</h2>
                    <p className="text-sm text-gray-500">{selectedList.description || 'Gerencie as opções desta lista'}</p>
                  </div>
                  <Button onClick={() => setModalOpen(true)} className="gap-2 shrink-0">
                    <Plus className="w-4 h-4" />
                    Adicionar Opção
                  </Button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col h-[600px]">
                  <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        placeholder="Pesquisar nesta lista..." 
                        className="pl-9 bg-white border-gray-200"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ordem</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Nome (Label)</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Valor (Interno)</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredOptions.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">
                              {filter ? 'Nenhuma opção corresponde à sua busca.' : 'Nenhuma opção cadastrada.'}
                            </td>
                          </tr>
                        ) : (
                          filteredOptions.map((opt, idx) => (
                            <tr key={opt.id} className="hover:bg-gray-50/50 transition-colors group">
                              <td className="px-6 py-4">
                                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                  {opt.order || idx + 1}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-medium text-sm text-gray-700">{opt.label}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs text-gray-500 font-mono">{opt.value}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 text-[10px] text-gray-400 flex justify-between items-center">
                    <span>Mostrando {filteredOptions.length} de {selectedList.options.length} itens</span>
                    <span>Total de opções cadastradas: {selectedList.options.length}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                <ListTree className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-gray-400 text-sm">Selecione uma categoria para gerenciar suas opções</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Nova Opção */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Opção para {selectedList?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="opt-label" className="text-sm font-medium">Nome de Exibição (Label) <span className="text-red-500">*</span></Label>
              <Input
                id="opt-label"
                value={newOption.label}
                onChange={e => setNewOption(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Ex: CD NOVO HORIZONTE"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="opt-value" className="text-sm font-medium">Valor Interno (Opcional)</Label>
              <Input
                id="opt-value"
                value={newOption.value}
                onChange={e => setNewOption(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Se vazio, será igual ao nome"
              />
              <p className="text-[10px] text-gray-400">Este valor é usado para buscas e relatórios. Recomendamos usar o mesmo nome.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleAddOption()} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Adicionar Opção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
