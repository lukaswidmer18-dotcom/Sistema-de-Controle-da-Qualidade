import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BRAND_GOLD, BRAND_GREEN } from '@/lib/constants'

interface LoadingStep {
  label: string
  state?: 'done' | 'active' | 'pending'
}

interface Props {
  title?: string
  subtitle?: string
  progress?: number
  steps?: LoadingStep[]
}

const DEFAULT_STEPS: LoadingStep[] = [
  { label: 'Verificando credenciais', state: 'done' },
  { label: 'Validando parametros de Qualidade', state: 'active' },
  { label: 'Preparando ambiente seguro', state: 'pending' },
]

export function MobileLoadingScreen({
  title = 'Validando acesso',
  subtitle = 'Sincronizando ambiente seguro...',
  progress = 72,
  steps = DEFAULT_STEPS,
}: Props) {
  const pulse = useRef(new Animated.Value(0)).current
  const shimmer = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    )
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    )

    pulseLoop.start()
    shimmerLoop.start()

    return () => {
      pulseLoop.stop()
      shimmerLoop.stop()
    }
  }, [pulse, shimmer])

  const badgeScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  })
  const badgeOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  })
  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 240],
  })

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.backdropTop} />
      <View style={styles.backdropBand} />

      <View style={styles.card}>
        <View style={styles.header}>
          <Animated.View style={[styles.badge, { opacity: badgeOpacity, transform: [{ scale: badgeScale }] }]}>
            <Text style={styles.badgeIcon}>✓</Text>
          </Animated.View>

          <View style={styles.heading}>
            <Text style={styles.brand}>GRUPO PLUMA</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>PROGRESSO</Text>
          <Text style={styles.progressValue}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(8, Math.min(progress, 100))}%` }]}>
            <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] }]} />
          </View>
        </View>

        <View style={styles.steps}>
          {steps.map((step, index) => {
            const state = step.state ?? 'pending'
            return (
              <View key={`${step.label}-${index}`} style={[styles.step, state === 'active' && styles.stepActive]}>
                <View style={[styles.stepDot, styles[`stepDot_${state}`]]}>
                  <Text style={[styles.stepDotText, state === 'pending' && styles.stepDotTextPending]}>
                    {state === 'done' ? '✓' : state === 'active' ? '•' : ''}
                  </Text>
                </View>
                <Text style={[styles.stepText, state === 'pending' && styles.stepTextPending]} numberOfLines={1}>
                  {step.label}...
                </Text>
              </View>
            )
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>AMBIENTE SEGURO</Text>
          <Text style={styles.footerText}>v1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0d332d',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backdropTop: {
    position: 'absolute',
    top: -80,
    left: -40,
    right: -40,
    height: 220,
    backgroundColor: 'rgba(188,147,63,0.08)',
    transform: [{ rotate: '-8deg' }],
  },
  backdropBand: {
    position: 'absolute',
    left: -80,
    right: -80,
    bottom: 90,
    height: 170,
    backgroundColor: 'rgba(255,255,255,0.035)',
    transform: [{ rotate: '10deg' }],
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(248,245,235,0.18)',
    backgroundColor: 'rgba(22,65,58,0.92)',
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 28,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
  },
  badge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: BRAND_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
  },
  badgeIcon: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
  },
  heading: {
    flex: 1,
  },
  brand: {
    color: BRAND_GOLD,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.6,
    marginBottom: 3,
  },
  title: {
    color: '#fff',
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 31,
  },
  subtitle: {
    color: 'rgba(248,245,235,0.68)',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 7,
    lineHeight: 18,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },
  progressLabel: {
    color: 'rgba(248,245,235,0.52)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.2,
  },
  progressValue: {
    color: 'rgba(248,245,235,0.72)',
    fontSize: 12,
    fontWeight: '900',
  },
  progressTrack: {
    height: 9,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: 'rgba(248,245,235,0.12)',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#e1bd65',
    overflow: 'hidden',
  },
  shimmer: {
    width: 84,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  steps: {
    gap: 10,
  },
  step: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248,245,235,0.12)',
    backgroundColor: 'rgba(248,245,235,0.055)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 12,
  },
  stepActive: {
    borderColor: 'rgba(188,147,63,0.62)',
    backgroundColor: 'rgba(188,147,63,0.14)',
  },
  stepDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepDot_done: {
    backgroundColor: BRAND_GOLD,
    borderColor: 'rgba(255,255,255,0.34)',
  },
  stepDot_active: {
    backgroundColor: 'rgba(188,147,63,0.22)',
    borderColor: BRAND_GOLD,
  },
  stepDot_pending: {
    backgroundColor: 'rgba(248,245,235,0.08)',
    borderColor: 'rgba(248,245,235,0.14)',
  },
  stepDotText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 21,
  },
  stepDotTextPending: {
    color: 'rgba(248,245,235,0.35)',
  },
  stepText: {
    flex: 1,
    color: 'rgba(248,245,235,0.84)',
    fontSize: 14,
    fontWeight: '800',
  },
  stepTextPending: {
    color: 'rgba(248,245,235,0.43)',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(248,245,235,0.1)',
    marginTop: 26,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    color: 'rgba(248,245,235,0.42)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
})
