import { useEffect, useRef, useState } from 'react'
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import api, { API_BASE_URL } from '@/lib/api'
import { ReceiptWithActionPlan } from '@/lib/types'
import { BRAND_GREEN, BRAND_GOLD, BRAND_CREAM, HAIRLINE_GREEN } from '@/lib/constants'
import { getStatusLabel, getStatusColor } from '@/lib/utils'

export default function ActionPlanEditor() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()
  const prefilled = useRef(false)

  const [rootCause, setRootCause] = useState('')
  const [description, setDescription] = useState('')
  const [responsible, setResponsible] = useState('')
  const [deadline, setDeadline] = useState('')
  const [savedPdfUrl, setSavedPdfUrl] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery<{ receipt: ReceiptWithActionPlan }>({
    queryKey: ['action-plan', id],
    queryFn: async () => {
      const res = await api.get<{ receipt: ReceiptWithActionPlan }>(`/api/action-plans/${id}`)
      return res.data
    },
    enabled: !!id,
  })

  const receipt = data?.receipt
  const existingPlan = receipt?.actionPlan

  useEffect(() => {
    if (existingPlan && !prefilled.current) {
      prefilled.current = true
      setRootCause(existingPlan.rootCause)
      setDescription(existingPlan.description)
      setResponsible(existingPlan.responsible)
      setDeadline(existingPlan.deadline.split('T')[0])
    }
  }, [existingPlan])

  const mutation = useMutation({
    mutationFn: async (payload: { description: string; responsible: string; deadline: string; rootCause: string }) => {
      const res = await api.post<{ pdfUrl: string }>(`/api/action-plans/${id}`, payload)
      return res.data
    },
    onSuccess: (result) => {
      setSavedPdfUrl(result.pdfUrl)
      queryClient.invalidateQueries({ queryKey: ['action-plans'] })
      queryClient.invalidateQueries({ queryKey: ['action-plan', id] })
    },
    onError: (err: unknown) => {
      let message = 'Erro ao salvar plano de ação'
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as { error?: string; errors?: string[] } | undefined
        message = d?.error ?? d?.errors?.[0] ?? err.message
      } else if (err instanceof Error) {
        message = err.message
      }
      Alert.alert('Erro', message)
    },
  })

  const openPdf = async (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`
    await WebBrowser.openBrowserAsync(fullUrl)
  }

  const handleSubmit = () => {
    if (!rootCause.trim() || !description.trim() || !responsible.trim() || !deadline.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos antes de salvar.')
      return
    }
    mutation.mutate({ rootCause, description, responsible, deadline })
  }

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Plano de Ação' }} />
        <View style={styles.center}>
          <ActivityIndicator color={BRAND_GREEN} size="large" />
        </View>
      </>
    )
  }

  if (isError || !receipt) {
    return (
      <>
        <Stack.Screen options={{ title: 'Plano de Ação' }} />
        <View style={styles.center}>
          <Text style={styles.errorText}>Erro ao carregar recebimento</Text>
        </View>
      </>
    )
  }

  const statusColor = getStatusColor(receipt.generalStatus)
  const ncs = receipt.nonConformities ?? []
  const isSaving = mutation.isPending

  return (
    <>
      <Stack.Screen options={{ title: `Plano — ${receipt.formNumber}` }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Receipt header */}
          <View style={[styles.receiptHeader, { borderLeftColor: statusColor }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formNumber}>{receipt.formNumber}</Text>
              <Text style={styles.metaText}>NF {receipt.invoiceNumber} · {receipt.trailerPlate}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}40` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel(receipt.generalStatus)}</Text>
            </View>
          </View>

          {/* Non-conformities (read-only) */}
          {ncs.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: '#dc2626' }]}>Não Conformidades ({ncs.length})</Text>
              {ncs.map((nc) => (
                <View key={nc.id} style={styles.ncCard}>
                  <Text style={styles.ncSection}>{nc.section}</Text>
                  <Text style={styles.ncDesc}>{nc.description}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Existing plan status */}
          {existingPlan && (
            <View style={[styles.section, styles.existingPlanBox]}>
              <Text style={styles.existingPlanLabel}>
                Plano existente · {existingPlan.status === 'CONCLUIDO' ? '✓ Concluído' : '⏳ Pendente'}
              </Text>
              {existingPlan.pdfUrl && (
                <TouchableOpacity onPress={() => openPdf(existingPlan.pdfUrl!)} style={styles.pdfLinkBtn}>
                  <Text style={styles.pdfLinkText}>Ver PDF atual →</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {existingPlan ? 'Atualizar Plano de Ação' : 'Novo Plano de Ação'}
            </Text>

            <Text style={styles.fieldLabel}>Causa Raiz *</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={rootCause}
              onChangeText={setRootCause}
              placeholder="Descreva a causa raiz do problema..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Ação Corretiva *</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descreva a ação corretiva a ser tomada..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Responsável *</Text>
            <TextInput
              style={styles.input}
              value={responsible}
              onChangeText={setResponsible}
              placeholder="Nome do responsável"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Prazo * (AAAA-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={deadline}
              onChangeText={setDeadline}
              placeholder="Ex: 2025-06-30"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>

          {/* Success message */}
          {savedPdfUrl && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>Plano salvo com sucesso!</Text>
              <TouchableOpacity onPress={() => openPdf(savedPdfUrl)} style={styles.pdfBtn} activeOpacity={0.85}>
                <Text style={styles.pdfBtnText}>📄  Abrir PDF</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, isSaving && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <>
                <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Salvando...</Text>
              </>
            ) : (
              <Text style={styles.submitBtnText}>✓  Salvar Plano de Ação</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_CREAM },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND_CREAM },
  errorText: { color: '#6b7280', fontSize: 15 },

  receiptHeader: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: HAIRLINE_GREEN, borderLeftWidth: 4,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  formNumber: { fontFamily: 'monospace', fontSize: 15, fontWeight: '700', color: BRAND_GREEN },
  metaText: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: '700' },

  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: HAIRLINE_GREEN,
    shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '800', color: BRAND_GREEN,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },

  ncCard: { padding: 10, backgroundColor: '#fff5f5', borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#fca5a5' },
  ncSection: { fontSize: 10, fontWeight: '700', color: '#991b1b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  ncDesc: { fontSize: 13, color: '#450a0a' },

  existingPlanBox: { backgroundColor: 'rgba(22,65,58,0.03)' },
  existingPlanLabel: { fontSize: 13, fontWeight: '600', color: BRAND_GREEN, marginBottom: 8 },
  pdfLinkBtn: { alignSelf: 'flex-start' },
  pdfLinkText: { fontSize: 13, fontWeight: '700', color: BRAND_GOLD },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#fafafa',
  },
  inputMulti: { minHeight: 80, paddingTop: 10 },

  successBox: {
    backgroundColor: 'rgba(52,211,153,0.08)', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)', alignItems: 'center',
  },
  successText: { fontSize: 15, fontWeight: '700', color: '#059669', marginBottom: 12 },
  pdfBtn: {
    backgroundColor: BRAND_GOLD, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28,
    shadowColor: BRAND_GOLD, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.28, shadowRadius: 6, elevation: 4,
  },
  pdfBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  submitBtn: {
    backgroundColor: BRAND_GREEN, borderRadius: 14, height: 56, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 8, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
})
