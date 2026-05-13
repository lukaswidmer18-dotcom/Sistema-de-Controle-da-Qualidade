'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  AlertTriangle,
  FileText,
  Download,
  Mail,
  RotateCcw,
  ClipboardList,
  Thermometer,
  Truck,
  Package,
  ShieldAlert,
  Flag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Combobox } from '@/components/ui/combobox'
import { PhotoUpload } from '@/components/form/photo-upload'
import { ChecklistItemComponent } from '@/components/form/checklist-item'
import { EmailSendModal } from '@/components/form/email-send-modal'
import {
  VEHICLE_CHECKLIST_ITEMS,
  CARGO_CHECKLIST_ITEMS,
  VEHICLE_TYPES,
  type ReceiptFormData,
  type ChecklistItemData,
  type TemperatureMeasurementData,
  type ReceiptProductData,
  type GeneralStatus,
  type PhotoData,
} from '@/types'
import { generateFormNumber, getStatusLabel, getStatusColor, formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, label: 'Identificação', icon: ClipboardList },
  { id: 2, label: 'Veículo', icon: Truck },
  { id: 3, label: 'Carga', icon: Package },
  { id: 4, label: 'Temperatura', icon: Thermometer },
  { id: 5, label: 'Não Conformidades', icon: ShieldAlert },
  { id: 6, label: 'Finalização', icon: Flag },
]

