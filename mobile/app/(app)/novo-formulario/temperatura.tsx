import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native'
import { router, Stack } from 'expo-router'
import { useFormStore } from '@/store/formStore'
import { BRAND_GREEN, BRAND_GOLD, BRAND_CREAM, HAIRLINE_GREEN } from '@/lib/constants'
import { ChecklistStatus, PhotoData, TemperatureMeasurementData, TemperatureType } from '@/lib/types'
import { PhotoCapture } from '@/components/form/PhotoCapture'

const TEMP_TYPES: { value: TemperatureType; label: string; color: string }[] = [
  { value: 'RESFRIADO', label: 'Resfriado', color: '#0284c7' },
  { value: 'CONGELADO', label: 'Congelado', color: '#7c3aed' },
]

const TEMP_STATUS: ChecklistStatus[] = ['CONFORME', 'NAO_CONFORME', 'NAO_APLICAVEL']

export default function Step4Temperatura() {
  const { form, addTemperature, removeTemperature, updateTemperature } = useFormStore()

  const canProceed = () => {
    return form.temperatures.every(temp => {
      if (!temp.status) return false
      if (temp.status === 'NAO_APLICAVEL') return true
      if (temp.status === 'NAO_CONFORME' && !temp.observation?.trim()) return false
      if (temp.status === 'NAO_CONFORME' && !temp.photoUrl) return false
      if (temp.photoUploading) return false
      return true
    })
  }

  const proceed = () => {
    if (!canProceed()) {
      Alert.alert(
        'Atenção',
        'Defina o status das medições. Temperatura não conforme exige observação e foto. Use N/A quando não houver medição aplicável.'
      )
      return
    }
    router.push('/(app)/novo-formulario/revisao')
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Passo 4 - Temperaturas' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={styles.stepBar}>
          {['1', '2', '3', '4', '5', '6'].map((s, i) => (
            <View key={s} style={[styles.stepDot, i === 3 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, i === 3 && styles.stepDotTextActive]}>{s}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Controle de Temperatura</Text>
        <Text style={styles.hint}>
          Opcional. Para produtos resfriados/congelados, registre a medição. Use N/A quando não aplicável.
        </Text>

        {form.temperatures.map((temp, index) => (
          <TemperatureCard
            key={temp.id}
            temp={temp}
            index={index}
            onUpdate={(field, value) => updateTemperature(temp.id, field, value)}
            onRemove={() => removeTemperature(temp.id)}
          />
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={addTemperature}>
          <Text style={styles.addBtnText}>+ Adicionar medição</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={proceed}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>Próximo →</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  )
}

function TemperatureCard({
  temp, index, onUpdate, onRemove,
}: {
  temp: TemperatureMeasurementData
  index: number
  onUpdate: (field: keyof TemperatureMeasurementData, value: unknown) => void
  onRemove: () => void
}) {
  const photo: PhotoData | undefined = temp.photoUrl || temp.photoPreviewUri ? {
    fileUrl: temp.photoUrl ?? '',
    fileName: `temperatura-${index + 1}.jpg`,
    fileType: 'image/jpeg',
    previewUri: temp.photoPreviewUri || temp.photoUrl,
    uploading: temp.photoUploading,
  } : undefined

  const setStatus = (status: ChecklistStatus) => {
    onUpdate('status', status)
    if (status === 'NAO_APLICAVEL') {
      onUpdate('observation', '')
      onUpdate('photoUrl', '')
      onUpdate('photoPreviewUri', '')
      onUpdate('photoUploading', false)
    }
  }

  const setTemperatureValue = (value: string) => {
    const normalized = value.replace(',', '.').trim()
    if (!normalized || normalized === '-' || normalized === '+') {
      onUpdate('temperature', undefined)
      return
    }

    const parsed = Number(normalized)
    onUpdate('temperature', Number.isFinite(parsed) ? parsed : undefined)
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Medição {index + 1}</Text>
        <TouchableOpacity onPress={onRemove}>
          <Text style={styles.removeText}>Remover</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.typeRow}>
        {TEMP_TYPES.map(t => (
          <TouchableOpacity
            key={t.value}
            style={[
              styles.typeBtn,
              { borderColor: t.color },
              temp.temperatureType === t.value && { backgroundColor: t.color },
            ]}
            onPress={() => onUpdate('temperatureType', t.value)}
          >
            <Text style={[styles.typeBtnText, { color: temp.temperatureType === t.value ? '#fff' : t.color }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 2 }]}
          value={temp.productCode ?? ''}
          onChangeText={v => onUpdate('productCode', v)}
          placeholder="Código produto"
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          style={[styles.input, { flex: 1, marginLeft: 8 }]}
          value={temp.lot ?? ''}
          onChangeText={v => onUpdate('lot', v)}
          placeholder="Lote"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={temp.temperature !== undefined ? String(temp.temperature) : ''}
          onChangeText={setTemperatureValue}
          placeholder="Temp. (°C)"
          placeholderTextColor="#9ca3af"
          keyboardType="decimal-pad"
        />
        <View style={styles.statusRow}>
          {TEMP_STATUS.map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusBtn,
                { borderColor: getStatusColor(status) },
                temp.status === status && { backgroundColor: getStatusBg(status) },
              ]}
              onPress={() => setStatus(status)}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: getStatusColor(status) }}>
                {getStatusLabel(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {temp.status === 'NAO_CONFORME' && (
        <>
          <TextInput
            style={[styles.input, { marginTop: 8, minHeight: 60, textAlignVertical: 'top' }]}
            value={temp.observation ?? ''}
            onChangeText={v => onUpdate('observation', v)}
            placeholder="Descreva a não conformidade *"
            placeholderTextColor="#ef4444"
            multiline
            numberOfLines={2}
          />
          <View style={styles.photoBlock}>
            <PhotoCapture
              photos={photo ? [photo] : []}
              onAdd={(newPhoto) => {
                onUpdate('photoUrl', newPhoto.fileUrl)
                onUpdate('photoPreviewUri', newPhoto.previewUri)
                onUpdate('photoUploading', newPhoto.uploading)
              }}
              onUpdate={(_, updatedPhoto) => {
                onUpdate('photoUrl', updatedPhoto.fileUrl ?? '')
                onUpdate('photoPreviewUri', updatedPhoto.previewUri ?? '')
                onUpdate('photoUploading', updatedPhoto.uploading ?? false)
              }}
              maxPhotos={1}
              label="Foto obrigatória"
            />
          </View>
        </>
      )}

      {temp.status === 'NAO_APLICAVEL' && (
        <Text style={styles.naHint}>N/A selecionado: foto não obrigatória.</Text>
      )}
    </View>
  )
}

function getStatusColor(status: ChecklistStatus) {
  if (status === 'CONFORME') return '#16a34a'
  if (status === 'NAO_CONFORME') return '#dc2626'
  return '#6b7280'
}

function getStatusBg(status: ChecklistStatus) {
  if (status === 'CONFORME') return '#dcfce7'
  if (status === 'NAO_CONFORME') return '#fee2e2'
  return '#f3f4f6'
}

function getStatusLabel(status: ChecklistStatus) {
  if (status === 'CONFORME') return 'OK'
  if (status === 'NAO_CONFORME') return 'NC'
  return 'N/A'
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_CREAM },
  content: { padding: 16 },
  stepBar: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 16 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: BRAND_GREEN },
  stepDotText: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  stepDotTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: BRAND_GREEN, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  hint: { fontSize: 12, color: '#6b7280', marginBottom: 14, lineHeight: 17 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: HAIRLINE_GREEN, shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontWeight: '700', color: BRAND_GREEN, fontSize: 14 },
  removeText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  typeBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, alignItems: 'center' },
  typeBtnText: { fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', marginBottom: 8 },
  statusRow: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  input: { height: 46, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, fontSize: 14, color: '#111827', backgroundColor: '#fff' },
  statusBtn: { width: 42, height: 46, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  addBtn: { borderWidth: 1.5, borderColor: BRAND_GOLD, borderStyle: 'dashed', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 14 },
  addBtnText: { color: BRAND_GREEN, fontWeight: '700', fontSize: 14 },
  nextBtn: { backgroundColor: BRAND_GREEN, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 8, elevation: 6 },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  photoBlock: { marginTop: 10 },
  naHint: { marginTop: 8, color: '#6b7280', fontSize: 12, fontWeight: '600' },
})
