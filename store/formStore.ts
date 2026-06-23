import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  ReceiptFormData,
  ChecklistItemData,
  ChecklistStatus,
  TemperatureMeasurementData,
  ReceiptProductData,
  PhotoData,
  GeneralStatus,
} from '@/lib/types'
import { VEHICLE_CHECKLIST_ITEMS, CARGO_CHECKLIST_ITEMS } from '@/lib/constants'
import { generateFormNumber, uuid } from '@/lib/utils'

const STORAGE_KEY = 'cq_form_draft'

function freshForm(): ReceiptFormData {
  return {
    formNumber: generateFormNumber(),
    receivedAt: new Date().toISOString(),
    evaluatorName: '',
    unit: '',
    operationResponsible: '',
    qualityResponsible: '',
    receivingOrder: '',
    invoiceNumber: '',
    vehicleType: '',
    trailerPlate: '',
    observations: '',
    products: [{ id: uuid(), productCode: '', lot: '' }],
    vehicleChecklist: VEHICLE_CHECKLIST_ITEMS.map(i => ({ ...i })),
    cargoChecklist: CARGO_CHECKLIST_ITEMS.map(i => ({ ...i })),
    temperatures: [],
    generalStatus: 'AGUARDANDO',
  }
}

interface FormState {
  form: ReceiptFormData
  currentStep: number
  submitting: boolean

  updateField: <K extends keyof ReceiptFormData>(key: K, value: ReceiptFormData[K]) => void
  setStep: (step: number) => void

  addProduct: () => void
  removeProduct: (id: string) => void
  updateProduct: (id: string, field: keyof ReceiptProductData, value: string) => void

  updateChecklistStatus: (section: 'vehicle' | 'cargo', key: string, status: ChecklistStatus) => void
  updateChecklistObservation: (section: 'vehicle' | 'cargo', key: string, observation: string) => void
  addChecklistPhoto: (section: 'vehicle' | 'cargo', key: string, photo: PhotoData) => void
  updateChecklistPhoto: (section: 'vehicle' | 'cargo', key: string, photoIndex: number, photo: Partial<PhotoData>) => void
  removeChecklistPhoto: (section: 'vehicle' | 'cargo', key: string, photoIndex: number) => void

  addTemperature: () => void
  removeTemperature: (id: string) => void
  updateTemperature: (id: string, field: keyof TemperatureMeasurementData, value: unknown) => void

  setPlatePicture: (photo: PhotoData | undefined) => void
  setGeneralStatus: (status: GeneralStatus) => void

  reset: () => void
  persist: () => void
  restore: () => Promise<boolean>
}

export const useFormStore = create<FormState>((set, get) => ({
  form: freshForm(),
  currentStep: 0,
  submitting: false,

  updateField: (key, value) => {
    set(s => ({ form: { ...s.form, [key]: value } }))
    get().persist()
  },

  setStep: (step) => set({ currentStep: step }),

  addProduct: () => {
    set(s => ({
      form: { ...s.form, products: [...s.form.products, { id: uuid(), productCode: '', lot: '' }] }
    }))
    get().persist()
  },

  removeProduct: (id) => {
    set(s => ({ form: { ...s.form, products: s.form.products.filter(p => p.id !== id) } }))
    get().persist()
  },

  updateProduct: (id, field, value) => {
    set(s => ({
      form: { ...s.form, products: s.form.products.map(p => p.id === id ? { ...p, [field]: value } : p) }
    }))
    get().persist()
  },

  updateChecklistStatus: (section, key, status) => {
    const field = section === 'vehicle' ? 'vehicleChecklist' : 'cargoChecklist'
    set(s => ({
      form: {
        ...s.form,
        [field]: s.form[field].map((item: ChecklistItemData) =>
          item.key === key ? { ...item, status, isNonConformity: status === 'NAO_CONFORME' } : item
        ),
      }
    }))
    get().persist()
  },

  updateChecklistObservation: (section, key, observation) => {
    const field = section === 'vehicle' ? 'vehicleChecklist' : 'cargoChecklist'
    set(s => ({
      form: {
        ...s.form,
        [field]: s.form[field].map((item: ChecklistItemData) =>
          item.key === key ? { ...item, observation } : item
        ),
      }
    }))
    get().persist()
  },

  addChecklistPhoto: (section, key, photo) => {
    const field = section === 'vehicle' ? 'vehicleChecklist' : 'cargoChecklist'
    set(s => ({
      form: {
        ...s.form,
        [field]: s.form[field].map((item: ChecklistItemData) =>
          item.key === key ? { ...item, photos: [...(item.photos ?? []), photo] } : item
        ),
      }
    }))
    get().persist()
  },

  updateChecklistPhoto: (section, key, photoIndex, photoUpdate) => {
    const field = section === 'vehicle' ? 'vehicleChecklist' : 'cargoChecklist'
    set(s => ({
      form: {
        ...s.form,
        [field]: s.form[field].map((item: ChecklistItemData) =>
          item.key === key
            ? { ...item, photos: (item.photos ?? []).map((p, i) => i === photoIndex ? { ...p, ...photoUpdate } : p) }
            : item
        ),
      }
    }))
    get().persist()
  },

  removeChecklistPhoto: (section, key, photoIndex) => {
    const field = section === 'vehicle' ? 'vehicleChecklist' : 'cargoChecklist'
    set(s => ({
      form: {
        ...s.form,
        [field]: s.form[field].map((item: ChecklistItemData) =>
          item.key === key
            ? { ...item, photos: (item.photos ?? []).filter((_, i) => i !== photoIndex) }
            : item
        ),
      }
    }))
    get().persist()
  },

  addTemperature: () => {
    const newTemp: TemperatureMeasurementData = { id: uuid(), temperatureType: 'RESFRIADO', unit: '°C' }
    set(s => ({ form: { ...s.form, temperatures: [...s.form.temperatures, newTemp] } }))
    get().persist()
  },

  removeTemperature: (id) => {
    set(s => ({ form: { ...s.form, temperatures: s.form.temperatures.filter(t => t.id !== id) } }))
    get().persist()
  },

  updateTemperature: (id, field, value) => {
    set(s => ({
      form: { ...s.form, temperatures: s.form.temperatures.map(t => t.id === id ? { ...t, [field]: value } : t) }
    }))
    get().persist()
  },

  setPlatePicture: (photo) => {
    set(s => ({ form: { ...s.form, platePicture: photo } }))
    get().persist()
  },

  setGeneralStatus: (status) => {
    set(s => ({ form: { ...s.form, generalStatus: status } }))
    get().persist()
  },

  reset: () => {
    void AsyncStorage.removeItem(STORAGE_KEY)
    set({ form: freshForm(), currentStep: 0, submitting: false })
  },

  persist: () => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().form))
  },

  restore: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY)
      if (saved) {
        set({ form: JSON.parse(saved) as ReceiptFormData })
        return true
      }
    } catch (e) {
      console.error('formStore: failed to restore draft', e)
    }
    return false
  },
}))
