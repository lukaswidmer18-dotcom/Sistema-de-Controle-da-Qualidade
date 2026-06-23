import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { AlertHost } from '@/components/AlertHost'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

export default function RootLayout() {
  const initialize = useAuthStore(s => s.initialize)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const isLoading = useAuthStore(s => s.isLoading)
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    void initialize()
  }, [])

  useEffect(() => {
    if (isLoading) return
    // Only guard screens inside (app) — the root index.tsx already handles
    // the initial redirect declaratively. Guarding here too races it during
    // boot and can remount the login screen mid-tap, dropping focus.
    const inAppGroup = segments[0] === '(app)'
    if (!isAuthenticated && inAppGroup) {
      router.replace('/(auth)/login')
    }
  }, [isAuthenticated, isLoading, segments])

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <AlertHost />
    </QueryClientProvider>
  )
}
