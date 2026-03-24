import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import AppShell from '../components/AppShell'
import { RootStackParamList } from '../types/navigation'
import apiService, { CertificateRecord } from '../services/api'
import sessionService from '../services/session'
import { showAlert } from '../utils/alerts'
import { colors, shadows } from '../theme'

type CertificateScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Certificate'>
type CertificateScreenRouteProp = RouteProp<RootStackParamList, 'Certificate'>

interface CertificateScreenProps {
  route: CertificateScreenRouteProp
  navigation: CertificateScreenNavigationProp
}

export default function CertificateScreen({ route, navigation }: CertificateScreenProps) {
  const { courseId } = route.params
  const [certificates, setCertificates] = useState<CertificateRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        setLoading(true)
        const userCode = await sessionService.getUserCode()
        if (!userCode) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
          return
        }
        const data = await apiService.getUserCertificates(userCode)
        setCertificates(data)
      } catch (error) {
        showAlert('Erro', (error as Error).message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [navigation])

  const certificate = useMemo(
    () => certificates.find(item => item.courseId === courseId) ?? certificates[0] ?? null,
    [certificates, courseId]
  )

  const handleOpenVerification = async (): Promise<void> => {
    if (!certificate) return
    try {
      await Linking.openURL(certificate.qrCode)
    } catch {
      showAlert('Verificação', `Código: ${certificate.verificationCode}`)
    }
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <AppShell
      navigation={navigation}
      activeRoute="Progress"
      title="Certificado"
      subtitle="Guarde esta conquista e use o código de verificação sempre que precisar de confirmar o resultado."
      showLogout={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={18} color={colors.primaryDark} />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      {!certificate ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Certificado ainda não disponível</Text>
          <Text style={styles.emptyText}>Conclua o curso e atinja o resultado mínimo no quiz para gerar o certificado.</Text>
        </View>
      ) : (
        <>
          <View style={styles.certificateCard}>
            <View style={styles.certificateBadge}>
              <Ionicons name="ribbon-outline" size={18} color={colors.textOnPrimary} />
              <Text style={styles.certificateBadgeText}>Conquista desbloqueada</Text>
            </View>

            <Text style={styles.certificateTitle}>Certificado de competência</Text>
            <Text style={styles.label}>Curso</Text>
            <Text style={styles.value}>{certificate.courseTitle}</Text>

            <Text style={styles.label}>Código de verificação</Text>
            <Text style={styles.value}>{certificate.verificationCode}</Text>

            <View style={styles.infoRow}>
              <InfoBlock label="Emissão" value={new Date(certificate.issueDate).toLocaleDateString('pt-PT')} />
              <InfoBlock label="Pontuação" value={`${certificate.score}%`} />
            </View>
          </View>

          <View style={styles.helperCard}>
            <Text style={styles.helperTitle}>Como usar este certificado</Text>
            <Text style={styles.helperText}>
              Use o código de verificação para confirmar a autenticidade e partilhe esta conquista quando fizer sentido para oportunidades futuras.
            </Text>
            <TouchableOpacity style={styles.verifyButton} onPress={() => void handleOpenVerification()}>
              <Text style={styles.verifyButtonText}>Verificar certificado</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </AppShell>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBlock}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  emptyCard: {
    borderRadius: 26,
    backgroundColor: colors.surface,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22
  },
  certificateCard: {
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  certificateBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 18
  },
  certificateBadgeText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '800'
  },
  certificateTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 18
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 10
  },
  value: {
    fontSize: 17,
    color: colors.text,
    fontWeight: '700'
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18
  },
  infoBlock: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    padding: 14
  },
  infoValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '700'
  },
  helperCard: {
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    padding: 20,
    gap: 10
  },
  helperTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800'
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21
  },
  verifyButton: {
    marginTop: 4,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center'
  },
  verifyButtonText: {
    color: colors.textOnPrimary,
    textAlign: 'center',
    fontWeight: '800'
  }
})
