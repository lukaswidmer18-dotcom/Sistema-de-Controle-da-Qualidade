import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router, Stack } from 'expo-router'
import { alert } from '@/lib/alert'
import { useFormStore } from '@/store/formStore'
import { ChecklistItemRow } from '@/components/form/ChecklistItemRow'
import { BRAND_GREEN, BRAND_CREAM, HAIRLINE_GREEN, ALWAYS_REQUIRE_PHOTO_KEYS } from '@/lib/constants'
import { PhotoData, ChecklistStatus } from '@/lib/types'

export default function Step2Veiculo() {
  const { form, updateChecklistStatus, updateChecklistObservation, addChecklistPhoto, updateChecklistPhoto } = useFormStore()

  const canProceed = () => {
    return form.vehicleChecklist.every(item => {
      if (!item.status) return false
      if (ALWAYS_REQUIRE_PHOTO_KEYS.includes(item.key) && (!item.photos || item.photos.length === 0)) return false
      if (item.status === 'NAO_CONFORME' && !item.observation?.trim()) return false
      if (item.status === 'NAO_CONFORME' && (!item.photos || item.photos.length === 0)) return false
      // Check no photos are still uploading
      if (item.photos?.some(p => p.uploading)) return false
      return true
    })
  }

  const proceed = () => {
    if (!canProceed()) {
      alert('Atenção', 'Preencha todos os itens. Itens NAO_CONFORME exigem observação e foto. Aguarde uploads finalizarem.')
      return
    }
    router.push('/(app)/novo-formulario/carga')
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Passo 2 — Veículo' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <View style={styles.stepBar}>
          {['1', '2', '3', '4', '5', '6'].map((s, i) => (
            <View key={s} style={[styles.stepDot, i === 1 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, i === 1 && styles.stepDotTextActive]}>{s}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Condições do Veículo</Text>
        <Text style={styles.hint}>Itens marcados com ⚠ exigem foto obrigatória.</Text>

        {form.vehicleChecklist.map(item => (
          <ChecklistItemRow
            key={item.key}
            item={item}
            section="vehicle"
            onStatusChange={(key, status) => updateChecklistStatus('vehicle', key, status as ChecklistStatus)}
            onObservationChange={(key, obs) => updateChecklistObservation('vehicle', key, obs)}
            onAddPhoto={(key, photo) => addChecklistPhoto('vehicle', key, photo)}
            onUpdatePhoto={(key, idx, photo) => updateChecklistPhoto('vehicle', key, idx, photo)}
          />
        ))}

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_CREAM },
  content: { padding: 16 },
  stepBar: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 16 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: BRAND_GREEN },
  stepDotText: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  stepDotTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: BRAND_GREEN, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  hint: { fontSize: 12, color: '#9ca3af', marginBottom: 14 },
  nextBtn: { backgroundColor: BRAND_GREEN, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 8, elevation: 6 },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
})
