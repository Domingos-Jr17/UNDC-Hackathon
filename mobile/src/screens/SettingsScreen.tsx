import React, { useCallback, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import AppShell from '../components/AppShell'
import { RootStackParamList } from '../types/navigation'
import apiService from '../services/api'
import sessionService from '../services/session'
import { showAlert } from '../utils/alerts'
import { colors, shadows } from '../theme'

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp
}

interface SettingsPreferences {
  notificationsEnabled: boolean
  downloadOnWifiOnly: boolean
  reminderEnabled: boolean
}

const SETTINGS_KEY = 'wira_mobile_settings'

const defaultPreferences: SettingsPreferences = {
  notificationsEnabled: true,
  downloadOnWifiOnly: true,
  reminderEnabled: false
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [userCode, setUserCode] = useState('')
  const [preferences, setPreferences] = useState<SettingsPreferences>(defaultPreferences)
  const [storageUsageLabel, setStorageUsageLabel] = useState('A calcular...')

  const loadSettings = useCallback(async (): Promise<void> => {
    const [storedUserCode, storedPreferences, keys] = await Promise.all([
      sessionService.getUserCode(),
      AsyncStorage.getItem(SETTINGS_KEY),
      AsyncStorage.getAllKeys()
    ])

    if (!storedUserCode) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
      return
    }

    setUserCode(storedUserCode)

    if (storedPreferences) {
      try {
        const parsed = JSON.parse(storedPreferences) as SettingsPreferences
        setPreferences({ ...defaultPreferences, ...parsed })
      } catch {
        setPreferences(defaultPreferences)
      }
    } else {
      setPreferences(defaultPreferences)
    }

    const cacheKeys = keys.filter(key => key.startsWith('wira_cache:'))
    setStorageUsageLabel(cacheKeys.length === 0 ? 'Sem conteudo em cache' : `${cacheKeys.length} item(ns) em cache local`)
  }, [navigation])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const preferenceRows = useMemo(
    () => [
      {
        key: 'notificationsEnabled' as const,
        icon: 'notifications-outline' as const,
        title: 'Notificacoes locais',
        description: 'Mostra lembretes simples sobre progresso e novidades importantes.'
      },
      {
        key: 'downloadOnWifiOnly' as const,
        icon: 'wifi-outline' as const,
        title: 'Downloads so em Wi-Fi',
        description: 'Ajuda a reduzir o consumo de dados quando o modo offline for ampliado.'
      },
      {
        key: 'reminderEnabled' as const,
        icon: 'time-outline' as const,
        title: 'Lembrete semanal',
        description: 'Reserva um lembrete para retomar a aprendizagem no seu ritmo.'
      }
    ],
    []
  )

  const persistPreferences = async (next: SettingsPreferences): Promise<void> => {
    setPreferences(next)
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  }

  const togglePreference = async (key: keyof SettingsPreferences): Promise<void> => {
    const next = { ...preferences, [key]: !preferences[key] }
    await persistPreferences(next)
  }

  const clearCache = async (): Promise<void> => {
    const keys = await AsyncStorage.getAllKeys()
    const cacheKeys = keys.filter(key => key.startsWith('wira_cache:'))

    if (cacheKeys.length === 0) {
      showAlert('Cache limpo', 'Nao existem ficheiros temporarios guardados neste dispositivo.')
      return
    }

    await AsyncStorage.multiRemove(cacheKeys)
    setStorageUsageLabel('Sem conteudo em cache')
    showAlert('Cache limpo', 'Os dados temporarios foram removidos deste dispositivo.')
  }

  const handleLogout = async (): Promise<void> => {
    try {
      await apiService.logout()
    } catch {
      await sessionService.clearSession()
    }

    navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
  }

  return (
    <AppShell
      navigation={navigation}
      activeRoute="Home"
      title="Configuracoes"
      subtitle="Ajuste preferencias locais, limpe o armazenamento temporario e gira a sua sessao."
      showBottomNav={false}
      showLogout={false}
      showSettings={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={18} color={colors.primaryDark} />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.sessionCard}>
        <Text style={styles.sectionEyebrow}>Sessao activa</Text>
        <Text style={styles.sessionCode}>{userCode || 'A carregar...'}</Text>
        <Text style={styles.sessionMeta}>{storageUsageLabel}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Preferencias do dispositivo</Text>
        {preferenceRows.map(item => {
          const enabled = preferences[item.key]
          return (
            <TouchableOpacity key={item.key} style={styles.preferenceRow} onPress={() => void togglePreference(item.key)}>
              <View style={styles.preferenceIconWrap}>
                <Ionicons name={item.icon} size={18} color={colors.primary} />
              </View>
              <View style={styles.preferenceCopy}>
                <Text style={styles.preferenceTitle}>{item.title}</Text>
                <Text style={styles.preferenceDescription}>{item.description}</Text>
              </View>
              <View style={[styles.preferenceState, enabled ? styles.preferenceStateOn : styles.preferenceStateOff]}>
                <Text style={[styles.preferenceStateText, enabled ? styles.preferenceStateTextOn : styles.preferenceStateTextOff]}>
                  {enabled ? 'Activo' : 'Desactivo'}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Ferramentas rapidas</Text>
        <TouchableOpacity style={styles.utilityRow} onPress={() => void clearCache()}>
          <View>
            <Text style={styles.utilityTitle}>Limpar cache local</Text>
            <Text style={styles.utilityDescription}>Remove dados temporarios usados nas consultas e no consumo de conteudo.</Text>
          </View>
          <Ionicons name="trash-outline" size={18} color={colors.primaryDark} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.utilityRow} onPress={() => navigation.navigate('Support')}>
          <View>
            <Text style={styles.utilityTitle}>Falar com apoio</Text>
            <Text style={styles.utilityDescription}>Abra a area de apoio para pedir ajuda sobre acesso, percurso ou proximos passos.</Text>
          </View>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primaryDark} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={() => void handleLogout()}>
        <Ionicons name="log-out-outline" size={18} color={colors.textOnPrimary} />
        <Text style={styles.logoutButtonText}>Terminar sessao</Text>
      </TouchableOpacity>
    </AppShell>
  )
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  backButtonText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '700'
  },
  sessionCard: {
    borderRadius: 28,
    backgroundColor: colors.primary,
    padding: 22,
    gap: 8,
    ...shadows.card
  },
  sectionEyebrow: {
    color: '#D7E8F8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  sessionCode: {
    color: colors.textOnPrimary,
    fontSize: 28,
    fontWeight: '800'
  },
  sessionMeta: {
    color: '#D7E8F8',
    fontSize: 14,
    lineHeight: 20
  },
  sectionCard: {
    borderRadius: 28,
    backgroundColor: colors.surface,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800'
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    padding: 14
  },
  preferenceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  preferenceCopy: {
    flex: 1,
    gap: 3
  },
  preferenceTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800'
  },
  preferenceDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18
  },
  preferenceState: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  preferenceStateOn: {
    backgroundColor: colors.successSoft
  },
  preferenceStateOff: {
    backgroundColor: colors.border
  },
  preferenceStateText: {
    fontSize: 12,
    fontWeight: '800'
  },
  preferenceStateTextOn: {
    color: colors.success
  },
  preferenceStateTextOff: {
    color: colors.textMuted
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    padding: 16
  },
  utilityTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800'
  },
  utilityDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    maxWidth: 250
  },
  logoutButton: {
    borderRadius: 20,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  logoutButtonText: {
    color: colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '800'
  }
})
