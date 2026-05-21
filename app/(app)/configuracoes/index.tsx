import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { router, Stack } from 'expo-router'
import { useAuthStore } from '@/store/authStore'
import { BRAND_GREEN, BRAND_GOLD } from '@/lib/constants'

interface MenuItem {
  label: string
  description: string
  route: string
  adminOnly?: boolean
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Listas de E-mail', description: 'Gerenciar grupos de destinatários', route: '/configuracoes/listas' },
  { label: 'Opções das Listas', description: 'Valores de listas de seleção', route: '/configuracoes/opcoes' },
  { label: 'Modelos de E-mail', description: 'Templates para envio automático', route: '/configuracoes/modelos' },
  { label: 'Usuários', description: 'Gerenciar contas de acesso', route: '/configuracoes/usuarios', adminOnly: true },
]

export default function ConfiguracoesIndex() {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const isAdmin = user?.role === 'ADMIN'

  const handleLogout = async () => {
    await logout()
    router.replace('/(auth)/login')
  }

  const visibleItems = MENU_ITEMS.filter(item => !item.adminOnly || isAdmin)

  return (
    <>
      <Stack.Screen options={{ title: 'Configurações', headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userRole}>{isAdmin ? 'Administrador' : 'Qualidade'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>CONFIGURAÇÕES DO SISTEMA</Text>

        <View style={styles.menuCard}>
          {visibleItems.map((item, index) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.menuItem, index < visibleItems.length - 1 && styles.menuItemBorder]}
              onPress={() => router.push(item.route as `/${string}`)}
              activeOpacity={0.65}
            >
              <View style={styles.menuItemContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDesc}>{item.description}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
          <Text style={styles.logoutText}>Sair do sistema</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#f0f0f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: BRAND_GREEN, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: BRAND_GOLD, fontWeight: '800', fontSize: 20 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  userRole: { fontSize: 12, color: BRAND_GREEN, fontWeight: '600', marginTop: 1 },
  userEmail: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#9ca3af',
    letterSpacing: 1, marginBottom: 8, marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#f0f0f0', overflow: 'hidden', marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuItemContent: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  menuDesc: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  chevron: { fontSize: 20, color: '#d1d5db', fontWeight: '300' },
  logoutBtn: {
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2',
  },
  logoutText: { color: '#dc2626', fontSize: 14, fontWeight: '700' },
})
