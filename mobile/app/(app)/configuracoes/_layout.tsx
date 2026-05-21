import { Stack } from 'expo-router'
import { BRAND_GREEN } from '@/lib/constants'

export default function ConfiguracoesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: BRAND_GREEN },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '800', fontSize: 17 },
        headerBackTitle: 'Voltar',
      }}
    />
  )
}
