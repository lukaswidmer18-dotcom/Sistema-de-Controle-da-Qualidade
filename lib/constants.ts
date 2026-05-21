import { ChecklistItemData } from './types'

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

// Items that always require a photo
export const ALWAYS_REQUIRE_PHOTO_KEYS = ['temperatura_veiculo', 'lacre', 'termografo']

export const BRAND_GREEN = '#16413a'
export const BRAND_GOLD = '#bc933f'
export const BRAND_CREAM = '#f5f0e8'
