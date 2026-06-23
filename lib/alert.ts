import { useAlertStore, AlertButton } from '@/store/alertStore'

// Drop-in replacement for React Native's Alert.alert — same signature, but
// also works on web (RN Web has no Alert implementation at all).
export function alert(title: string, message?: string, buttons?: AlertButton[]): void {
  useAlertStore.getState().show(title, message, buttons)
}
