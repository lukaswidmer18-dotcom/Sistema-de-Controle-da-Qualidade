import { Tabs } from 'expo-router'
import { useAuthStore } from '@/store/authStore'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BRAND_GREEN, HAIRLINE_GREEN } from '@/lib/constants'
import { MobileLoadingScreen } from '@/components/MobileLoadingScreen'

export default function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'
  const insets = useSafeAreaInsets()

  if (isLoading || !isAuthenticated) {
    return <MobileLoadingScreen title="Abrindo sistema" subtitle="Validando sessao corporativa..." progress={76} />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND_GREEN,
        tabBarInactiveTintColor: '#647067',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: HAIRLINE_GREEN,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          height: 66 + Math.max(insets.bottom, 10),
          shadowColor: '#0f2f2a',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 14,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
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
