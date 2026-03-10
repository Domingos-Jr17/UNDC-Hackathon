import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { RootStackParamList } from '../types/navigation'
import { colors, shadows } from '../theme'

type WelcomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp
}

const trustPoints = [
  'Acesso por codigo anonimo e seguro',
  'Cursos profissionais com acompanhamento',
  'Apoio e oportunidades no mesmo aplicativo'
]

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.brandRow}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.brandBadge}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.textOnPrimary} />
              <Text style={styles.brandBadgeText}>Acesso protegido</Text>
            </View>
          </View>

          <Text style={styles.eyebrow}>WIRA</Text>
          <Text style={styles.title}>Aprenda, avance e volte a decidir o seu futuro.</Text>
          <Text style={styles.subtitle}>
            Uma experiencia segura para capacitacao profissional, apoio e acesso a novas oportunidades.
          </Text>
        </View>

        <View style={styles.guidanceCard}>
          <View style={styles.guidanceIconWrap}>
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.guidanceCopy}>
            <Text style={styles.guidanceTitle}>Como funciona</Text>
            <Text style={styles.guidanceText}>
              Entre com o seu codigo ou fale com a equipa parceira para ativar o acesso em seguranca.
            </Text>
          </View>
        </View>

        <View style={styles.trustCard}>
          {trustPoints.map(point => (
            <View key={point} style={styles.trustRow}>
              <View style={styles.trustIconWrap}>
                <Ionicons name="checkmark" size={16} color={colors.primary} />
              </View>
              <Text style={styles.trustText}>{point}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.primaryButtonText}>Ja tenho codigo de acesso</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Support')}>
            <Text style={styles.secondaryButtonText}>Preciso de ajuda para obter um codigo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    backgroundColor: colors.background
  },
  heroCard: {
    marginTop: 12,
    borderRadius: 32,
    backgroundColor: colors.primary,
    padding: 24,
    ...shadows.card
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: 54,
    height: 54
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  brandBadgeText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '700'
  },
  eyebrow: {
    color: '#CDE4F6',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 10
  },
  title: {
    color: colors.textOnPrimary,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 12
  },
  subtitle: {
    color: '#D9ECFA',
    fontSize: 16,
    lineHeight: 24
  },
  guidanceCard: {
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start'
  },
  guidanceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  guidanceCopy: {
    flex: 1,
    gap: 4
  },
  guidanceTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  guidanceText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19
  },
  trustCard: {
    borderRadius: 28,
    backgroundColor: colors.surface,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
    ...shadows.card
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  trustIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  trustText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600'
  },
  actions: {
    gap: 12,
    marginTop: 20,
    marginBottom: 8
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '800'
  },
  secondaryButton: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center'
  }
})
