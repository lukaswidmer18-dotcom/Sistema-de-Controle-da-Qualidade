import { Redirect } from 'expo-router'
import { useAuthStore } from '@/store/authStore'
import { View, ActivityIndicator } from 'react-native'
import { BRAND_GREEN } from '@/lib/constants'

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BRAND_GREEN }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    )
  }

  return <Redirect href={isAuthenticated ? '/(app)/novo-formulario' : '/(auth)/login'} />
}
