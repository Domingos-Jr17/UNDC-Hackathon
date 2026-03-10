import { Alert, Platform } from 'react-native'

type AlertButton = {
  text: string
  onPress?: () => void
  style?: 'default' | 'cancel' | 'destructive'
}

export const showAlert = (title: string, message?: string, buttons?: AlertButton[]): void => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const safeMessage = message ? `\n\n${message}` : ''
    if (!buttons || buttons.length === 0) {
      window.alert(`${title}${safeMessage}`)
      return
    }

    if (buttons.length === 1) {
      window.alert(`${title}${safeMessage}`)
      buttons[0].onPress?.()
      return
    }

    const confirmed = window.confirm(`${title}${safeMessage}`)
    const primary = buttons[0]
    const secondary = buttons[1]
    if (confirmed) {
      primary.onPress?.()
    } else {
      secondary?.onPress?.()
    }
    return
  }

  Alert.alert(title, message, buttons)
}
