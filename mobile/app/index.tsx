import { Redirect } from 'expo-router'
import { useAuthStore } from '@/store/authStore'
import { MobileLoadingScreen } from '@/components/MobileLoadingScreen'

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return <MobileLoadingScreen title="Preparando ambiente" subtitle="Carregando sessao e preferencias..." progress={58} />
  }

  return <Redirect href={isAuthenticated ? '/(app)/novo-formulario' : '/(auth)/login'} />
}
