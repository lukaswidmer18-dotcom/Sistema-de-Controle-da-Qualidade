import { useState, useRef } from 'react'
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
import { Feather } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'
import { API_BASE_URL } from '@/lib/api'
import { BRAND_GREEN, BRAND_GOLD } from '@/lib/constants'
import { AuthUser } from '@/lib/types'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null)
  const passwordRef = useRef<TextInput>(null)
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
      <View style={styles.background}>
        {/* Decorative blobs */}
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Feather name="check" size={32} color="#fff" />
            </View>
            <View style={styles.brandRow}>
              <Text style={styles.brandLabel}>GRUPO</Text>
              <Text style={styles.brandName}>PLUMA</Text>
            </View>
            <Text style={styles.title}>Controle da{'\n'}
              <Text style={styles.titleGold}>Qualidade</Text>
            </Text>
            <Text style={styles.subtitle}>Bello Alimentos · Recebimento</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bem-vindo de volta</Text>
            <Text style={styles.cardSubtitle}>Informe suas credenciais para continuar</Text>

            {/* Error banner */}
            {error && (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={14} color="#dc2626" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'email' && styles.inputWrapperFocused,
              ]}>
                <Feather
                  name="mail"
                  size={16}
                  color={focusedField === 'email' ? BRAND_GREEN : '#9ca3af'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={v => { setEmail(v); setError(null) }}
                  placeholder="seu@email.com"
                  placeholderTextColor="#c4c9d4"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  editable={!loading}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'password' && styles.inputWrapperFocused,
              ]}>
                <Feather
                  name="lock"
                  size={16}
                  color={focusedField === 'password' ? BRAND_GREEN : '#9ca3af'}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={v => { setPassword(v); setError(null) }}
                  placeholder="••••••••"
                  placeholderTextColor="#c4c9d4"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  editable={!loading}
                  onSubmitEditing={handleLogin}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(p => !p)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.eyeButton}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={focusedField === 'password' ? BRAND_GREEN : '#9ca3af'}
                  />
                </TouchableOpacity>
              </View>
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
                <>
                  <Text style={styles.buttonText}>Entrar</Text>
                  <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.trustRow}>
              <Feather name="lock" size={11} color="rgba(22,65,58,0.35)" />
              <Text style={styles.trustText}>  Conexão segura · SSL · Bello Alimentos</Text>
            </View>
          </View>

          <Text style={styles.version}>v1.0.0 · © 2026 Bello Alimentos LTDA</Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: BRAND_GREEN,
  },
  blob1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(188,147,63,0.10)',
  },
  blob2: {
    position: 'absolute',
    bottom: 60,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: BRAND_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: BRAND_GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  brandRow: {
    alignItems: 'center',
    marginBottom: 10,
  },
  brandLabel: {
    color: 'rgba(188,147,63,0.65)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 5,
  },
  brandName: {
    color: BRAND_GOLD,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: 1,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 36,
  },
  titleGold: {
    color: BRAND_GOLD,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 12,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 40,
    elevation: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND_GREEN,
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
    marginBottom: 22,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 7,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 14,
  },
  inputWrapperFocused: {
    borderColor: BRAND_GREEN,
    backgroundColor: '#fff',
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  eyeButton: {
    paddingLeft: 10,
  },
  button: {
    height: 56,
    backgroundColor: BRAND_GREEN,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.55,
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
    marginTop: 18,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(22,65,58,0.35)',
    letterSpacing: 0.4,
  },
  version: {
    color: 'rgba(255,255,255,0.22)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 28,
    letterSpacing: 0.3,
  },
})
