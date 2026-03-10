import React, { useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { RootStackParamList } from '../types/navigation'
import apiService from '../services/api'
import sessionService from '../services/session'
import { showAlert } from '../utils/alerts'
import { colors, shadows } from '../theme'

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [accessCode, setAccessCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (): Promise<void> => {
    const normalizedCode = accessCode.trim().toUpperCase()
    if (!normalizedCode) {
      showAlert('Código em falta', 'Por favor, introduza o seu código de acesso.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiService.login(normalizedCode)
      await sessionService.setSession(response.token, response.user.anonymousCode)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }]
      })
    } catch (error) {
      showAlert('Falha no login', (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={colors.primaryDark} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.panel}>
          <Text style={styles.eyebrow}>Acesso seguro</Text>
          <Text style={styles.title}>Entre com o seu código anónimo</Text>
          <Text style={styles.subtitle}>
            O código protege a sua identidade e permite retomar a jornada exatamente de onde ficou.
          </Text>

          <View style={styles.inputWrap}>
            <Ionicons name="key-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Código (ex: V0042)"
              placeholderTextColor={colors.textMuted}
              value={accessCode}
              onChangeText={setAccessCode}
              autoCapitalize="characters"
              maxLength={5}
              editable={!isSubmitting}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
            onPress={() => {
              void handleLogin()
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.loginButtonText}>Entrar e continuar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.helperCard}>
            <Text style={styles.helperTitle}>Ainda não recebeu código?</Text>
            <Text style={styles.helperText}>Fale com a ONG parceira para ativar o seu acesso em segurança.</Text>
            <TouchableOpacity style={styles.helperButton} onPress={() => navigation.navigate('Support')}>
              <Text style={styles.helperButtonText}>Preciso de ajuda</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: colors.background,
    padding: 20
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18
  },
  backButtonText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '700'
  },
  panel: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: colors.surface,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 10
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 10
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28
  },
  inputWrap: {
    position: 'relative',
    marginBottom: 18
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 17,
    zIndex: 1
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 46,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 1
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 22
  },
  loginButtonDisabled: {
    opacity: 0.7
  },
  loginButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '800'
  },
  helperCard: {
    marginTop: 'auto',
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    padding: 18,
    gap: 8
  },
  helperTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  helperButton: {
    alignSelf: 'flex-start',
    marginTop: 4
  },
  helperButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700'
  }
})
