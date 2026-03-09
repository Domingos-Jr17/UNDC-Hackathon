import AsyncStorage from '@react-native-async-storage/async-storage'

type SecureStoreLike = {
  getItemAsync: (key: string) => Promise<string | null>
  setItemAsync: (key: string, value: string) => Promise<void>
  deleteItemAsync: (key: string) => Promise<void>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isSecureStoreLike = (value: unknown): value is SecureStoreLike => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.getItemAsync === 'function' &&
    typeof value.setItemAsync === 'function' &&
    typeof value.deleteItemAsync === 'function'
  )
}

let secureStore: SecureStoreLike | null = null

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const loaded: unknown = require('expo-secure-store')
  if (isSecureStoreLike(loaded)) {
    secureStore = loaded
  }
} catch {
  secureStore = null
}

const TOKEN_KEY = 'wira_token'
const USER_CODE_KEY = 'wira_user_code'

const setItem = async (key: string, value: string): Promise<void> => {
  if (secureStore) {
    await secureStore.setItemAsync(key, value)
    return
  }
  await AsyncStorage.setItem(key, value)
}

const getItem = async (key: string): Promise<string | null> => {
  if (secureStore) {
    return secureStore.getItemAsync(key)
  }
  return AsyncStorage.getItem(key)
}

const removeItem = async (key: string): Promise<void> => {
  if (secureStore) {
    await secureStore.deleteItemAsync(key)
    return
  }
  await AsyncStorage.removeItem(key)
}

export const sessionService = {
  async setSession(token: string, userCode: string): Promise<void> {
    await Promise.all([
      setItem(TOKEN_KEY, token),
      setItem(USER_CODE_KEY, userCode)
    ])
  },

  async getToken(): Promise<string | null> {
    return getItem(TOKEN_KEY)
  },

  async getUserCode(): Promise<string | null> {
    return getItem(USER_CODE_KEY)
  },

  async clearSession(): Promise<void> {
    await Promise.all([
      removeItem(TOKEN_KEY),
      removeItem(USER_CODE_KEY)
    ])
  }
}

export default sessionService
