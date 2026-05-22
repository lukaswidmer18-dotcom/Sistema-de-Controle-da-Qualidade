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

export function MobileLoadingScreen({
  title = 'Validando acesso',
  subtitle = 'Preparando ambiente seguro',
  progress = 72,
  steps,
}: Props) {
  const pulse = useRef(new Animated.Value(0)).current
  const sweep = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    )
    const sweepLoop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    )

    pulseLoop.start()
    sweepLoop.start()

    return () => {
      pulseLoop.stop()
      sweepLoop.stop()
    }
  }, [pulse, sweep])

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  })
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  })
  const sweepX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 260],
  })
  const status = steps?.find(step => step.state === 'active')?.label ?? subtitle

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topRule} />
      <View style={styles.center}>
        <View style={styles.brandBlock}>
          <Text style={styles.brandSmall}>GRUPO</Text>
          <Text style={styles.brandLarge}>PLUMA</Text>
        </View>

        <Animated.View style={[styles.mark, { opacity, transform: [{ scale }] }]}>
          <View style={styles.markInner}>
            <Text style={styles.markIcon}>✓</Text>
          </View>
        </Animated.View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(12, Math.min(progress, 100))}%` }]}>
              <Animated.View style={[styles.sweep, { transform: [{ translateX: sweepX }] }]} />
            </View>
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.statusText} numberOfLines={1}>{status}</Text>
            <Text style={styles.percent}>{Math.round(progress)}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>CONTROLE DA QUALIDADE</Text>
        <View style={styles.footerDot} />
        <Text style={styles.footerText}>AMBIENTE SEGURO</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BRAND_GREEN,
    paddingHorizontal: 28,
  },
  topRule: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: BRAND_GOLD,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 34,
  },
  brandSmall: {
    color: 'rgba(248,245,235,0.56)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 5,
  },
  brandLarge: {
    color: BRAND_GOLD,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1.2,
    lineHeight: 38,
  },
  mark: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(188,147,63,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  markInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BRAND_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markIcon: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 31,
  },
  subtitle: {
    color: 'rgba(248,245,235,0.66)',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 34,
  },
  progressWrap: {
    width: '100%',
    maxWidth: 300,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(248,245,235,0.16)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: BRAND_GOLD,
    overflow: 'hidden',
  },
  sweep: {
    width: 74,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.34)',
  },
  progressMeta: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    flex: 1,
    color: 'rgba(248,245,235,0.58)',
    fontSize: 12,
    fontWeight: '800',
  },
  percent: {
    color: 'rgba(248,245,235,0.78)',
    fontSize: 12,
    fontWeight: '900',
  },
  footer: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  footerText: {
    color: 'rgba(248,245,235,0.42)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(188,147,63,0.72)',
  },
})
