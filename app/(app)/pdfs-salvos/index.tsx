import { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, RefreshControl,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { router, Stack } from 'expo-router'
import { Receipt, ReceiptListResponse } from '@/lib/types'
import { BRAND_GREEN, BRAND_GOLD, BRAND_CREAM, HAIRLINE_GREEN } from '@/lib/constants'
import { getStatusLabel, getStatusColor, formatDateTime } from '@/lib/utils'

export default function PdfsSalvos() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const logout = useAuthStore(s => s.logout)
  const user = useAuthStore(s => s.user)

  const { data, isLoading, refetch, isRefetching } = useQuery<ReceiptListResponse>({
    queryKey: ['receipts', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      const res = await api.get<ReceiptListResponse>(`/api/receipts?${params}`)
      return res.data
    },
  })

  const handleLogout = async () => {
    await logout()
    router.replace('/(auth)/login')
  }

  const isAdmin = user?.role === 'ADMIN'

  const renderItem = ({ item }: { item: Receipt }) => {
    const color = getStatusColor(item.generalStatus)
    const hasNCs = (item._count?.nonConformities ?? 0) > 0
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(app)/pdfs-salvos/${item.id}`)}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <Text style={styles.formNumber}>{item.formNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
            <Text style={[styles.statusText, { color }]}>{getStatusLabel(item.generalStatus)}</Text>
          </View>
        </View>
        {isAdmin && (
          <Text style={styles.unitText}>{item.evaluatorName}</Text>
        )}
        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>NF {item.invoiceNumber}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{item.trailerPlate}</Text>
          {hasNCs && (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={[styles.metaText, { color: '#dc2626' }]}>
                {item._count?.nonConformities} NC
              </Text>
            </>
          )}
        </View>
        <View style={styles.cardBottom}>
          <Text style={styles.dateText}>{formatDateTime(item.receivedAt)}</Text>
          <Text style={styles.pdfLink}>Ver detalhes →</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: 'PDFs Salvos', headerShown: true }} />
      <View style={styles.container}>
        {/* Header with user info */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerName}>{user?.name}</Text>
            <Text style={styles.headerRole}>{user?.role === 'ADMIN' ? 'Administrador' : 'Qualidade'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={v => { setSearch(v); setPage(1) }}
            placeholder="Buscar por NF, placa, formulário..."
            placeholderTextColor="#9ca3af"
            returnKeyType="search"
          />
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={BRAND_GREEN} size="large" />
          </View>
        ) : (
          <FlatList
            data={data?.receipts ?? []}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={BRAND_GREEN} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Nenhum recebimento encontrado</Text>
              </View>
            }
            ListFooterComponent={
              data && data.totalPages > 1 ? (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                    onPress={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <Text style={styles.pageBtnText}>‹ Anterior</Text>
                  </TouchableOpacity>
                  <Text style={styles.pageInfo}>{page} / {data.totalPages}</Text>
                  <TouchableOpacity
                    style={[styles.pageBtn, page >= data.totalPages && styles.pageBtnDisabled]}
                    onPress={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page >= data.totalPages}
                  >
                    <Text style={styles.pageBtnText}>Próximo ›</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_CREAM },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: BRAND_GREEN, paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(188,147,63,0.26)',
  },
  headerName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  headerRole: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  logoutBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  searchBox: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: HAIRLINE_GREEN },
  searchInput: {
    height: 40, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 12, fontSize: 14, color: '#111827', backgroundColor: '#fafafa',
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: HAIRLINE_GREEN,
    shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  formNumber: { fontFamily: 'monospace', fontSize: 13, fontWeight: '700', color: BRAND_GREEN },
  unitText: { fontSize: 11, fontWeight: '700', color: BRAND_GOLD, marginBottom: 6, textTransform: 'uppercase' },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  metaText: { fontSize: 13, color: '#6b7280' },
  metaDot: { color: '#d1d5db' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 12, color: '#9ca3af' },
  pdfLink: { fontSize: 12, fontWeight: '700', color: BRAND_GOLD },
  noPdf: { fontSize: 12, color: '#d1d5db' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: '#9ca3af', fontSize: 15 },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  pageBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: BRAND_GREEN },
  pageBtnDisabled: { opacity: 0.3 },
  pageBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  pageInfo: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
})
