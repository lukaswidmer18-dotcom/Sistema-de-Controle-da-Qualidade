import { Stack } from 'expo-router'
import { BRAND_GREEN } from '@/lib/constants'

export default function FormLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: BRAND_GREEN },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        headerBackTitle: 'Voltar',
      }}
    />
  )
}
