import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router, Stack } from 'expo-router'
import { useFormStore } from '@/store/formStore'
import { BRAND_GREEN, BRAND_GOLD } from '@/lib/constants'
import { GeneralStatus } from '@/lib/types'
import { getStatusLabel, getStatusColor } from '@/lib/utils'

const STATUS_OPTIONS: { value: GeneralStatus; label: string }[] = [
  { value: 'CONFORME', label: 'Conforme' },
  { value: 'APROVADO_RESSALVA', label: 'Aprovado c/ Ressalva' },
  { value: 'NAO_CONFORME', label: 'Não Conforme' },
  { value: 'REPROVADO', label: 'Reprovado' },
]

export default function Step5Revisao() {
  const { form, setGeneralStatus } = useFormStore()

  const nonConformities = [
    ...form.vehicleChecklist.filter(i => i.isNonConformity),
    ...form.cargoChecklist.filter(i => i.isNonConformity),
  ]

  const proceed = () => {
    router.push('/(app)/novo-formulario/finalizacao')
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Passo 5 — Revisão' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <View style={styles.stepBar}>
          {['1', '2', '3', '4', '5', '6'].map((s, i) => (
            <View key={s} style={[styles.stepDot, i === 4 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, i === 4 && styles.stepDotTextActive]}>{s}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Revisão</Text>

        {/* NC summary */}
        {nonConformities.length > 0 ? (
          <View style={styles.ncBox}>
            <Text style={styles.ncTitle}>⚠ {nonConformities.length} Não Conformidade(s)</Text>
            {nonConformities.map((item, i) => (
              <Text key={item.key} style={styles.ncItem}>
                • {item.label}
              </Text>
            ))}
          </View>
        ) : (
          <View style={styles.okBox}>
            <Text style={styles.okText}>✓ Nenhuma não conformidade encontrada</Text>
          </View>
        )}

        {/* General status */}
        <Text style={styles.fieldLabel}>Status Geral do Recebimento *</Text>
        <View style={styles.statusGrid}>
          {STATUS_OPTIONS.map(opt => {
            const color = getStatusColor(opt.value)
            const active = form.generalStatus === opt.value
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.statusBtn,
                  { borderColor: color },
                  active && { backgroundColor: color },
                ]}
                onPress={() => setGeneralStatus(opt.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.statusBtnText, { color: active ? '#fff' : color }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <SummaryRow label="Formulário" value={form.formNumber} />
          <SummaryRow label="NF" value={form.invoiceNumber} />
          <SummaryRow label="Placa" value={form.trailerPlate} />
          <SummaryRow label="Avaliador" value={form.evaluatorName} />
          <SummaryRow label="Produtos" value={`${form.products.length} produto(s)`} />
          <SummaryRow label="Temperaturas" value={`${form.temperatures.length} medição(ões)`} />
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, form.generalStatus === 'AGUARDANDO' && styles.nextBtnDisabled]}
          onPress={proceed}
          disabled={form.generalStatus === 'AGUARDANDO'}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>Finalizar →</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value || '—'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  stepBar: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 16 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: BRAND_GREEN },
  stepDotText: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  stepDotTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: BRAND_GREEN, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  ncBox: { backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fca5a5', borderRadius: 12, padding: 14, marginBottom: 16 },
  ncTitle: { fontSize: 14, fontWeight: '800', color: '#dc2626', marginBottom: 8 },
  ncItem: { fontSize: 13, color: '#7f1d1d', marginBottom: 4 },
  okBox: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac', borderRadius: 12, padding: 14, marginBottom: 16 },
  okText: { fontSize: 14, fontWeight: '700', color: '#16a34a' },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statusBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5 },
  statusBtnText: { fontSize: 13, fontWeight: '700' },
  summaryBox: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f0f0f0', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  summaryLabel: { fontSize: 13, color: '#9ca3af', fontWeight: '600' },
  summaryValue: { fontSize: 13, color: '#111827', fontWeight: '500' },
  nextBtn: { backgroundColor: BRAND_GREEN, borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center' },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
})
