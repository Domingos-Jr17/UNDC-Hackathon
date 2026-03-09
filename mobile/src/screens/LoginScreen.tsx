import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types/navigation'
import apiService from '../services/api'
import sessionService from '../services/session'

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
      Alert.alert('Erro', 'Por favor, insira seu codigo de acesso')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiService.login(normalizedCode)
      await sessionService.setSession(response.token, response.user.anonymousCode)
      navigation.navigate('Home')
    } catch (error) {
      Alert.alert('Falha no Login', (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Acesso WIRA</Text>
        <Text style={styles.subtitle}>Insira seu codigo anonimo de acesso</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Código (ex: V0001)"
          value={accessCode}
          onChangeText={setAccessCode}
          autoCapitalize="characters"
          maxLength={5}
          editable={!isSubmitting}
        />

        <TouchableOpacity
          style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
          onPress={() => {
            void handleLogin()
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#1E3A8A" />
          ) : (
            <Text style={styles.loginButtonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helperText}>
          Use o codigo anonimo fornecido pela ONG parceira no formato V####.
        </Text>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    padding: 20
  },
  header: {
    marginTop: 60,
    marginBottom: 40
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#90CAF9',
    textAlign: 'center'
  },
  form: {
    flex: 1,
    justifyContent: 'center'
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center'
  },
  loginButtonDisabled: {
    opacity: 0.7
  },
  loginButtonText: {
    color: '#1E3A8A',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  helperText: {
    color: '#90CAF9',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4
  },
  backButton: {
    marginBottom: 40
  },
  backButtonText: {
    color: '#90CAF9',
    fontSize: 16,
    textAlign: 'center'
  }
})
