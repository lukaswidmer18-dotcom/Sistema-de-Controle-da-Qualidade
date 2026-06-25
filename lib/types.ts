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
  unit: string | null
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

export interface ReceiptPhoto {
  id: string
  fileUrl: string
  fileName: string
  fileType: string
}

export interface ReceiptChecklistItem {
  id: string
  section: string
  itemKey: string
  itemLabel: string
  status: ChecklistStatus | null
  observation: string | null
  isNonConformity: boolean
  photos: ReceiptPhoto[]
}

export interface ReceiptNonConformity {
  id: string
  section: string
  description: string
  photoUrl: string | null
  status: string
}

export interface ReceiptTemperature {
  id: string
  productCode: string | null
  productName: string | null
  lot: string | null
  temperatureType: string
  temperature: number | null
  unit: string
  status: string | null
  observation: string | null
  photoUrl: string | null
}

export interface ReceiptProductSaved {
  id: string
  productCode: string
  productDescription: string | null
  lot: string
  quantity: string | null
}

export interface EmailLog {
  id: string
  recipients: string[]
  subject: string
  body: string
  status: string
  sentAt: string
  sender: { name: string; email: string } | null
}

export interface ReceiptDetail extends Receipt {
  unit: string
  operationResponsible: string
  receivingOrder: string
  observations: string | null
  products: ReceiptProductSaved[]
  checklistItems: ReceiptChecklistItem[]
  temperatures: ReceiptTemperature[]
  nonConformities: ReceiptNonConformity[]
  emailLogs: EmailLog[]
}

export interface ActionPlanData {
  id: string
  description: string
  responsible: string
  deadline: string
  rootCause: string
  status: 'PENDENTE' | 'CONCLUIDO'
  pdfUrl: string | null
  createdAt: string
}

export interface ReceiptWithActionPlan {
  id: string
  formNumber: string
  invoiceNumber: string
  trailerPlate: string
  receivedAt: string
  qualityResponsible: string
  generalStatus: GeneralStatus
  products: ReceiptProductSaved[]
  nonConformities: ReceiptNonConformity[]
  actionPlan: ActionPlanData | null
}
