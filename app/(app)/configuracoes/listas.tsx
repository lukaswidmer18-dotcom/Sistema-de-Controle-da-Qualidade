import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Modal, ScrollView,
  Switch, Alert, RefreshControl,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import api from '@/lib/api'
import { BRAND_GREEN, BRAND_GOLD } from '@/lib/constants'

interface Recipient { email: string }

interface EmailList {
  id: string
  name: string
  description?: string | null
  isActive: boolean
  recipients: Recipient[]
}

interface ListFormData {
  name: string
  description: string
  isActive: boolean
  emailsRaw: string
}

const EMPTY_FORM: ListFormData = { name: '', description: '', isActive: true, emailsRaw: '' }

function parseEmails(raw: string): string[] {
  return raw.split(/[\n,;]+/).map(e => e.trim()).filter(e => e.includes('@'))
}

export default function ListasScreen() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ListFormData>(EMPTY_FORM)

  const { data, isLoading, refetch, isRefetching } = useQuery<{ lists: EmailList[] }>({
    queryKey: ['email-lists'],
    queryFn: async () => {
      const res = await api.get<{ lists: EmailList[] }>('/api/email-lists')
      return res.data
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error('Nome da lista é obrigatório')
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        isActive: form.isActive,
        recipients: parseEmails(form.emailsRaw).map(email => ({ email })),
      }
      if (editingId) {
        await api.put(`/api/email-lists/${editingId}`, payload)
      } else {
        await api.post('/api/email-lists', payload)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['email-lists'] })
      setModalOpen(false)
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar lista'
      Alert.alert('Erro', msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/email-lists/${id}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['email-lists'] })
    },
    onError: () => Alert.alert('Erro', 'Não foi possível excluir a lista'),
  })

  const openCreate = useCallback(() => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((list: EmailList) => {
    setEditingId(list.id)
    setForm({
      name: list.name,
      description: list.description ?? '',
      isActive: list.isActive,
      emailsRaw: list.recipients.map(r => r.email).join('\n'),
    })
    setModalOpen(true)
  }, [])

  const confirmDelete = useCallback((id: string, name: string) => {
    Alert.alert('Excluir lista', `Excluir "${name}"? Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ])
  }, [deleteMutation])

  const updateForm = useCallback(<K extends keyof ListFormData>(key: K, value: ListFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  const lists = data?.lists ?? []

  return (
    <>
      <Stack.Screen options={{ title: 'Listas de E-mail', headerShown: true }} />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.count}>{lists.length} lista(s)</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Nova Lista</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={BRAND_GREEN} size="large" />
          </View>
        ) : (
          <FlatList
            data={lists}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={BRAND_GREEN} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Nenhuma lista criada</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.card, !item.isActive && styles.cardInactive]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.listName}>{item.name}</Text>
                    <View style={[styles.badge, item.isActive ? styles.badgeActive : styles.badgeInactive]}>
                      <Text style={[styles.badgeText, item.isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
                        {item.isActive ? 'Ativa' : 'Inativa'}
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
                {item.description && <Text style={styles.listDesc}>{item.description}</Text>}
                <Text style={styles.recipients}>
                  {item.recipients.length} destinatário(s)
                  {item.recipients.length > 0 && (
                    ' — ' + item.recipients.slice(0, 2).map(r => r.email).join(', ')
                    + (item.recipients.length > 2 ? ` +${item.recipients.length - 2}` : '')
                  )}
                </Text>
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
              <Text style={modal.title}>{editingId ? 'Editar Lista' : 'Nova Lista'}</Text>
              <TouchableOpacity onPress={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Text style={[modal.save, saveMutation.isPending && modal.saveDisabled]}>
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={modal.body} keyboardShouldPersistTaps="handled">
              <Text style={modal.label}>Nome da Lista *</Text>
              <TextInput
                style={modal.input}
                value={form.name}
                onChangeText={v => updateForm('name', v)}
                placeholder="Ex: Equipe de Qualidade"
                placeholderTextColor="#9ca3af"
              />

              <Text style={modal.label}>Descrição</Text>
              <TextInput
                style={modal.input}
                value={form.description}
                onChangeText={v => updateForm('description', v)}
                placeholder="Descrição opcional"
                placeholderTextColor="#9ca3af"
              />

              <View style={modal.switchRow}>
                <Text style={modal.label}>Lista ativa</Text>
                <Switch
                  value={form.isActive}
                  onValueChange={v => updateForm('isActive', v)}
                  trackColor={{ true: BRAND_GREEN }}
                />
              </View>

              <Text style={modal.label}>Destinatários (um por linha)</Text>
              <TextInput
                style={[modal.input, modal.textarea]}
                value={form.emailsRaw}
                onChangeText={v => updateForm('emailsRaw', v)}
                placeholder={'email1@empresa.com\nemail2@empresa.com'}
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              {form.emailsRaw.length > 0 && (
                <Text style={modal.hint}>{parseEmails(form.emailsRaw).length} e-mail(s) válido(s)</Text>
              )}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
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
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#f0f0f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardInactive: { opacity: 0.65 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  listName: { fontSize: 14, fontWeight: '700', color: '#111827' },
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
  listDesc: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  recipients: { fontSize: 11, color: '#9ca3af' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#9ca3af', fontSize: 15 },
})

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
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
  textarea: { minHeight: 120 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  hint: { fontSize: 12, color: BRAND_GOLD, marginTop: 4 },
})
