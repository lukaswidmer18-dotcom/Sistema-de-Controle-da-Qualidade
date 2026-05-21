import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Modal, ScrollView,
  Switch, Alert, RefreshControl,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import api from '@/lib/api'
import { BRAND_GREEN, BRAND_CREAM, HAIRLINE_GREEN } from '@/lib/constants'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  isActive: boolean
}

interface TemplateFormData {
  name: string
  subject: string
  body: string
  isActive: boolean
}

const EMPTY_FORM: TemplateFormData = { name: '', subject: '', body: '', isActive: true }

export default function ModelosScreen() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TemplateFormData>(EMPTY_FORM)

  const { data, isLoading, refetch, isRefetching } = useQuery<{ templates: EmailTemplate[] }>({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const res = await api.get<{ templates: EmailTemplate[] }>('/api/email-templates')
      return res.data
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error('Nome é obrigatório')
      if (!form.subject.trim()) throw new Error('Assunto é obrigatório')
      const payload = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        body: form.body.trim(),
        isActive: form.isActive,
      }
      if (editingId) {
        await api.put(`/api/email-templates/${editingId}`, payload)
      } else {
        await api.post('/api/email-templates', payload)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      setModalOpen(false)
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar modelo'
      Alert.alert('Erro', msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/email-templates/${id}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['email-templates'] })
    },
    onError: () => Alert.alert('Erro', 'Não foi possível excluir o modelo'),
  })

  const openCreate = useCallback(() => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((tmpl: EmailTemplate) => {
    setEditingId(tmpl.id)
    setForm({ name: tmpl.name, subject: tmpl.subject, body: tmpl.body, isActive: tmpl.isActive })
    setModalOpen(true)
  }, [])

  const confirmDelete = useCallback((id: string, name: string) => {
    Alert.alert('Excluir modelo', `Excluir "${name}"? Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ])
  }, [deleteMutation])

  const updateForm = useCallback(<K extends keyof TemplateFormData>(key: K, value: TemplateFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  const templates = data?.templates ?? []

  return (
    <>
      <Stack.Screen options={{ title: 'Modelos de E-mail', headerShown: true }} />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.count}>{templates.length} modelo(s)</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Novo Modelo</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={BRAND_GREEN} size="large" />
          </View>
        ) : (
          <FlatList
            data={templates}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={BRAND_GREEN} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Nenhum modelo criado</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.card, !item.isActive && styles.cardInactive]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.templateName}>{item.name}</Text>
                    <View style={[styles.badge, item.isActive ? styles.badgeActive : styles.badgeInactive]}>
                      <Text style={[styles.badgeText, item.isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
                        {item.isActive ? 'Ativo' : 'Inativo'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)} activeOpacity={0.7}>
                      <Text style={styles.editIcon}>✎</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => confirmDelete(item.id, item.name)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.deleteIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.subject} numberOfLines={1}>Assunto: {item.subject}</Text>
                <Text style={styles.bodyPreview} numberOfLines={2}>{item.body}</Text>
              </View>
            )}
          />
        )}

        <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
          <View style={modal.container}>
            <View style={modal.header}>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Text style={modal.cancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={modal.title}>{editingId ? 'Editar Modelo' : 'Novo Modelo'}</Text>
              <TouchableOpacity onPress={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Text style={[modal.save, saveMutation.isPending && modal.saveDisabled]}>
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={modal.body} keyboardShouldPersistTaps="handled">
              <Text style={modal.label}>Nome *</Text>
              <TextInput
                style={modal.input}
                value={form.name}
                onChangeText={v => updateForm('name', v)}
                placeholder="Nome do modelo"
                placeholderTextColor="#9ca3af"
              />

              <Text style={modal.label}>Assunto *</Text>
              <TextInput
                style={modal.input}
                value={form.subject}
                onChangeText={v => updateForm('subject', v)}
                placeholder="Assunto do e-mail"
                placeholderTextColor="#9ca3af"
              />

              <View style={modal.switchRow}>
                <Text style={modal.label}>Modelo ativo</Text>
                <Switch
                  value={form.isActive}
                  onValueChange={v => updateForm('isActive', v)}
                  trackColor={{ true: BRAND_GREEN }}
                />
              </View>

              <Text style={modal.label}>Corpo do E-mail</Text>
              <TextInput
                style={[modal.input, modal.textarea]}
                value={form.body}
                onChangeText={v => updateForm('body', v)}
                placeholder="Conteúdo do e-mail..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />
              <Text style={modal.hint}>
                Variáveis: {`{{numero_formulario}}`}, {`{{nota_fiscal}}`}, {`{{placa}}`}, {`{{status_geral}}`}
              </Text>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_CREAM },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  count: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  addBtn: { backgroundColor: BRAND_GREEN, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: HAIRLINE_GREEN,
    shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  cardInactive: { opacity: 0.65 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  templateName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  badge: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: 5, borderWidth: 1 },
  badgeActive: { backgroundColor: 'rgba(22,65,58,0.08)', borderColor: 'rgba(22,65,58,0.2)' },
  badgeInactive: { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  badgeTextActive: { color: BRAND_GREEN },
  badgeTextInactive: { color: '#9ca3af' },
  actions: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { backgroundColor: '#fef2f2' },
  editIcon: { fontSize: 14, color: BRAND_GREEN },
  deleteIcon: { fontSize: 12, color: '#dc2626', fontWeight: '700' },
  subject: { fontSize: 12, color: '#374151', marginBottom: 4 },
  bodyPreview: { fontSize: 12, color: '#9ca3af', lineHeight: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#9ca3af', fontSize: 15 },
})

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_CREAM },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  cancel: { fontSize: 15, color: '#6b7280' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  save: { fontSize: 15, color: BRAND_GREEN, fontWeight: '700' },
  saveDisabled: { opacity: 0.5 },
  body: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827',
  },
  textarea: { minHeight: 180 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  hint: { fontSize: 11, color: '#9ca3af', marginTop: 6, lineHeight: 16 },
})
