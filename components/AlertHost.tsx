import { Modal, View, Text, Pressable, StyleSheet } from 'react-native'
import { useAlertStore, AlertButton } from '@/store/alertStore'
import { BRAND_GREEN, HAIRLINE_GREEN } from '@/lib/constants'

export function AlertHost() {
  const { visible, title, message, buttons, hide } = useAlertStore()

  const handlePress = (button: AlertButton) => {
    hide()
    button.onPress?.()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={hide}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.buttonRow}>
            {buttons.map((button, i) => (
              <Pressable
                key={i}
                onPress={() => handlePress(button)}
                hitSlop={0}
                android_ripple={null}
                style={[styles.button, i > 0 && styles.buttonBorder]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'destructive' && styles.buttonTextDestructive,
                    button.style === 'cancel' && styles.buttonTextCancel,
                  ]}
                >
                  {button.text || 'OK'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingTop: 20,
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: HAIRLINE_GREEN,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBorder: {
    borderLeftWidth: 1,
    borderLeftColor: HAIRLINE_GREEN,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND_GREEN,
  },
  buttonTextDestructive: {
    color: '#dc2626',
  },
  buttonTextCancel: {
    color: '#6b7280',
    fontWeight: '500',
  },
})
