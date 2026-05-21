import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import { API_BASE_URL } from '@/lib/api'
import { BRAND_GREEN, BRAND_GOLD } from '@/lib/constants'
import { AuthUser } from '@/lib/types'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null)
  const setSession = useAuthStore(s => s.setSession)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Preencha email e senha')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await axios.post<{ token: string; user: AuthUser }>(
        `${API_BASE_URL}/api/auth/mobile-login`,
        { email: email.trim().toLowerCase(), password }
      )
      await setSession(res.data.user, res.data.token)
      router.replace('/(app)/novo-formulario')
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ?? 'Erro ao conectar ao servidor'
        : err instanceof Error
          ? err.message
          : String(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Text style={styles.iconText}>✓</Text>
            </View>
            <Text style={styles.title}>Controle da</Text>
            <Text style={styles.titleGold}>Qualidade</Text>
            <Text style={styles.subtitle}>Bello Alimentos</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Entrar no sistema</Text>

            {/* Error banner */}
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                value={email}
                onChangeText={v => { setEmail(v); setError(null) }}
                placeholder="seu@email.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={[styles.input, focusedField === 'password' && styles.inputFocused]}
                value={password}
                onChangeText={v => { setPassword(v); setError(null) }}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                autoComplete="password"
                editable={!loading}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.82}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <View style={styles.trustRow}>
              <Text style={styles.trustText}>🔒  Conexão segura · SSL</Text>
            </View>
          </View>

          <Text style={styles.version}>v1.0.0</Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    backgroundColor: BRAND_GREEN,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: BRAND_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: BRAND_GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  iconText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  titleGold: {
    color: BRAND_GOLD,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND_GREEN,
    marginBottom: 20,
    letterSpacing: 0.2,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fafafa',
  },
  inputFocused: {
    borderColor: BRAND_GREEN,
    backgroundColor: '#fff',
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  button: {
    height: 54,
    backgroundColor: BRAND_GREEN,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  trustRow: {
    alignItems: 'center',
    marginTop: 14,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(22,65,58,0.35)',
    letterSpacing: 0.5,
  },
  version: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 28,
  },
})
