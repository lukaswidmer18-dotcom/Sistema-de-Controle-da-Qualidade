'use client'

import { AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PhotoUpload } from './photo-upload'
import { cn } from '@/lib/utils'
import type { ChecklistItemData, ChecklistStatus, PhotoData } from '@/types'

interface ChecklistItemProps {
  item: ChecklistItemData
  onChange: (updated: ChecklistItemData) => void
  showValidation?: boolean
}

const statusOptions: { value: ChecklistStatus; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { value: 'CONFORME', label: 'Conforme', icon: CheckCircle2, color: 'border-brand-green bg-brand-green/10 text-brand-green' },
  { value: 'NAO_CONFORME', label: 'Não Conforme', icon: AlertTriangle, color: 'border-red-500 bg-red-50 text-red-700' },
  { value: 'NAO_APLICAVEL', label: 'Não Aplicável', icon: MinusCircle, color: 'border-gray-400 bg-gray-50 text-gray-600' },
]

export function ChecklistItemComponent({ item, onChange, showValidation = false }: ChecklistItemProps) {
  const alwaysRequirePhoto = item.key === 'temperatura_veiculo' || item.key === 'lacre'
  const isNonConforming = item.status === 'NAO_CONFORME'
  const isNotApplicable = item.status === 'NAO_APLICAVEL'
  const needsObservation = (isNonConforming || isNotApplicable) && !item.observation
  const isPhotoRequired = alwaysRequirePhoto || isNonConforming
  const needsPhoto = isPhotoRequired && !item.photos?.length

  const handleStatusChange = (status: ChecklistStatus) => {
    onChange({
      ...item,
      status,
      isNonConformity: status === 'NAO_CONFORME',
    })
  }

  const handlePhotosChange = (photos: PhotoData[]) => {
    onChange({ ...item, photos })
  }

  return (
    <div className={cn(
      'border rounded-lg p-4 transition-colors',
      isNonConforming ? 'border-red-200 bg-red-50/30' : 'border-brand-green/10 bg-white shadow-[0_14px_36px_-30px_rgba(22,65,58,0.45)]',
      showValidation && (!item.status || needsPhoto) ? 'border-orange-300 bg-orange-50/20' : ''
    )}>
      {/* Item label + non-conformity badge */}
      <div className="flex items-center justify-between mb-3">
        <Label className="font-medium text-gray-800 text-sm">{item.label}</Label>
        {isNonConforming && (
          <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Não Conformidade
          </span>
        )}
      </div>

      {/* Status buttons */}
      <div className="flex gap-2 mb-3">
        {statusOptions.map((opt) => {
          const Icon = opt.icon
          const isSelected = item.status === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatusChange(opt.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border-2 transition-all',
                isSelected ? opt.color : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Observation */}
      <div className="space-y-1 mb-3">
        <Textarea
          placeholder={
            isNonConforming
              ? 'Descreva a não conformidade (obrigatório)...'
              : isNotApplicable
                ? 'Justificativa (obrigatório)...'
                : 'Observação (opcional)...'
          }
          value={item.observation || ''}
          onChange={(e) => onChange({ ...item, observation: e.target.value })}
          className={cn(
            'text-sm min-h-[60px] resize-none',
            showValidation && needsObservation ? 'border-red-300 focus-visible:ring-red-300' : ''
          )}
          rows={2}
        />
        {showValidation && needsObservation && (
          <p className="text-xs text-red-500">⚠ Observação obrigatória</p>
        )}
      </div>

      {/* Photo upload */}
      {isPhotoRequired && (
        <PhotoUpload
          photos={item.photos || []}
          onPhotosChange={handlePhotosChange}
          label="Adicionar foto"
          required={true}
          maxPhotos={5}
        />
      )}

      {showValidation && !item.status && (
        <p className="text-xs text-orange-500 mt-1">⚠ Defina o status deste item</p>
      )}
    </div>
  )
}
