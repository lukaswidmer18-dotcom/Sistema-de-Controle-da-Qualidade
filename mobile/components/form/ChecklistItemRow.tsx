import { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Animated } from 'react-native'
import { ChecklistItemData, ChecklistStatus, PhotoData } from '@/lib/types'
import { PhotoCapture } from './PhotoCapture'
import { BRAND_GREEN, BRAND_GOLD, ALWAYS_REQUIRE_PHOTO_KEYS } from '@/lib/constants'

interface Props {
  item: ChecklistItemData
  section: 'vehicle' | 'cargo'
  onStatusChange: (key: string, status: ChecklistStatus) => void
  onObservationChange: (key: string, observation: string) => void
  onAddPhoto: (key: string, photo: PhotoData) => void
  onUpdatePhoto: (key: string, index: number, photo: Partial<PhotoData>) => void
}

const STATUS_OPTIONS: { value: ChecklistStatus; label: string; color: string; bg: string }[] = [
  { value: 'CONFORME', label: 'Conforme', color: '#16a34a', bg: '#dcfce7' },
  { value: 'NAO_CONFORME', label: 'N/C', color: '#dc2626', bg: '#fee2e2' },
  { value: 'NAO_APLICAVEL', label: 'N/A', color: '#6b7280', bg: '#f3f4f6' },
]

export function ChecklistItemRow({ item, section, onStatusChange, onObservationChange, onAddPhoto, onUpdatePhoto }: Props) {
  const requiresPhoto = ALWAYS_REQUIRE_PHOTO_KEYS.includes(item.key) || item.status === 'NAO_CONFORME'
  const requiresObservation = item.status === 'NAO_CONFORME'

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{item.label}</Text>

      {/* Status selector */}
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.statusBtn,
              { borderColor: opt.color },
              item.status === opt.value && { backgroundColor: opt.bg },
            ]}
            onPress={() => onStatusChange(item.key, opt.value)}
            activeOpacity={0.75}
          >
            <Text style={[styles.statusText, { color: opt.color }]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Observation (required when NAO_CONFORME) */}
      {(requiresObservation || item.observation) && (
        <TextInput
          style={styles.observation}
          value={item.observation ?? ''}
          onChangeText={text => onObservationChange(item.key, text)}
          placeholder={requiresObservation ? 'Descreva a não conformidade *' : 'Observação (opcional)'}
          placeholderTextColor={requiresObservation ? '#ef4444' : '#9ca3af'}
          multiline
          numberOfLines={2}
        />
      )}

      {/* Photos */}
      {requiresPhoto && (
        <View style={styles.photos}>
          <PhotoCapture
            photos={item.photos ?? []}
            onAdd={photo => onAddPhoto(item.key, photo)}
            onUpdate={(idx, photo) => onUpdatePhoto(item.key, idx, photo)}
            label={ALWAYS_REQUIRE_PHOTO_KEYS.includes(item.key) ? 'Foto obrigatória' : 'Fotos da NC'}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  label: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 10,
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  observation: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#374151',
    minHeight: 64,
    textAlignVertical: 'top',
  },
  photos: {
    marginTop: 10,
  },
})
