import { useState, useEffect } from 'react'
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import api, { API_BASE_URL } from '@/lib/api'
import { ReceiptDetail } from '@/lib/types'
import { BRAND_GREEN, BRAND_GOLD, BRAND_CREAM, HAIRLINE_GREEN } from '@/lib/constants'
import { getStatusLabel, getStatusColor, formatDateTime } from '@/lib/utils'

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [showEmailForm, setShowEmailForm] = useState(false)
  const [emailRecipients, setEmailRecipients] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const { data, isLoading, isError } = useQuery<{ receipt: ReceiptDetail }>({
    queryKey: ['receipt', id],
    queryFn: async () => {
      const res = await api.get<{ receipt: ReceiptDetail }>(`/api/receipts/${id}`)
      return res.data
    },
    enabled: !!id,
  })

  const receipt = data?.receipt

  useEffect(() => {
    if (!receipt) return
    const lastLog = receipt.emailLogs?.[0]
    setEmailSubject(
      lastLog?.subject ?? `Relatório de Recebimento - ${receipt.formNumber}`
    )
    setEmailBody(
      lastLog?.body ??
        `Segue o relatório de recebimento referente ao formulário ${receipt.formNumber}.\n\nNF: ${receipt.invoiceNumber}\nPlaca: ${receipt.trailerPlate}`
    )
    setEmailRecipients(lastLog?.recipients?.join(', ') ?? '')
  }, [receipt])

  const emailMutation = useMutation({
    mutationFn: async () => {
      const recipients = emailRecipients
        .split(',')
        .map(r => r.trim())
        .filter(Boolean)
      if (recipients.length === 0) throw new Error('Informe ao menos um destinatário.')
      await api.post('/api/email', {
        receiptId: id,
        recipients,
        subject: emailSubject,
        body: emailBody,
        pdfUrl: receipt?.pdfUrl ?? undefined,
      })
    },
    onSuccess: () => {
      setEmailSent(true)
      setShowEmailForm(false)
      queryClient.invalidateQueries({ queryKey: ['receipt', id] })
    },
    onError: (err: unknown) => {
      let message = 'Erro ao enviar e-mail'
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as { error?: string } | undefined
        message = d?.error ?? err.message
      } else if (err instanceof Error) {
        message = err.message
      }
      Alert.alert('Erro', message)
    },
  })

  const openPdf = async () => {
    if (!receipt?.pdfUrl) return
    const url = receipt.pdfUrl.startsWith('http') ? receipt.pdfUrl : `${API_BASE_URL}${receipt.pdfUrl}`
    await WebBrowser.openBrowserAsync(url)
  }

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Recebimento' }} />
        <View style={styles.center}>
          <ActivityIndicator color={BRAND_GREEN} size="large" />
        </View>
      </>
    )
  }

  if (isError || !receipt) {
    return (
      <>
        <Stack.Screen options={{ title: 'Recebimento' }} />
        <View style={styles.center}>
          <Text style={styles.errorText}>Erro ao carregar recebimento</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </>
    )
  }

  const statusColor = getStatusColor(receipt.generalStatus)
  const ncs = receipt.nonConformities ?? []
  const temps = receipt.temperatures ?? []
  const products = receipt.products ?? []
  const lastLog = receipt.emailLogs?.[0]

  return (
    <>
      <Stack.Screen options={{ title: receipt.formNumber }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Status header */}
          <View style={[styles.statusHeader, { borderLeftColor: statusColor }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formNumber}>{receipt.formNumber}</Text>
              <Text style={styles.dateText}>{formatDateTime(receipt.receivedAt)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}40` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel(receipt.generalStatus)}</Text>
            </View>
          </View>

          {/* Identification */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Identificação</Text>
            <InfoRow label="NF" value={receipt.invoiceNumber} />
            <InfoRow label="Placa" value={receipt.trailerPlate} />
            <InfoRow label="Ordem" value={receipt.receivingOrder} />
            <InfoRow label="Avaliador" value={receipt.evaluatorName} />
            {receipt.unit ? <InfoRow label="Unidade" value={receipt.unit} /> : null}
            <InfoRow label="Resp. Qualidade" value={receipt.qualityResponsible} />
            <InfoRow label="Resp. Operação" value={receipt.operationResponsible} />
            {receipt.observations ? <InfoRow label="Observações" value={receipt.observations} /> : null}
          </View>

          {/* Products */}
          {products.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Produtos ({products.length})</Text>
              {products.map((p) => (
                <View key={p.id} style={styles.productRow}>
                  <Text style={styles.productCode}>{p.productCode}</Text>
                  {p.productDescription ? (
                    <Text style={styles.productDesc}>{p.productDescription}</Text>
                  ) : null}
                  <Text style={styles.productMeta}>Lote: {p.lot}{p.quantity ? `  ·  Qtd: ${p.quantity}` : ''}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Non-conformities */}
          {ncs.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: '#dc2626' }]}>Não Conformidades ({ncs.length})</Text>
              {ncs.map((nc) => (
                <View key={nc.id} style={styles.ncCard}>
                  <Text style={styles.ncSection}>{nc.section}</Text>
                  <Text style={styles.ncDesc}>{nc.description}</Text>
                  <View style={[styles.ncStatusBadge, nc.status === 'RESOLVIDA' ? styles.ncStatusDone : styles.ncStatusOpen]}>
                    <Text style={[styles.ncStatusText, nc.status === 'RESOLVIDA' ? styles.ncStatusTextDone : styles.ncStatusTextOpen]}>
                      {nc.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Temperatures */}
          {temps.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Temperaturas ({temps.length})</Text>
              {temps.map((t) => (
                <View key={t.id} style={styles.tempRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tempType}>{t.temperatureType}</Text>
                    {t.productCode ? <Text style={styles.tempMeta}>Produto: {t.productCode}</Text> : null}
                    {t.lot ? <Text style={styles.tempMeta}>Lote: {t.lot}</Text> : null}
                    {t.observation ? <Text style={styles.tempMeta}>Obs: {t.observation}</Text> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {t.temperature != null ? (
                      <Text style={styles.tempValue}>{t.temperature}{t.unit}</Text>
                    ) : null}
                    {t.status ? (
                      <Text style={[styles.tempStatus, t.status === 'NAO_CONFORME' && { color: '#dc2626' }]}>
                        {t.status.replace('_', ' ')}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* PDF button */}
          {receipt.pdfUrl ? (
            <TouchableOpacity style={styles.pdfBtn} onPress={openPdf} activeOpacity={0.85}>
              <Text style={styles.pdfBtnText}>📄  Abrir PDF</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.noPdfBox}>
              <Text style={styles.noPdfText}>PDF ainda não gerado</Text>
            </View>
          )}

          {/* Email resend */}
          <View style={[styles.section, { marginTop: 12 }]}>
            <View style={styles.emailHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>E-mail</Text>
                {lastLog ? (
                  <Text style={styles.emailLastSent}>
                    Último envio: {formatDateTime(lastLog.sentAt)}
                    {lastLog.sender ? ` · ${lastLog.sender.name}` : ''}
                  </Text>
                ) : (
                  <Text style={styles.emailLastSent}>Nenhum envio registrado</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.emailToggleBtn}
                onPress={() => setShowEmailForm(v => !v)}
              >
                <Text style={styles.emailToggleBtnText}>
                  {showEmailForm ? 'Cancelar' : (lastLog ? 'Reenviar' : 'Enviar')}
                </Text>
              </TouchableOpacity>
            </View>

            {emailSent && !showEmailForm && (
              <View style={styles.emailSuccessBox}>
                <Text style={styles.emailSuccessText}>E-mail enviado com sucesso!</Text>
              </View>
            )}

            {showEmailForm && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.fieldLabel}>Destinatários * (separados por vírgula)</Text>
                <TextInput
                  style={styles.input}
                  value={emailRecipients}
                  onChangeText={setEmailRecipients}
                  placeholder="email@exemplo.com, outro@exemplo.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.fieldLabel}>Assunto *</Text>
                <TextInput
                  style={styles.input}
                  value={emailSubject}
                  onChangeText={setEmailSubject}
                  placeholder="Assunto do e-mail"
                  placeholderTextColor="#9ca3af"
                />

                <Text style={styles.fieldLabel}>Mensagem *</Text>
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  value={emailBody}
                  onChangeText={setEmailBody}
                  placeholder="Corpo do e-mail..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[styles.emailSendBtn, emailMutation.isPending && styles.emailSendBtnDisabled]}
                  onPress={() => emailMutation.mutate()}
                  disabled={emailMutation.isPending}
                  activeOpacity={0.85}
                >
                  {emailMutation.isPending ? (
                    <>
                      <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                      <Text style={styles.emailSendBtnText}>Enviando...</Text>
                    </>
                  ) : (
                    <Text style={styles.emailSendBtnText}>✉  Enviar E-mail</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_CREAM },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND_CREAM },
  errorText: { color: '#6b7280', fontSize: 15, marginBottom: 16 },
  backBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: BRAND_GREEN, borderRadius: 10 },
  backBtnText: { color: '#fff', fontWeight: '700' },

  statusHeader: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: HAIRLINE_GREEN, borderLeftWidth: 4,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  formNumber: { fontFamily: 'monospace', fontSize: 15, fontWeight: '700', color: BRAND_GREEN },
  dateText: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: '700' },

  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: HAIRLINE_GREEN,
    shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '800', color: BRAND_GREEN,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  infoLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '600', flex: 1 },
  infoValue: { fontSize: 13, color: '#111827', fontWeight: '500', flex: 2, textAlign: 'right' },

  productRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  productCode: { fontSize: 13, fontWeight: '700', color: BRAND_GREEN },
  productDesc: { fontSize: 12, color: '#374151', marginTop: 2 },
  productMeta: { fontSize: 11, color: '#9ca3af', marginTop: 2 },

  ncCard: { padding: 10, backgroundColor: '#fff5f5', borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#fca5a5' },
  ncSection: { fontSize: 10, fontWeight: '700', color: '#991b1b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  ncDesc: { fontSize: 13, color: '#450a0a', marginBottom: 6 },
  ncStatusBadge: { alignSelf: 'flex-start', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1 },
  ncStatusOpen: { backgroundColor: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.5)' },
  ncStatusDone: { backgroundColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.4)' },
  ncStatusText: { fontSize: 10, fontWeight: '700' },
  ncStatusTextOpen: { color: '#b45309' },
  ncStatusTextDone: { color: '#059669' },

  tempRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  tempType: { fontSize: 13, fontWeight: '600', color: '#374151' },
  tempMeta: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  tempValue: { fontSize: 16, fontWeight: '700', color: BRAND_GREEN },
  tempStatus: { fontSize: 11, fontWeight: '600', color: '#6b7280', marginTop: 2 },

  pdfBtn: {
    backgroundColor: BRAND_GOLD, borderRadius: 14, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
    shadowColor: BRAND_GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 8, elevation: 6,
  },
  pdfBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  noPdfBox: { backgroundColor: '#f9fafb', borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  noPdfText: { color: '#9ca3af', fontWeight: '600' },

  emailHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  emailLastSent: { fontSize: 11, color: '#9ca3af', marginBottom: 2 },
  emailToggleBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1.5, borderColor: BRAND_GREEN },
  emailToggleBtnText: { color: BRAND_GREEN, fontWeight: '700', fontSize: 13 },
  emailSuccessBox: { marginTop: 10, backgroundColor: 'rgba(52,211,153,0.08)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' },
  emailSuccessText: { color: '#059669', fontWeight: '600', fontSize: 13, textAlign: 'center' },

  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', marginBottom: 5, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#111827', backgroundColor: '#fafafa',
  },
  inputMulti: { minHeight: 90, paddingTop: 10 },
  emailSendBtn: {
    marginTop: 14, backgroundColor: BRAND_GREEN, borderRadius: 12, height: 48,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  emailSendBtnDisabled: { opacity: 0.6 },
  emailSendBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
})
