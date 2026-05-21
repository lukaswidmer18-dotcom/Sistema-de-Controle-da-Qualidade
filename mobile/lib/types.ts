export type UserRole = 'ADMIN' | 'QUALIDADE'

export type GeneralStatus =
  | 'CONFORME'
  | 'NAO_CONFORME'
  | 'APROVADO_RESSALVA'
  | 'REPROVADO'
  | 'AGUARDANDO'

export type ChecklistStatus = 'CONFORME' | 'NAO_CONFORME' | 'NAO_APLICAVEL'

export type TemperatureType = 'RESFRIADO' | 'CONGELADO'

export interface PhotoData {
  fileUrl: string
  fileName: string
  fileType: string
  previewUri?: string
  uploading?: boolean
  error?: boolean
}

export interface ChecklistItemData {
  key: string
  label: string
  section: 'VEICULO' | 'CARGA'
  status?: ChecklistStatus
  observation?: string
  photos?: PhotoData[]
  isNonConformity?: boolean
}

export interface TemperatureMeasurementData {
  id: string
  productCode?: string
  productName?: string
  lot?: string
  temperatureType: TemperatureType
  temperature?: number
  unit: string
  status?: ChecklistStatus
  observation?: string
  photoUrl?: string
  photoPreviewUri?: string
  photoUploading?: boolean
}

export interface ReceiptProductData {
  id: string
  productCode: string
  productDescription?: string
  lot: string
  quantity?: string
}

export interface ReceiptFormData {
  formNumber: string
  receivedAt: string
  evaluatorName: string
  evaluatorEmailListId?: string
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
  generalStatus: GeneralStatus
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface Receipt {
  id: string
  formNumber: string
  invoiceNumber: string
  receivingOrder: string
  trailerPlate: string
  generalStatus: GeneralStatus
  qualityResponsible: string
  evaluatorName: string
  receivedAt: string
  pdfUrl?: string | null
  _count?: { nonConformities: number }
}

export interface ReceiptListResponse {
  receipts: Receipt[]
  total: number
  page: number
  totalPages: number
}
