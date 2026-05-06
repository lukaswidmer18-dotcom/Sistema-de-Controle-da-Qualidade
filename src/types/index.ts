export type UserRole = 'ADMIN' | 'QUALIDADE' | 'OPERACAO'

export type GeneralStatus =
  | 'CONFORME'
  | 'NAO_CONFORME'
  | 'APROVADO_RESSALVA'
  | 'REPROVADO'
  | 'AGUARDANDO'

export type ChecklistStatus = 'CONFORME' | 'NAO_CONFORME' | 'NAO_APLICAVEL'

export type NonConformityStatus = 'ABERTA' | 'EM_ANALISE' | 'CONCLUIDA'

export type TemperatureType = 'RESFRIADO' | 'CONGELADO'

export interface ChecklistItemData {
  key: string
  label: string
  section: 'VEICULO' | 'CARGA'
  status?: ChecklistStatus
  observation?: string
  photos?: PhotoData[]
  isNonConformity?: boolean
}

export interface PhotoData {
  id?: string
  fileUrl: string
  fileName: string
  fileType: string
  previewUrl?: string
  file?: File
}

export interface TemperatureMeasurementData {
  id?: string
  productCode?: string
  productName?: string
  lot?: string
  temperatureType: TemperatureType
  temperature?: number
  unit: string
  status?: ChecklistStatus
  observation?: string
  photoUrl?: string
  photoFile?: File
  photoPreview?: string
}

export interface ReceiptProductData {
  id?: string
  productCode: string
  productDescription?: string
  lot: string
  quantity?: string
}

export interface NonConformityData {
  id?: string
  checklistItemId?: string
  section: string
  description?: string
  photoUrl?: string
  status: NonConformityStatus
}

export interface ReceiptFormData {
  formNumber: string
  receivedAt: string
  evaluatorName: string
  unit: string
  operationResponsible: string
  qualityResponsible: string
  receivingOrder: string
  invoiceNumber: string
  vehicleType: string
  trailerPlate: string
  platePicture?: PhotoData
  observations?: string
  products: ReceiptProductData[]
  vehicleChecklist: ChecklistItemData[]
  cargoChecklist: ChecklistItemData[]
  temperatures: TemperatureMeasurementData[]
  nonConformities: NonConformityData[]
  generalStatus: GeneralStatus
}

export const VEHICLE_CHECKLIST_ITEMS: ChecklistItemData[] = [
  { key: 'temperatura_veiculo', label: 'Temperatura do veículo (adicionar foto do painel)', section: 'VEICULO' },
  { key: 'lacre', label: 'Lacre', section: 'VEICULO' },
  { key: 'divisoria', label: 'Divisória (caso não seja carga mista, colocar N/A)', section: 'VEICULO' },
  { key: 'higiene_bau', label: 'Higiene e estrutura do baú', section: 'VEICULO' },
  { key: 'termografo', label: 'Termógrafo', section: 'VEICULO' },
]

export const CARGO_CHECKLIST_ITEMS: ChecklistItemData[] = [
  { key: 'estrechamento_pallets', label: "Estrechamento dos pallets (adicionar fotos se 'não conforme')", section: 'CARGA' },
  { key: 'condicoes_embalagens', label: "Condições das embalagens (adicionar fotos se 'não conforme')", section: 'CARGA' },
  { key: 'liberacao_liquido', label: "Liberação de líquido (adicionar fotos se 'não conforme')", section: 'CARGA' },
  { key: 'condicoes_etiquetas_datas', label: "Condições de etiquetas e datas de produção/validade (adicionar fotos se 'não conforme')", section: 'CARGA' },
]

export const VEHICLE_TYPES = [
  'Baú Refrigerado',
  'Baú Seco',
  'Truck Refrigerado',
  'Truck Seco',
  'Van Refrigerada',
  'Van Seca',
  'Carreta Refrigerada',
  'Carreta Seca',
  'Outro',
]
