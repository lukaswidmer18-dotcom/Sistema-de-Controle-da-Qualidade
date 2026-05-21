import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Modal, ScrollView,
  Alert, RefreshControl,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import api from '@/lib/api'
import { BRAND_GREEN, BRAND_CREAM, HAIRLINE_GREEN } from '@/lib/constants'

interface ConfigOption {
  id: string
  label: string
  value: string
  isActive: boolean
  order: number
}

interface ConfigList {
  id: string
  name: string
  description?: string | null
  options: ConfigOption[]
}

interface NewOption {
  label: string
  value: string
}

export default function OpcoesScreen() {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [modalListName, setModalListName] = useState<string | null>(null)
  const [modalListId, setModalListId] = useState<string | null>(null)
  const [newOpt, setNewOpt] = useState<NewOption>({ label: '', value: '' })

  const { data, isLoading, refetch, isRefetching } = useQuery<{ lists: ConfigList[] }>({
    queryKey: ['config-lists'],
    queryFn: async () => {
      const res = await api.get<{ lists: ConfigList[] }>('/api/config-lists')
      return res.data
    },
  })

  const addOptionMutation = useMutation({
    mutationFn: async ({ listName, option, order }: { listName: string; option: NewOption; order: number }) => {
      if (!option.label.trim()) throw new Error('Nome da opção é obrigatório')
      await api.post('/api/config-lists', {
        listName,
        label: option.label.trim(),
        value: option.value.trim() || option.label.trim(),
        order,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['config-lists'] })
      setModalListName(null)
      setModalListId(null)
      setNewOpt({ label: '', value: '' })
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Erro ao adicionar opção'
      Alert.alert('Erro', msg)
    },
  })

  const toggleExpand = useCallback((id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const openModal = useCallback((list: ConfigList) => {
    setModalListName(list.name)
    setModalListId(list.id)
    setNewOpt({ label: '', value: '' })
  }, [])

  const lists = data?.lists ?? []
  const modalList = lists.find(l => l.id === modalListId)

  return (
    <>
      <Stack.Screen options={{ title: 'Opções das Listas', headerShown: true }} />
      <View style={styles.container}>
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
                <Text style={styles.emptyText}>Nenhuma lista configurada</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isOpen = !!expanded[item.id]
              const activeOptions = item.options.filter(o => o.isActive)
              return (
                <View style={styles.listCard}>
                  <TouchableOpacity
                    style={styles.listHeader}
                    onPress={() => toggleExpand(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.listHeaderLeft}>
                      <Text style={styles.listName}>{item.name}</Text>
                      <Text style={styles.optCount}>{activeOptions.length} opção(ões)</Text>
                    </View>
                    <View style={styles.listHeaderRight}>
                      <TouchableOpacity
                        style={styles.addOptBtn}
                        onPress={() => openModal(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.addOptText}>+ Opção</Text>
                      </TouchableOpacity>
                      <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
                    </View>
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={styles.optionsList}>
                      {item.options.length === 0 ? (
                        <Text style={styles.noOptions}>Nenhuma opção cadastrada</Text>
                      ) : (
                        item.options
                          .sort((a, b) => a.order - b.order)
                          .map(opt => (
                            <View key={opt.id} style={[styles.optionRow, !opt.isActive && styles.optionInactive]}>
                              <View style={styles.orderBadge}>
                                <Text style={styles.orderText}>{opt.order}</Text>
                              </View>
                              <View style={styles.optionInfo}>
                                <Text style={styles.optionLabel}>{opt.label}</Text>
                                <Text style={styles.optionValue}>{opt.value}</Text>
                              </View>
                            </View>
                          ))
                      )}
                    </View>
                  )}
                </View>
              )
            }}
          />
        )}

        <Modal
          visible={modalListName !== null}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => { setModalListName(null); setModalListId(null) }}
        >
          <View style={modal.container}>
            <View style={modal.header}>
              <TouchableOpacity onPress={() => { setModalListName(null); setModalListId(null) }}>
                <Text style={modal.cancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={modal.title} numberOfLines={1}>
                {modalList?.name ?? 'Nova Opção'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (!modalListName || !modalList) return
                  addOptionMutation.mutate({
                    listName: modalListName,
                    option: newOpt,
                    order: modalList.options.length + 1,
                  })
                }}
                disabled={addOptionMutation.isPending}
              >
                <Text style={[modal.save, addOptionMutation.isPending && modal.saveDisabled]}>
                  {addOptionMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={modal.body} keyboardShouldPersistTaps="handled">
              <Text style={modal.label}>Nome de Exibição *</Text>
              <TextInput
                style={modal.input}
                value={newOpt.label}
                onChangeText={v => setNewOpt(prev => ({ ...prev, label: v }))}
                placeholder="Ex: Produto Resfriado"
                placeholderTextColor="#9ca3af"
              />

              <Text style={modal.label}>Valor Interno (opcional — usa o nome se vazio)</Text>
              <TextInput
                style={modal.input}
                value={newOpt.value}
                onChangeText={v => setNewOpt(prev => ({ ...prev, value: v }))}
                placeholder="Ex: RESFRIADO"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
              />
            </ScrollView>
          </View>
        </Modal>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_CREAM },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12 },
  listCard: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 10,
    borderWidth: 1, borderColor: HAIRLINE_GREEN, overflow: 'hidden',
    shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  listHeaderLeft: { flex: 1 },
  listName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  optCount: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  listHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addOptBtn: { backgroundColor: BRAND_GREEN, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
  addOptText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  chevron: { fontSize: 11, color: '#9ca3af' },
  optionsList: { borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  noOptions: { color: '#9ca3af', fontSize: 13, padding: 14, textAlign: 'center' },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  optionInactive: { opacity: 0.5 },
  orderBadge: {
    width: 28, height: 22, borderRadius: 4, backgroundColor: '#f3f4f6',
    alignItems: 'center', justifyContent: 'center',
  },
  orderText: { fontSize: 10, fontWeight: '700', color: '#9ca3af' },
  optionInfo: { flex: 1 },
  optionLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  optionValue: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
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
  title: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  save: { fontSize: 15, color: BRAND_GREEN, fontWeight: '700' },
  saveDisabled: { opacity: 0.5 },
  body: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827',
  },
})
