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
import { BRAND_GREEN, BRAND_GOLD, HAIRLINE_GOLD, HAIRLINE_GREEN } from '@/lib/constants'
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
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View>
            <View style={styles.brandHeader}>
              <View style={styles.plumaWordmark}>
                <Text style={styles.plumaGrupo}>Grupo</Text>
                <Text style={styles.plumaNome}>Pluma</Text>
              </View>
            </View>

            <View style={styles.header}>
              <Text style={styles.eyebrow}>Sistema de Controle</Text>
              <Text style={styles.title}>Qualidade</Text>
              <Text style={styles.subtitle}>
                Recebimento, evidências e rastreabilidade em ambiente seguro.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <Text style={styles.cardTitle}>Entrar no sistema</Text>
            <Text style={styles.cardSubtitle}>Use suas credenciais corporativas</Text>

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
                placeholder="********"
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
              accessibilityRole="button"
              accessibilityLabel="Entrar no sistema"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <View style={styles.trustRow}>
              <View style={styles.trustDot} />
              <Text style={styles.trustText}>Conexão segura - SSL</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2026 Bello Alimentos LTDA · Desenvolvido por Lukas Widmer
            </Text>
            <Text style={styles.version}>v1.0.0</Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: BRAND_GREEN,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 30,
  },
  brandHeader: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 26,
  },
  plumaWordmark: {
    alignItems: 'center',
  },
  plumaGrupo: {
    color: 'rgba(188,147,63,0.72)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 4.5,
    textTransform: 'uppercase',
  },
  plumaNome: {
    color: BRAND_GOLD,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1.2,
    lineHeight: 36,
    textTransform: 'uppercase',
  },
  header: {
    alignItems: 'center',
    marginBottom: 22,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.2,
    lineHeight: 36,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 270,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: HAIRLINE_GOLD,
    overflow: 'hidden',
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 12,
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 4,
    backgroundColor: BRAND_GOLD,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND_GREEN,
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 20,
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
    borderColor: HAIRLINE_GREEN,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 14,
  },
  trustDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND_GOLD,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(22,65,58,0.35)',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 8,
  },
  footerText: {
    color: 'rgba(248,245,235,0.64)',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
  },
  version: {
    color: 'rgba(248,245,235,0.34)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },
})
