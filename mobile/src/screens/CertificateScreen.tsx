import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../types/navigation'
import apiService, { CertificateRecord } from '../services/api'
import sessionService from '../services/session'

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
          navigation.navigate('Login')
          return
        }
        const data = await apiService.getUserCertificates(userCode)
        setCertificates(data)
      } catch (error) {
        Alert.alert('Erro', (error as Error).message)
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

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    )
  }

  if (!certificate) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Voltar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.notCompletedContainer}>
          <Text style={styles.notCompletedTitle}>Certificado não disponível</Text>
          <Text style={styles.notCompletedText}>Conclua o curso e atinja 70% no quiz para gerar seu certificado.</Text>
        </View>
      </View>
    )
  }

  const handleOpenVerification = async (): Promise<void> => {
    try {
      await Linking.openURL(certificate.qrCode)
    } catch {
      Alert.alert('Verificação', `Código: ${certificate.verificationCode}`)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Certificado</Text>
      </View>

      <View style={styles.certificateContainer}>
        <Text style={styles.certificateTitle}>CERTIFICADO DE COMPETÊNCIA</Text>
        <Text style={styles.label}>Curso</Text>
        <Text style={styles.value}>{certificate.courseTitle}</Text>

        <Text style={styles.label}>Código de verificação</Text>
        <Text style={styles.value}>{certificate.verificationCode}</Text>

        <Text style={styles.label}>Data de emissão</Text>
        <Text style={styles.value}>{new Date(certificate.issueDate).toLocaleDateString()}</Text>

        <Text style={styles.label}>Pontuação final</Text>
        <Text style={styles.value}>{certificate.score}%</Text>

        <TouchableOpacity style={styles.verifyButton} onPress={() => void handleOpenVerification()}>
          <Text style={styles.verifyButtonText}>Verificar Certificado</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5'
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40
  },
  backButton: {
    fontSize: 16,
    color: '#1E3A8A',
    marginRight: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A'
  },
  certificateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 20,
    padding: 20
  },
  certificateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 16,
    textAlign: 'center'
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 10
  },
  value: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600'
  },
  verifyButton: {
    marginTop: 20,
    backgroundColor: '#1E3A8A',
    paddingVertical: 14,
    borderRadius: 8
  },
  verifyButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700'
  },
  notCompletedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  notCompletedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 10
  },
  notCompletedText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22
  }
})
