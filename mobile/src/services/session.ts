import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'wira_token'
const USER_CODE_KEY = 'wira_user_code'

let secureStoreAvailable: boolean | null = null

const ensureSecureStore = async (): Promise<void> => {
  if (secureStoreAvailable === null) {
    secureStoreAvailable = await SecureStore.isAvailableAsync()
  }

  if (!secureStoreAvailable) {
    throw new Error('SecureStore indisponivel neste dispositivo')
  }
}

const setToken = async (token: string): Promise<void> => {
  await ensureSecureStore()
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

const getToken = async (): Promise<string | null> => {
  await ensureSecureStore()
  return SecureStore.getItemAsync(TOKEN_KEY)
}

const clearToken = async (): Promise<void> => {
  await ensureSecureStore()
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export const sessionService = {
  async setSession(token: string, userCode: string): Promise<void> {
    await Promise.all([
      setToken(token),
      AsyncStorage.setItem(USER_CODE_KEY, userCode)
    ])
  },

  async getToken(): Promise<string | null> {
    return getToken()
  },

  async getUserCode(): Promise<string | null> {
    return AsyncStorage.getItem(USER_CODE_KEY)
  },

  async clearSession(): Promise<void> {
    await Promise.all([
      clearToken(),
      AsyncStorage.removeItem(USER_CODE_KEY)
    ])
  }
}

export default sessionService