function buildInitialFormData(): ReceiptFormData {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const localDatetime =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`

  return {
    formNumber: '',
    receivedAt: localDatetime,
    evaluatorName: '',
    unit: '',
    operationResponsible: '',
    qualityResponsible: '',
    receivingOrder: '',
    invoiceNumber: '',
    vehicleType: '',
    trailerPlate: '',
    platePicture: undefined,
    observations: '',
    products: [{ productCode: '', productDescription: '', lot: '', quantity: '' }],
    vehicleChecklist: VEHICLE_CHECKLIST_ITEMS.map(item => ({ ...item })),
    cargoChecklist: CARGO_CHECKLIST_ITEMS.map(item => ({ ...item })),
    temperatures: [],
    nonConformities: [],
    generalStatus: 'AGUARDANDO',
  }
}

function buildEmptyTemperature(): TemperatureMeasurementData {
  return {
    productCode: '',
    productName: '',
    lot: '',
    temperatureType: 'RESFRIADO',
    temperature: undefined,
    unit: '°C',
    status: undefined,
    observation: '',
    photoUrl: '',
    photoFile: undefined,
    photoPreview: '',
  }
}

export default function NovoFormularioPage() {
  useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ReceiptFormData>(buildInitialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [savedReceiptId, setSavedReceiptId] = useState<string | null>(null)
  const [savedPdfUrl, setSavedPdfUrl] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [evaluators, setEvaluators] = useState<Array<{ label: string, value: string }>>([])
  const [units, setUnits] = useState<Array<{ label: string, value: string }>>([])

  const fetchConfigLists = useCallback(async () => {
    try {
      // Busca Avaliadores
      const resEval = await fetch('/api/config-lists?name=AVALIADORES')
      if (resEval.ok) {
        const data = await resEval.json() as { list?: { options: Array<{ label: string, value: string }> } }
        if (data.list?.options) setEvaluators(data.list.options)
      }

      // Busca Unidades
      const resUnits = await fetch('/api/config-lists?name=UNIDADES')
      if (resUnits.ok) {
        const data = await resUnits.json() as { list?: { options: Array<{ label: string, value: string }> } }
        if (data.list?.options) setUnits(data.list.options)
      }
    } catch (error) {
      console.error('Erro ao buscar listas de configuração:', error)
    }
  }, [])

  useEffect(() => {
    setIsMounted(true)
    void fetchConfigLists()
  }, [fetchConfigLists])

  const updateFormData = useCallback(<K extends keyof ReceiptFormData>(
    key: K,
    value: ReceiptFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateProduct = (index: number, field: keyof ReceiptProductData, value: string) => {
    setFormData(prev => {
      const products = prev.products.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
      return { ...prev, products }
    })
  }

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { productCode: '', productDescription: '', lot: '', quantity: '' }],
    }))
  }

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }))
  }

  const updateVehicleChecklist = (index: number, updated: ChecklistItemData) => {
    setFormData(prev => {
      const vehicleChecklist = prev.vehicleChecklist.map((item, i) =>
        i === index ? updated : item
      )
      return { ...prev, vehicleChecklist }
    })
  }

  const updateCargoChecklist = (index: number, updated: ChecklistItemData) => {
    setFormData(prev => {
      const cargoChecklist = prev.cargoChecklist.map((item, i) =>
        i === index ? updated : item
      )
      return { ...prev, cargoChecklist }
    })
  }

  const updateTemperature = (index: number, field: keyof TemperatureMeasurementData, value: unknown) => {
    setFormData(prev => {
      const temperatures = prev.temperatures.map((t, i) =>
        i === index ? { ...t, [field]: value } : t
      )
      return { ...prev, temperatures }
    })
  }

  const addTemperature = () => {
    setFormData(prev => ({
      ...prev,
      temperatures: [...prev.temperatures, buildEmptyTemperature()],
    }))
  }

  const removeTemperature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      temperatures: prev.temperatures.filter((_, i) => i !== index),
    }))
  }

  const validateStep = (step: number): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (step === 1) {
      if (!formData.receivedAt) errors.push('Data/hora de recebimento é obrigatória')
      if (!formData.evaluatorName) errors.push('Avaliador é obrigatório')
      if (!formData.unit) errors.push('Avaliado é obrigatório')
      if (!formData.operationResponsible) errors.push('Responsável da operação é obrigatório')
      if (!formData.qualityResponsible) errors.push('Responsável pela qualidade é obrigatório')
      if (!formData.receivingOrder) errors.push('Ordem de recebimento é obrigatória')
      if (!formData.invoiceNumber) errors.push('Número da nota fiscal é obrigatório')
      if (!formData.vehicleType) errors.push('Tipo de veículo é obrigatório')
      if (!formData.trailerPlate) errors.push('Placa do reboque é obrigatória')
      if (!formData.platePicture) errors.push('Foto da placa é obrigatória')
      const validProducts = formData.products.filter(p => p.productCode && p.lot)
      if (validProducts.length === 0) errors.push('Pelo menos um produto com código e lote é obrigatório')
    }

    if (step === 2) {
      formData.vehicleChecklist.forEach(item => {
        if (!item.status) {
          errors.push(`Defina o status para: ${item.label}`)
        }
        const isPhotoRequired = item.key === 'temperatura_veiculo' || item.key === 'lacre' || item.key === 'termografo' || item.status === 'NAO_CONFORME'
        if (isPhotoRequired && !item.photos?.length) {
          errors.push(`Foto obrigatória para: ${item.label}`)
        }
        if ((item.status === 'NAO_CONFORME' || item.status === 'NAO_APLICAVEL') && !item.observation) {
          errors.push(`Observação obrigatória para: ${item.label}`)
        }
      })
    }

    if (step === 3) {
      formData.cargoChecklist.forEach(item => {
        if (!item.status) {
          errors.push(`Defina o status para: ${item.label}`)
        }
        if (item.status === 'NAO_CONFORME' && !item.photos?.length) {
          errors.push(`Foto obrigatória para: ${item.label}`)
        }
        if ((item.status === 'NAO_CONFORME' || item.status === 'NAO_APLICAVEL') && !item.observation) {
          errors.push(`Observação obrigatória para: ${item.label}`)
        }
      })
    }

    if (step === 4) {
      formData.temperatures.forEach((temp, index) => {
        if (temp.status === 'NAO_CONFORME' && !temp.photoUrl && !temp.photoPreview) {
          errors.push(`Foto obrigatória para medição ${index + 1}`)
        }
        if (temp.status === 'NAO_CONFORME' && !temp.observation) {
          errors.push(`Observação obrigatória para medição ${index + 1} (não conforme)`)
        }
      })
    }

    return { valid: errors.length === 0, errors }
  }

  const getAutoNonConformities = () => {
    const ncs: Array<{ section: string; description: string; photoUrl?: string }> = []
    formData.vehicleChecklist
      .filter(item => item.status === 'NAO_CONFORME')
      .forEach(item => {
        ncs.push({
          section: 'Condições do Veículo',
          description: item.observation || item.label,
          photoUrl: item.photos?.[0]?.fileUrl,
        })
      })
    formData.cargoChecklist
      .filter(item => item.status === 'NAO_CONFORME')
      .forEach(item => {
        ncs.push({
          section: 'Condições da Carga',
          description: item.observation || item.label,
          photoUrl: item.photos?.[0]?.fileUrl,
        })
      })
    formData.temperatures
      .filter(temp => temp.status === 'NAO_CONFORME')
      .forEach((temp, index) => {
        ncs.push({
          section: 'Temperatura',
          description: temp.observation || `Medição ${index + 1}: ${temp.temperature}${temp.unit}`,
          photoUrl: temp.photoUrl || temp.photoPreview,
        })
      })
    return ncs
  }

  const getSuggestedStatus = (): GeneralStatus => {
    const hasNCs = getAutoNonConformities().length > 0
    return hasNCs ? 'NAO_CONFORME' : 'CONFORME'
  }

  const getPendingIssues = (): string[] => {
    const issues: string[] = []
    for (let step = 1; step <= 5; step++) {
      const { errors } = validateStep(step)
      issues.push(...errors)
    }
    return issues
  }

  const goToNext = () => {
    const { valid, errors } = validateStep(currentStep)
    if (!valid) {
      setShowValidation(true)
      toast.error(`Corrija os erros antes de continuar:\n${errors.slice(0, 3).join('\n')}`)
      return
    }
    setShowValidation(false)
    if (currentStep === 4) {
      const suggested = getSuggestedStatus()
      updateFormData('generalStatus', suggested)
    }
    setCurrentStep(prev => Math.min(prev + 1, 6))
    window.scrollTo(0, 0)
  }

  const goToPrev = () => {
    setShowValidation(false)
    setCurrentStep(prev => Math.max(prev - 1, 1))
    window.scrollTo(0, 0)
  }

  const handleSubmit = async () => {
    const pendingIssues = getPendingIssues()
    if (pendingIssues.length > 0) {
      toast.error('Corrija todas as pendências antes de finalizar')
      return
    }

    setIsSubmitting(true)
    try {
      const ncs = getAutoNonConformities()
      const finalFormNumber = formData.formNumber?.trim() || generateFormNumber()
      
      const payload = {
        ...formData,
        formNumber: finalFormNumber,
        nonConformities: ncs.map(nc => ({
          section: nc.section,
          description: nc.description,
          photoUrl: nc.photoUrl,
          status: 'ABERTA',
        })),
      }

      const receiptRes = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!receiptRes.ok) {
        const err = await receiptRes.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Erro ao salvar formulário')
      }

      const receiptData = await receiptRes.json() as { id: string }
      const receiptId = receiptData.id
      setSavedReceiptId(receiptId)

      const pdfRes = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptId }),
      })

      if (pdfRes.ok) {
        const pdfData = await pdfRes.json() as { pdfUrl?: string }
        setSavedPdfUrl(pdfData.pdfUrl ?? null)
      }

      toast.success('Formulário salvo com sucesso!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData(buildInitialFormData())
    setCurrentStep(1)
    setSavedReceiptId(null)
    setSavedPdfUrl(null)
    setShowValidation(false)
  }

  const completionPercent = Math.round(((currentStep - 1) / 5) * 100)
  const autoNCs = getAutoNonConformities()

  const receiptForEmail = savedReceiptId
    ? {
        id: savedReceiptId,
        formNumber: formData.formNumber,
        invoiceNumber: formData.invoiceNumber,
        receivingOrder: formData.receivingOrder,
        trailerPlate: formData.trailerPlate,
        generalStatus: formData.generalStatus,
        qualityResponsible: formData.qualityResponsible,
        pdfUrl: savedPdfUrl ?? undefined,
        products: formData.products.map(p => ({ productCode: p.productCode, lot: p.lot })),
        nonConformities: autoNCs.map(nc => ({ description: nc.description })),
      }
    : null

  if (!isMounted) return null

  return (
    <div className="min-h-screen brand-shell">
      {/* Header */}
      <div className="brand-header px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-white">Novo Formulário de Recebimento</h1>
              <p className="text-sm text-white/65">Etapa {currentStep} de {STEPS.length}</p>
            </div>
            <Badge variant="outline" className="border-brand-gold/45 bg-white/8 text-xs font-mono text-white">
              {formData.formNumber}
            </Badge>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex gap-6">
        {/* Stepper sidebar */}
        <aside className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-28 space-y-1">
            {STEPS.map(step => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isDone = currentStep > step.id
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    if (isDone) {
                      setCurrentStep(step.id)
                      setShowValidation(false)
                    }
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all text-left',
                    isActive
                      ? 'bg-brand-green text-white font-semibold shadow-[0_16px_38px_-24px_rgba(22,65,58,0.8)]'
                      : isDone
                        ? 'bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer'
                        : 'text-gray-400 cursor-default'
                  )}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                    isActive ? 'bg-brand-gold text-white' : isDone ? 'bg-brand-green text-white' : 'bg-gray-200 text-gray-400'
                  )}>
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.id}
                  </div>
                  <span className="truncate">{step.label}</span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="brand-card motion-enter rounded-xl p-6 mb-4">

            {/* STEP 1 - Identificação */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <SectionTitle icon={<ClipboardList className="w-5 h-5" />} title="Identificação do Recebimento" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Número do Formulário (Opcional)">
                    <Input
                      value={formData.formNumber}
                      onChange={e => updateFormData('formNumber', e.target.value)}
                      placeholder="Deixe vazio para gerar automaticamente"
                    />
                  </FormField>

                  <FormField label="Data e hora de recebimento" required>
                    <div className="relative">
                      <Input
                        type="datetime-local"
                        value={formData.receivedAt}
                        readOnly
                        className="bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed select-none"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Badge variant="outline" className="bg-white text-[10px] uppercase font-bold text-gray-400 border-gray-100">
                          Auto
                        </Badge>
                      </div>
                    </div>
                  </FormField>

                  <FormField 
                    label="Avaliador" 
                    required 
                    action={
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 hover:bg-brand-gold/10 hover:text-brand-gold"
                        onClick={() => window.open('/configuracoes/opcoes', '_blank')}
                        title="Gerenciar avaliadores"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    }
                  >
                    <Combobox
                      options={evaluators}
                      value={formData.evaluatorName}
                      onValueChange={val => updateFormData('evaluatorName', val)}
                      placeholder="Selecione o avaliador"
                      searchPlaceholder="Buscar avaliador..."
                    />
                  </FormField>

                  <FormField 
                    label="Avaliado" 
                    required
                    action={
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 hover:bg-brand-gold/10 hover:text-brand-gold"
                        onClick={() => window.open('/configuracoes/opcoes', '_blank')}
                        title="Gerenciar unidades"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    }
                  >
                    <Combobox
                      options={units}
                      value={formData.unit}
                      onValueChange={val => updateFormData('unit', val)}
                      placeholder="Selecione a unidade"
                      searchPlaceholder="Buscar unidade ou SIF..."
                    />
                  </FormField>

                  <FormField label="Responsável da operação" required>
                    <Input
                      value={formData.operationResponsible}
                      onChange={e => updateFormData('operationResponsible', e.target.value)}
                      placeholder="Nome do responsável"
                    />
                  </FormField>

                  <FormField label="Responsável da qualidade" required>
                    <Input
                      value={formData.qualityResponsible}
                      onChange={e => updateFormData('qualityResponsible', e.target.value)}
                      placeholder="Nome do responsável"
                    />
                  </FormField>

                  <FormField label="Ordem de recebimento" required>
                    <Input
                      value={formData.receivingOrder}
                      onChange={e => updateFormData('receivingOrder', e.target.value)}
                      placeholder="Ex: OR-2024-001"
                    />
                  </FormField>

                  <FormField label="Nota Fiscal" required>
                    <Input
                      value={formData.invoiceNumber}
                      onChange={e => updateFormData('invoiceNumber', e.target.value)}
                      placeholder="Ex: NF-123456"
                    />
                  </FormField>

                  <FormField label="Placas" required>
                    <Input
                      value={formData.vehicleType}
                      onChange={e => updateFormData('vehicleType', e.target.value.toUpperCase())}
                      placeholder="Ex: ABC-1234"
                    />
                  </FormField>

                  <FormField label="Placa - Carreta" required>
                    <Input
                      value={formData.trailerPlate}
                      onChange={e => updateFormData('trailerPlate', e.target.value.toUpperCase())}
                      placeholder="Ex: XYZ-9876"
                    />
                  </FormField>
                </div>

                <FormField label="Foto da Placa" required>
                  <PhotoUpload
                    photos={formData.platePicture ? [formData.platePicture] : []}
                    onPhotosChange={photos => updateFormData('platePicture', photos[0] as PhotoData | undefined)}
                    maxPhotos={1}
                    label="Fotografar placa"
                    required
                  />
                </FormField>

                <FormField label="Observações Gerais">
                  <Textarea
                    value={formData.observations || ''}
                    onChange={e => updateFormData('observations', e.target.value)}
                    placeholder="Observações adicionais (opcional)"
                    rows={3}
                    className="resize-none"
                  />
                </FormField>

                <Separator />

                {/* Products table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-semibold text-gray-700">
                      Produtos / Lotes <span className="text-red-500">*</span>
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={addProduct} className="gap-1.5 text-xs">
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar produto
                    </Button>
                  </div>

                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-brand-cream border-b border-brand-gold/20">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Código *</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Descrição</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Lote *</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Quantidade</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.products.map((product, index) => (
                          <tr key={index} className="border-b last:border-0">
                            <td className="px-2 py-1.5">
                              <Input
                                value={product.productCode}
                                onChange={e => updateProduct(index, 'productCode', e.target.value)}
                                placeholder="000001"
                                className="h-8 text-xs"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <Input
                                value={product.productDescription || ''}
                                onChange={e => updateProduct(index, 'productDescription', e.target.value)}
                                placeholder="Nome do produto"
                                className="h-8 text-xs"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <Input
                                value={product.lot}
                                onChange={e => updateProduct(index, 'lot', e.target.value)}
                                placeholder="LOT001"
                                className="h-8 text-xs"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <Input
                                value={product.quantity || ''}
                                onChange={e => updateProduct(index, 'quantity', e.target.value)}
                                placeholder="0"
                                className="h-8 text-xs"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              {formData.products.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeProduct(index)}
                                  className="text-red-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {showValidation && formData.products.filter(p => p.productCode && p.lot).length === 0 && (
                    <p className="text-xs text-red-500 mt-1">⚠ Pelo menos um produto com código e lote é obrigatório</p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2 - Condições do Veículo */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <SectionTitle icon={<Truck className="w-5 h-5" />} title="Condições do Veículo" />
                <p className="text-sm text-gray-500">Avalie cada item e registre fotos e observações quando necessário.</p>
                {formData.vehicleChecklist.map((item, index) => (
                  <ChecklistItemComponent
                    key={item.key}
                    item={item}
                    onChange={updated => updateVehicleChecklist(index, updated)}
                    showValidation={showValidation}
                  />
                ))}
              </div>
            )}

            {/* STEP 3 - Condições da Carga */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <SectionTitle icon={<Package className="w-5 h-5" />} title="Condições da Carga" />
                <p className="text-sm text-gray-500">Avalie cada item e registre fotos e observações quando necessário.</p>
                {formData.cargoChecklist.map((item, index) => (
                  <ChecklistItemComponent
                    key={item.key}
                    item={item}
                    onChange={updated => updateCargoChecklist(index, updated)}
                    showValidation={showValidation}
                  />
                ))}
              </div>
            )}

            {/* STEP 4 - Temperatura */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <SectionTitle icon={<Thermometer className="w-5 h-5" />} title="Temperatura dos Produtos" />
                  <Button type="button" variant="outline" size="sm" onClick={addTemperature} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar medição
                  </Button>
                </div>

                {formData.temperatures.length === 0 && (
                  <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-lg">
                    <Thermometer className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Nenhuma medição registrada</p>
                    <p className="text-xs mt-1">Clique em "Adicionar medição" para registrar</p>
                  </div>
                )}

                {formData.temperatures.map((temp, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-700">Medição {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeTemperature(index)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Tipo</Label>
                        <Select
                          value={temp.temperatureType}
                          onValueChange={val => updateTemperature(index, 'temperatureType', val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RESFRIADO">Resfriado</SelectItem>
                            <SelectItem value="CONGELADO">Congelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Código do Produto</Label>
                        <Input
                          value={temp.productCode || ''}
                          onChange={e => updateTemperature(index, 'productCode', e.target.value)}
                          placeholder="000001"
                          className="h-8 text-xs"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Lote</Label>
                        <Input
                          value={temp.lot || ''}
                          onChange={e => updateTemperature(index, 'lot', e.target.value)}
                          placeholder="LOT001"
                          className="h-8 text-xs"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Temperatura</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={temp.temperature ?? ''}
                          onChange={e => updateTemperature(index, 'temperature', e.target.value === '' ? undefined : Number(e.target.value))}
                          placeholder="-18"
                          className="h-8 text-xs"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Unidade</Label>
                        <Input
                          value={temp.unit}
                          readOnly
                          className="h-8 text-xs bg-brand-cream"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Status</Label>
                        <Select
                          value={temp.status || ''}
                          onValueChange={val => updateTemperature(index, 'status', val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CONFORME">Conforme</SelectItem>
                            <SelectItem value="NAO_CONFORME">Não Conforme</SelectItem>
                            <SelectItem value="NAO_APLICAVEL">Não Aplicável</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">
                        Observação {temp.status === 'NAO_CONFORME' ? '*' : '(opcional)'}
                      </Label>
                      <Textarea
                        value={temp.observation || ''}
                        onChange={e => updateTemperature(index, 'observation', e.target.value)}
                        placeholder="Observação sobre esta medição"
                        rows={2}
                        className={cn(
                          'text-xs resize-none',
                          showValidation && temp.status === 'NAO_CONFORME' && !temp.observation
                            ? 'border-red-300'
                            : ''
                        )}
                      />
                    </div>

                    {temp.status === 'NAO_CONFORME' && (
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Foto da medição *</Label>
                        <PhotoUpload
                          photos={
                            temp.photoUrl || temp.photoPreview
                              ? [{
                                  fileUrl: temp.photoUrl || '',
                                  fileName: `temp-${index}.jpg`,
                                  fileType: 'image/jpeg',
                                  previewUrl: temp.photoPreview || temp.photoUrl,
                                }]
                              : []
                          }
                          onPhotosChange={photos => {
                            const photo = photos[0]
                            updateTemperature(index, 'photoUrl', photo?.fileUrl || '')
                            updateTemperature(index, 'photoPreview', photo?.previewUrl || '')
                          }}
                          maxPhotos={1}
                          label="Foto da temperatura"
                          required
                        />
                        {showValidation && !temp.photoUrl && !temp.photoPreview && (
                          <p className="text-xs text-red-500 mt-1">⚠ Foto obrigatória</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* STEP 5 - Não Conformidades */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <SectionTitle icon={<ShieldAlert className="w-5 h-5" />} title="Não Conformidades" />

                {autoNCs.length === 0 ? (
                  <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-green-700 font-medium">Nenhuma não conformidade registrada</p>
                    <p className="text-sm text-green-600 mt-1">Todos os itens avaliados estão conformes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      {autoNCs.length} não conformidade(s) detectada(s) automaticamente:
                    </p>
                    {autoNCs.map((nc, index) => (
                      <div key={index} className="border border-red-200 bg-red-50/30 rounded-lg p-4 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-0.5">{nc.section}</p>
                          <p className="text-sm text-gray-700">{nc.description}</p>
                          {nc.photoUrl && (
                            <img
                              src={nc.photoUrl}
                              alt="Evidência"
                              className="mt-2 w-24 h-24 object-cover rounded border border-red-200"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                <div>
                  <Label className="text-sm font-semibold mb-2 block">Status Geral do Recebimento</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Sugerido automaticamente: <strong>{getStatusLabel(getSuggestedStatus())}</strong>
                  </p>
                  <Select
                    value={formData.generalStatus}
                    onValueChange={val => updateFormData('generalStatus', val as GeneralStatus)}
                  >
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONFORME">Conforme</SelectItem>
                      <SelectItem value="NAO_CONFORME">Não Conforme</SelectItem>
                      <SelectItem value="APROVADO_RESSALVA">Aprovado com Ressalva</SelectItem>
                      <SelectItem value="REPROVADO">Reprovado</SelectItem>
                      <SelectItem value="AGUARDANDO">Aguardando Tratativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* STEP 6 - Finalização */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <SectionTitle icon={<Flag className="w-5 h-5" />} title="Finalização" />

                {savedReceiptId ? (
                  /* Sucesso */
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-9 h-9 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Formulário salvo com sucesso!</h3>
                      <p className="text-sm text-gray-500 mt-1">Número: {formData.formNumber}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {savedPdfUrl && (
                        <Button asChild variant="outline" className="gap-2">
                          <a href={savedPdfUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-4 h-4" />
                            Ver PDF
                          </a>
                        </Button>
                      )}
                      {savedPdfUrl && (
                        <Button asChild variant="outline" className="gap-2">
                          <a href={savedPdfUrl} download>
                            <Download className="w-4 h-4" />
                            Baixar PDF
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" className="gap-2" onClick={() => setShowEmailModal(true)}>
                        <Mail className="w-4 h-4" />
                        Enviar por E-mail
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={resetForm}>
                        <RotateCcw className="w-4 h-4" />
                        Novo Formulário
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Resumo + pendências */
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SummaryCard label="Formulário" value={formData.formNumber} />
                      <SummaryCard label="Data/Hora" value={formData.receivedAt ? formatDateTime(formData.receivedAt) : '-'} />
                      <SummaryCard label="Avaliador" value={formData.evaluatorName || '-'} />
                      <SummaryCard label="Unidade" value={formData.unit || '-'} />
                      <SummaryCard label="Ordem de Recebimento" value={formData.receivingOrder || '-'} />
                      <SummaryCard label="Nota Fiscal" value={formData.invoiceNumber || '-'} />
                      <SummaryCard label="Tipo de Veículo" value={formData.vehicleType || '-'} />
                      <SummaryCard label="Placa" value={formData.trailerPlate || '-'} />
                      <SummaryCard
                        label="Produtos"
                        value={`${formData.products.filter(p => p.productCode).length} produto(s)`}
                      />
                      <SummaryCard label="Não Conformidades" value={`${autoNCs.length} item(s)`} />
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">Status Geral:</span>
                      <Badge className={cn('border', getStatusColor(formData.generalStatus))}>
                        {getStatusLabel(formData.generalStatus)}
                      </Badge>
                    </div>

                    <Separator />

                    {(() => {
                      const pending = getPendingIssues()
                      return pending.length > 0 ? (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <p className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" />
                            Pendências a corrigir ({pending.length}):
                          </p>
                          <ul className="space-y-1">
                            {pending.slice(0, 8).map((issue, i) => (
                              <li key={i} className="text-xs text-orange-600 flex items-start gap-1.5">
                                <span className="mt-0.5 shrink-0">•</span>
                                {issue}
                              </li>
                            ))}
                            {pending.length > 8 && (
                              <li className="text-xs text-orange-500">...e mais {pending.length - 8} item(s)</li>
                            )}
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                          <p className="text-sm text-green-700 font-medium">Formulário completo. Pronto para finalizar!</p>
                        </div>
                      )
                    })()}

                    <Button
                      className="w-full gap-2 h-11"
                      onClick={handleSubmit}
                      disabled={isSubmitting || getPendingIssues().length > 0}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          Finalizar e Gerar PDF
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          {!(currentStep === 6 && savedReceiptId) && (
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={goToPrev}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              {currentStep < 6 && (
                <Button type="button" onClick={goToNext} className="gap-2">
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {receiptForEmail && (
        <EmailSendModal
          open={showEmailModal}
          onOpenChange={setShowEmailModal}
          receipt={receiptForEmail}
          onSent={() => toast.success('E-mail enviado!')}
        />
      )}
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-brand-gold">{icon}</span>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </div>
  )
}

function FormField({
  label,
  required,
  action,
  children,
}: {
  label: string
  required?: boolean
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        {action}
      </div>
      {children}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="brand-subtle rounded-lg px-4 py-3">
      <p className="text-xs text-brand-green/58 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-brand-green truncate">{value}</p>
    </div>
  )
}
