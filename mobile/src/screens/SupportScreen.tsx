import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import AppShell from '../components/AppShell'
import { RootStackParamList } from '../types/navigation'
import sessionService from '../services/session'
import { showAlert } from '../utils/alerts'
import { colors, shadows } from '../theme'

type SupportScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Support'>

interface SupportScreenProps {
  navigation: SupportScreenNavigationProp
}

const SUPPORT_PHONE = process.env.EXPO_PUBLIC_SUPPORT_PHONE ?? '+258840000000'
const SUPPORT_MESSAGE = process.env.EXPO_PUBLIC_SUPPORT_MESSAGE ?? 'Ola, preciso de apoio para obter um codigo de acesso para a plataforma WIRA.'

const normalizePhone = (value: string): string => value.replace(/\D/g, '')

export default function SupportScreen({ navigation }: SupportScreenProps) {
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const load = async (): Promise<void> => {
      const userCode = await sessionService.getUserCode()
      setHasSession(!!userCode)
      setCheckingSession(false)
    }
    void load()
  }, [])

  const phoneDigits = useMemo(() => normalizePhone(SUPPORT_PHONE), [])
  const whatsappUrl = phoneDigits ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(SUPPORT_MESSAGE)}` : ''
  const callUrl = phoneDigits ? `tel:${phoneDigits}` : ''

  const handleOpen = async (url: string): Promise<void> => {
    if (!url) {
      showAlert('Contacto indisponivel', 'Neste momento nao existe um contacto configurado.')
      return
    }
    try {
      await Linking.openURL(url)
    } catch (error) {
      showAlert('Erro', (error as Error).message)
    }
  }

  if (checkingSession) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const content = (
    <SupportCards
      supportPhone={SUPPORT_PHONE}
      onWhatsApp={() => void handleOpen(whatsappUrl)}
      onCall={() => void handleOpen(callUrl)}
    />
  )

  if (hasSession) {
    return (
      <AppShell
        navigation={navigation}
        activeRoute="Support"
        title="Apoio e contacto"
        subtitle="Peça ajuda sempre que precisar de orientacao, acesso ou esclarecimentos."
      >
        {content}
      </AppShell>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView style={styles.preloginContainer} contentContainerStyle={styles.preloginContent}>
        <TouchableOpacity style={styles.preloginBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={colors.primaryDark} />
          <Text style={styles.preloginBackText}>Voltar</Text>
        </TouchableOpacity>
        <View style={styles.preloginHeader}>
          <Text style={styles.preloginEyebrow}>Preciso de um codigo</Text>
          <Text style={styles.preloginTitle}>Nao esta sozinha. A equipa parceira pode ajudar a ativar o seu acesso.</Text>
          <Text style={styles.preloginSubtitle}>
            Use um dos contactos abaixo para pedir apoio em seguranca e esclarecer qualquer duvida antes de entrar.
          </Text>
        </View>
        {content}
      </ScrollView>
    </SafeAreaView>
  )
}

function SupportCards({
  supportPhone,
  onWhatsApp,
  onCall
}: {
  supportPhone: string
  onWhatsApp: () => void
  onCall: () => void
}) {
  return (
    <View style={styles.cardsWrap}>
      <View style={styles.card}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="logo-whatsapp" size={20} color={colors.primary} />
        </View>
        <Text style={styles.cardTitle}>Mensagem com apoio</Text>
        <Text style={styles.cardText}>Envie uma mensagem e explique se precisa de codigo, orientacao ou ajuda para continuar.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onWhatsApp}>
          <Text style={styles.primaryButtonText}>Abrir WhatsApp</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="call-outline" size={20} color={colors.primary} />
        </View>
        <Text style={styles.cardTitle}>Ligacao direta</Text>
        <Text style={styles.cardText}>Se preferir falar com alguem de imediato, ligue para a equipa parceira.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={onCall}>
          <Text style={styles.secondaryButtonText}>Ligar agora</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Contacto de apoio</Text>
        <Text style={styles.infoValue}>{supportPhone}</Text>
        <Text style={styles.infoHint}>Guarde este contacto se achar util para pedir apoio novamente.</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  preloginContainer: {
    flex: 1,
    backgroundColor: colors.background
  },
  preloginContent: {
    padding: 20,
    gap: 18
  },
  preloginBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10
  },
  preloginBackText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '700'
  },
  preloginHeader: {
    borderRadius: 28,
    backgroundColor: colors.primary,
    padding: 22,
    gap: 10,
    ...shadows.card
  },
  preloginEyebrow: {
    color: '#CDE4F6',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  preloginTitle: {
    color: colors.textOnPrimary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34
  },
  preloginSubtitle: {
    color: '#DAECFA',
    fontSize: 15,
    lineHeight: 22
  },
  cardsWrap: {
    gap: 14
  },
  card: {
    borderRadius: 26,
    backgroundColor: colors.surface,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    ...shadows.card
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800'
  },
  cardText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21
  },
  primaryButton: {
    borderRadius: 18,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  secondaryButton: {
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 14,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800'
  },
  infoCard: {
    borderRadius: 24,
    backgroundColor: colors.accentSoft,
    padding: 18,
    gap: 6,
    ...shadows.card
  },
  infoTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800'
  },
  infoValue: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: '800'
  },
  infoHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  }
})
