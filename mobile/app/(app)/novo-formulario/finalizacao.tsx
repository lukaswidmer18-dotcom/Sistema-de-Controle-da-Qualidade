import { useState } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native'
import { router, Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useFormStore } from '@/store/formStore'
import api, { API_BASE_URL } from '@/lib/api'
import { BRAND_GREEN, BRAND_GOLD, BRAND_CREAM, HAIRLINE_GREEN } from '@/lib/constants'

export default function Step6Finalizacao() {
  const { form, reset } = useFormStore()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [receiptId, setReceiptId] = useState<string | null>(null)

  const hasUploadingPhotos = () => {
    return [
      ...form.vehicleChecklist.flatMap(i => i.photos ?? []),
      ...form.cargoChecklist.flatMap(i => i.photos ?? []),
      ...form.temperatures
        .filter(t => t.photoUploading)
        .map(t => ({
          fileUrl: t.photoUrl ?? '',
          fileName: 'temperatura.jpg',
          fileType: 'image/jpeg',
          uploading: t.photoUploading,
        })),
    ].some(p => p.uploading)
  }

  const submit = async () => {
    if (hasUploadingPhotos()) {
      Alert.alert('Aguarde', 'Ainda há fotos sendo enviadas. Aguarde o upload finalizar.')
      return
    }

    setSubmitting(true)
    try {
      // 1. Create receipt
      const receiptRes = await api.post<{ receipt: { id: string } }>('/api/receipts', form)
      const id = receiptRes.data.receipt.id
      setReceiptId(id)

      // 2. Generate PDF
      const pdfRes = await api.post<{ pdfUrl: string }>('/api/pdf', { receiptId: id })
      setPdfUrl(pdfRes.data.pdfUrl)

      setDone(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar formulário'
      Alert.alert('Erro', message)
    } finally {
      setSubmitting(false)
    }
  }

  const openPdf = async () => {
    if (pdfUrl) {
      const url = pdfUrl.startsWith('http') ? pdfUrl : `${API_BASE_URL}${pdfUrl}`
      await WebBrowser.openBrowserAsync(url)
    }
  }

  const newForm = () => {
    reset()
    router.replace('/(app)/novo-formulario')
  }

  if (done) {
    return (
      <>
        <Stack.Screen options={{ title: 'Concluído' }} />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Recebimento Registrado!</Text>
          <Text style={styles.successSubtitle}>
            Formulário {form.formNumber} enviado com sucesso.
          </Text>

          {pdfUrl && (
            <TouchableOpacity style={styles.pdfBtn} onPress={openPdf} activeOpacity={0.85}>
              <Text style={styles.pdfBtnText}>📄  Abrir PDF</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.newFormBtn} onPress={newForm} activeOpacity={0.85}>
            <Text style={styles.newFormBtnText}>+ Novo Formulário</Text>
          </TouchableOpacity>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Passo 6 — Finalizar' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <View style={styles.stepBar}>
          {['1', '2', '3', '4', '5', '6'].map((s, i) => (
            <View key={s} style={[styles.stepDot, i === 5 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, i === 5 && styles.stepDotTextActive]}>{s}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Confirmar e Enviar</Text>

        <View style={styles.infoBox}>
          <InfoRow label="Formulário" value={form.formNumber} />
          <InfoRow label="NF" value={form.invoiceNumber} />
          <InfoRow label="Placa" value={form.trailerPlate} />
          <InfoRow label="Avaliador" value={form.evaluatorName} />
          <InfoRow label="Status" value={form.generalStatus.replace('_', ' ')} />
          <InfoRow label="NCs" value={String([...form.vehicleChecklist, ...form.cargoChecklist].filter(i => i.isNonConformity).length)} />
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            Ao confirmar, o recebimento será registrado, um PDF gerado e o e-mail enviado para os destinatários da lista selecionada.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={submit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <>
              <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Enviando...</Text>
            </>
          ) : (
            <Text style={styles.submitBtnText}>✓  Confirmar e Enviar</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  sectionTitle: { fontSize: 15, fontWeight: '800', color: BRAND_GREEN, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  infoBox: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: HAIRLINE_GREEN, marginBottom: 14, shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  infoLabel: { fontSize: 13, color: '#9ca3af', fontWeight: '600' },
  infoValue: { fontSize: 13, color: '#111827', fontWeight: '500' },
  noteBox: { backgroundColor: 'rgba(22,65,58,0.04)', borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(22,65,58,0.08)' },
  noteText: { fontSize: 13, color: 'rgba(22,65,58,0.7)', lineHeight: 20 },
  submitBtn: { backgroundColor: BRAND_GREEN, borderRadius: 14, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 8, elevation: 6 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  // Success screen
  successContainer: { flex: 1, backgroundColor: BRAND_GREEN, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: BRAND_GOLD, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successIconText: { color: '#fff', fontSize: 40, fontWeight: '800' },
  successTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  successSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginBottom: 32 },
  pdfBtn: { backgroundColor: BRAND_GOLD, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12, width: '100%', alignItems: 'center' },
  pdfBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  newFormBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  newFormBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
