import { useState, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
    // adjustPan (app.json) handles Android keyboard — no ScrollView to conflict with the pan.
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.background}>
        <View style={styles.blob1} pointerEvents="none" />
        <View style={styles.blob2} pointerEvents="none" />

        <View style={styles.scroll}>
          {/* Header — compact to avoid overflow on small screens */}
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Feather name="check" size={28} color="#fff" />
            </View>
            <Text style={styles.brandLabel}>GRUPO  <Text style={styles.brandName}>PLUMA</Text></Text>
            <Text style={styles.title}>Controle da <Text style={styles.titleGold}>Qualidade</Text></Text>
            <Text style={styles.subtitle}>Bello Alimentos · Recebimento</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bem-vindo de volta</Text>
            <Text style={styles.cardSubtitle}>Informe suas credenciais para continuar</Text>

            {error && (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={13} color="#dc2626" style={{ marginRight: 7 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputWrapperFocused]}>
                <Feather
                  name="mail"
                  size={15}
                  color={focusedField === 'email' ? BRAND_GREEN : '#b0b7c3'}
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
                  autoCorrect={false}
                  autoComplete="off"
                  importantForAutofill="no"
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
              <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputWrapperFocused]}>
                <Feather
                  name="lock"
                  size={15}
                  color={focusedField === 'password' ? BRAND_GREEN : '#b0b7c3'}
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
                  autoComplete="off"
                  importantForAutofill="no"
                  returnKeyType="done"
                  editable={!loading}
                  onSubmitEditing={handleLogin}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <Pressable
                  onPress={() => setShowPassword(p => !p)}
                  style={styles.eyeButton}
                  hitSlop={0}
                  android_ripple={null}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={focusedField === 'password' ? BRAND_GREEN : '#b0b7c3'}
                  />
                </Pressable>
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
                  <Feather name="arrow-right" size={17} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.trustRow}>
              <Feather name="lock" size={10} color="rgba(22,65,58,0.32)" />
              <Text style={styles.trustText}>  Conexão segura · SSL · Bello Alimentos</Text>
            </View>
          </View>

          <Text style={styles.version}>v1.0.0 · © 2026 Bello Alimentos LTDA</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  background: { flex: 1, backgroundColor: BRAND_GREEN },
  blob1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(188,147,63,0.09)',
  },
  blob2: {
    position: 'absolute',
    bottom: 40,
    left: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  scroll: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 17,
    backgroundColor: BRAND_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: BRAND_GOLD,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.42,
    shadowRadius: 14,
    elevation: 10,
  },
  brandLabel: {
    color: 'rgba(188,147,63,0.60)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 6,
  },
  brandName: {
    color: BRAND_GOLD,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 3,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  titleGold: {
    color: BRAND_GOLD,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 12,
    marginTop: 6,
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.20,
    shadowRadius: 32,
    elevation: 14,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND_GREEN,
    letterSpacing: 0.1,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 3,
    marginBottom: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 14,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: { marginBottom: 14 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 13,
  },
  inputWrapperFocused: {
    borderColor: BRAND_GREEN,
    backgroundColor: '#fff',
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIcon: { marginRight: 9 },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  eyeButton: { paddingLeft: 10 },
  button: {
    height: 52,
    backgroundColor: BRAND_GREEN,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 7,
  },
  buttonDisabled: { opacity: 0.55 },
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
    marginTop: 16,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(22,65,58,0.32)',
    letterSpacing: 0.3,
  },
  version: {
    color: 'rgba(255,255,255,0.20)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    letterSpacing: 0.3,
  },
})
