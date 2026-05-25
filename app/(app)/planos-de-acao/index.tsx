import { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, RefreshControl,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router, Stack } from 'expo-router'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { BRAND_GREEN, BRAND_GOLD, BRAND_CREAM, HAIRLINE_GREEN } from '@/lib/constants'

interface ReceiptSummary {
  id: string
  formNumber: string
  invoiceNumber: string
  trailerPlate: string
  receivedAt: string
  qualityResponsible: string
  _count: { nonConformities: number }
}

interface ActionPlan {
  id: string
  description: string
  responsible: string
  deadline: string
  status: 'PENDENTE' | 'CONCLUIDO'
  pdfUrl: string | null
  createdAt: string
  receipt: ReceiptSummary
}

interface ActionPlansResponse {
  actionPlans: ActionPlan[]
  total: number
}

type StatusFilter = 'ALL' | 'PENDENTE' | 'CONCLUIDO'

function formatDate(dateStr: string) {
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR')
}

export default function PlanosDeAcao() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const user = useAuthStore(s => s.user)

  const { data, isLoading, refetch, isRefetching } = useQuery<ActionPlansResponse>({
    queryKey: ['action-plans', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('responsible', search)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      const res = await api.get<ActionPlansResponse>(`/api/action-plans?${params}`)
      return res.data
    },
  })

  const totalPages = Math.ceil((data?.total ?? 0) / 20)

  const renderItem = ({ item }: { item: ActionPlan }) => {
    const isDone = item.status === 'CONCLUIDO'
    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: isDone ? '#34d399' : '#fbbf24', borderLeftWidth: 4 }]}
        onPress={() => router.push(`/(app)/planos-de-acao/${item.receipt.id}`)}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <Text style={styles.formNumber}>{item.receipt.formNumber}</Text>
          <View style={[styles.badge, isDone ? styles.badgeDone : styles.badgePending]}>
            <Text style={[styles.badgeText, isDone ? styles.badgeTextDone : styles.badgeTextPending]}>
              {isDone ? 'Concluído' : 'Pendente'}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>NF</Text>
          <Text style={styles.value}>{item.receipt.invoiceNumber}</Text>
          <Text style={styles.sep}>·</Text>
          <Text style={styles.label}>Placa</Text>
          <Text style={styles.value}>{item.receipt.trailerPlate}</Text>
          {item.receipt._count.nonConformities > 0 && (
            <>
              <Text style={styles.sep}>·</Text>
              <Text style={styles.ncBadge}>{item.receipt._count.nonConformities} NC</Text>
            </>
          )}
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Responsável</Text>
          <Text style={[styles.value, { flex: 1 }]} numberOfLines={1}>{item.responsible}</Text>
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.dateText}>Prazo: {formatDate(item.deadline)}</Text>
          <Text style={styles.pdfLink}>Ver detalhes →</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Planos de Ação', headerShown: true }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerName}>{user?.name}</Text>
            <Text style={styles.headerRole}>Administrador</Text>
          </View>
          <Text style={styles.total}>{data?.total ?? 0} plano(s)</Text>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={v => { setSearch(v); setPage(1) }}
            placeholder="Buscar por responsável..."
            placeholderTextColor="#9ca3af"
            returnKeyType="search"
          />
        </View>

        <View style={styles.filterRow}>
          {(['ALL', 'PENDENTE', 'CONCLUIDO'] as StatusFilter[]).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.filterBtn, statusFilter === s && styles.filterBtnActive]}
              onPress={() => { setStatusFilter(s); setPage(1) }}
            >
              <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>
                {s === 'ALL' ? 'Todos' : s === 'PENDENTE' ? 'Pendente' : 'Concluído'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={BRAND_GREEN} size="large" />
          </View>
        ) : (
          <FlatList
            data={data?.actionPlans ?? []}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={BRAND_GREEN} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Nenhum plano encontrado</Text>
              </View>
            }
            ListFooterComponent={
              totalPages > 1 ? (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                    onPress={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <Text style={styles.pageBtnText}>‹ Anterior</Text>
                  </TouchableOpacity>
                  <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
                  <TouchableOpacity
                    style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                    onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
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
    backgroundColor: BRAND_GREEN, paddingHorizontal: 16, paddingVertical: 14, paddingTop: 20,
    borderBottomWidth: 1, borderBottomColor: 'rgba(188,147,63,0.26)',
  },
  headerName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  headerRole: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  total: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  searchBox: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: HAIRLINE_GREEN },
  searchInput: {
    height: 40, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 12, fontSize: 14, color: '#111827', backgroundColor: '#fafafa',
  },
  filterRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: HAIRLINE_GREEN,
  },
  filterBtn: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#f9fafb',
  },
  filterBtnActive: { backgroundColor: BRAND_GREEN, borderColor: BRAND_GREEN },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: HAIRLINE_GREEN,
    shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  formNumber: { fontFamily: 'monospace', fontSize: 13, fontWeight: '700', color: BRAND_GREEN },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1 },
  badgeDone: { backgroundColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.4)' },
  badgePending: { backgroundColor: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.5)' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextDone: { color: '#059669' },
  badgeTextPending: { color: '#b45309' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  label: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  value: { fontSize: 12, color: '#374151' },
  sep: { color: '#d1d5db', fontSize: 12 },
  ncBadge: { fontSize: 11, fontWeight: '700', color: '#dc2626' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
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
