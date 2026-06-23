import { Tabs } from 'expo-router'
import { useAuthStore } from '@/store/authStore'
import { View, ActivityIndicator } from 'react-native'
import { BRAND_GREEN, HAIRLINE_GREEN } from '@/lib/constants'

export default function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'

  if (isLoading || !isAuthenticated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BRAND_GREEN }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    )
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND_GREEN,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: HAIRLINE_GREEN,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="novo-formulario"
        options={{
          title: 'Novo Form.',
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 28, height: 28, borderRadius: 8,
              backgroundColor: focused ? BRAND_GREEN : '#f3f4f6',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <View style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: focused ? '#fff' : '#9ca3af' }} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="pdfs-salvos"
        options={{
          title: 'PDFs Salvos',
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 28, height: 28, borderRadius: 8,
              backgroundColor: focused ? BRAND_GREEN : '#f3f4f6',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <View style={{ width: 10, height: 13, borderRadius: 1, backgroundColor: focused ? '#fff' : '#9ca3af' }} />
            </View>
          ),
        }}
      />
      {/* Detail route — navigable via router.push, hidden from the tab bar (web shows file-based routes as extra tabs by default) */}
      <Tabs.Screen name="pdfs-salvos/[id]" options={{ href: null }} />
      <Tabs.Screen
        name="planos-de-acao"
        options={{
          title: 'Planos',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 28, height: 28, borderRadius: 8,
              backgroundColor: focused ? BRAND_GREEN : '#f3f4f6',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <View style={{ width: 14, height: 2, borderRadius: 1, backgroundColor: focused ? '#fff' : '#9ca3af', marginBottom: 2 }} />
              <View style={{ width: 14, height: 2, borderRadius: 1, backgroundColor: focused ? '#fff' : '#9ca3af', marginBottom: 2 }} />
              <View style={{ width: 10, height: 2, borderRadius: 1, backgroundColor: focused ? '#fff' : '#9ca3af' }} />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="planos-de-acao/[id]" options={{ href: null }} />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: 'Config.',
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 28, height: 28, borderRadius: 8,
              backgroundColor: focused ? BRAND_GREEN : '#f3f4f6',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: focused ? '#fff' : '#9ca3af', backgroundColor: 'transparent' }} />
            </View>
          ),
        }}
      />
    </Tabs>
  )
}
