import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Modal, ScrollView,
  Switch, RefreshControl,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import api from '@/lib/api'
import { alert } from '@/lib/alert'
import { useAuthStore } from '@/store/authStore'
import { BRAND_GREEN, BRAND_GOLD, BRAND_CREAM, HAIRLINE_GREEN } from '@/lib/constants'
import type { UserRole } from '@/lib/types'

interface UserRow {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
}

interface UserFormData {
  name: string
  email: string
  password: string
  role: UserRole
  isActive: boolean
}

const EMPTY_FORM: UserFormData = { name: '', email: '', password: '', role: 'QUALIDADE', isActive: true }

export default function UsuariosScreen() {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore(s => s.user)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM)

  const { data, isLoading, refetch, isRefetching } = useQuery<{ users: UserRow[] }>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<{ users: UserRow[] }>('/api/users')
      return res.data
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error('Nome é obrigatório')
      if (!form.email.trim() || !form.email.includes('@')) throw new Error('E-mail válido é obrigatório')
      if (!editingId && !form.password) throw new Error('Senha é obrigatória para novos usuários')

      const payload: Partial<UserFormData> = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        isActive: form.isActive,
      }
      if (form.password) payload.password = form.password

      if (editingId) {
        await api.put(`/api/users/${editingId}`, payload)
      } else {
        await api.post('/api/users', payload)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      setModalOpen(false)
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar usuário'
      alert('Erro', msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/users/${id}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: () => alert('Erro', 'Não foi possível deletar o usuário'),
  })

  const openCreate = useCallback(() => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((user: UserRow) => {
    setEditingId(user.id)
    setForm({ name: user.name, email: user.email, password: '', role: user.role, isActive: user.isActive })
    setModalOpen(true)
  }, [])

  const confirmDelete = useCallback((user: UserRow) => {
    if (user.id === currentUser?.id) {
      alert('Aviso', 'Não é possível deletar sua própria conta')
      return
    }
    alert('Deletar Usuário', `Deletar "${user.name}"? Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Deletar', style: 'destructive', onPress: () => deleteMutation.mutate(user.id) },
    ])
  }, [currentUser?.id, deleteMutation])

  const updateForm = useCallback(<K extends keyof UserFormData>(key: K, value: UserFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  const users = data?.users ?? []

  return (
    <>
      <Stack.Screen options={{ title: 'Usuários', headerShown: true }} />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.count}>{users.length} usuário(s)</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Novo Usuário</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={BRAND_GREEN} size="large" />
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={BRAND_GREEN} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Nenhum usuário cadastrado</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.card, !item.isActive && styles.cardInactive]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.userName}>{item.name}</Text>
                        {item.id === currentUser?.id && (
                          <Text style={styles.youBadge}>Você</Text>
                        )}
                      </View>
                      <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)} activeOpacity={0.7}>
                      <Text style={styles.editIcon}>✎</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => confirmDelete(item)}
                      disabled={item.id === currentUser?.id}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.deleteIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <View style={[styles.roleBadge, item.role === 'ADMIN' ? styles.roleAdmin : styles.roleQualidade]}>
                    <Text style={[styles.roleText, item.role === 'ADMIN' ? styles.roleTextAdmin : styles.roleTextQualidade]}>
                      {item.role === 'ADMIN' ? 'Administrador' : 'Qualidade'}
                    </Text>
                  </View>
                  <View style={styles.statusDot}>
                    <View style={[styles.dot, item.isActive ? styles.dotActive : styles.dotInactive]} />
                    <Text style={[styles.statusText, item.isActive ? styles.statusActive : styles.statusInactive]}>
                      {item.isActive ? 'Ativo' : 'Inativo'}
                    </Text>
                  </View>
                </View>
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
              <Text style={modal.title}>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</Text>
              <TouchableOpacity onPress={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Text style={[modal.save, saveMutation.isPending && modal.saveDisabled]}>
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={modal.body} keyboardShouldPersistTaps="handled">
              <Text style={modal.label}>Nome Completo *</Text>
              <TextInput
                style={modal.input}
                value={form.name}
                onChangeText={v => updateForm('name', v)}
                placeholder="Nome do usuário"
                placeholderTextColor="#9ca3af"
              />

              <Text style={modal.label}>E-mail *</Text>
              <TextInput
                style={[modal.input, !!editingId && modal.inputDisabled]}
                value={form.email}
                onChangeText={v => updateForm('email', v)}
                placeholder="usuario@empresa.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!editingId}
              />
              {editingId && <Text style={modal.hint}>E-mail não pode ser alterado</Text>}

              <Text style={modal.label}>
                Senha {editingId ? '(deixe em branco para não alterar)' : '*'}
              </Text>
              <TextInput
                style={modal.input}
                value={form.password}
                onChangeText={v => updateForm('password', v)}
                placeholder={editingId ? 'Nova senha (opcional)' : 'Senha'}
                placeholderTextColor="#9ca3af"
                secureTextEntry
              />

              <Text style={modal.label}>Perfil</Text>
              <View style={modal.roleRow}>
                {(['QUALIDADE', 'ADMIN'] as UserRole[]).map(role => (
                  <TouchableOpacity
                    key={role}
                    style={[modal.roleBtn, form.role === role && modal.roleBtnActive]}
                    onPress={() => updateForm('role', role)}
                    activeOpacity={0.7}
                  >
                    <Text style={[modal.roleBtnText, form.role === role && modal.roleBtnTextActive]}>
                      {role === 'ADMIN' ? 'Administrador' : 'Qualidade'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={modal.switchRow}>
                <Text style={modal.label}>Usuário ativo</Text>
                <Switch
                  value={form.isActive}
                  onValueChange={v => updateForm('isActive', v)}
                  trackColor={{ true: BRAND_GREEN }}
                />
              </View>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: BRAND_GREEN, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: BRAND_GOLD, fontWeight: '800', fontSize: 16 },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  youBadge: {
    fontSize: 10, fontWeight: '700', color: BRAND_GREEN,
    backgroundColor: 'rgba(22,65,58,0.08)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  userEmail: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { backgroundColor: '#fef2f2' },
  editIcon: { fontSize: 14, color: BRAND_GREEN },
  deleteIcon: { fontSize: 12, color: '#dc2626', fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roleBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1 },
  roleAdmin: { backgroundColor: 'rgba(188,147,63,0.1)', borderColor: 'rgba(188,147,63,0.3)' },
  roleQualidade: { backgroundColor: 'rgba(22,65,58,0.08)', borderColor: 'rgba(22,65,58,0.2)' },
  roleText: { fontSize: 11, fontWeight: '700' },
  roleTextAdmin: { color: BRAND_GOLD },
  roleTextQualidade: { color: BRAND_GREEN },
  statusDot: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: '#10b981' },
  dotInactive: { backgroundColor: '#d1d5db' },
  statusText: { fontSize: 12 },
  statusActive: { color: '#059669' },
  statusInactive: { color: '#9ca3af' },
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
  inputDisabled: { backgroundColor: '#f9fafb', color: '#9ca3af' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center',
  },
  roleBtnActive: { backgroundColor: BRAND_GREEN, borderColor: BRAND_GREEN },
  roleBtnText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  roleBtnTextActive: { color: '#fff' },
})
