import React from 'react'
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types/navigation'
import { showAlert } from '../utils/alerts'

type SupportScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Support'>

interface SupportScreenProps {
  navigation: SupportScreenNavigationProp
}

const SUPPORT_PHONE = process.env.EXPO_PUBLIC_SUPPORT_PHONE ?? '+258840000000'
const SUPPORT_MESSAGE = process.env.EXPO_PUBLIC_SUPPORT_MESSAGE ?? 'Ola, preciso de um codigo de acesso para a plataforma WIRA.'

const normalizePhone = (value: string): string => value.replace(/\D/g, '')

export default function SupportScreen({ navigation }: SupportScreenProps) {
  const phoneDigits = normalizePhone(SUPPORT_PHONE)
  const whatsappUrl = phoneDigits ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(SUPPORT_MESSAGE)}` : ''
  const callUrl = phoneDigits ? `tel:${phoneDigits}` : ''

  const handleOpen = async (url: string): Promise<void> => {
    if (!url) {
      showAlert('Contato indisponível', 'Configure o telefone de suporte no aplicativo.')
      return
    }
    try {
      await Linking.openURL(url)
    } catch (error) {
      showAlert('Erro', (error as Error).message)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Preciso de Codigo</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          O codigo de acesso e fornecido pela ONG parceira. Se precisar de ajuda, entre em contato:
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>WhatsApp</Text>
          <Text style={styles.cardText}>Envie uma mensagem para nossa equipe.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => void handleOpen(whatsappUrl)}>
            <Text style={styles.primaryButtonText}>Abrir WhatsApp</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Telefone</Text>
          <Text style={styles.cardText}>Ligue diretamente para a ONG.</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => void handleOpen(callUrl)}>
            <Text style={styles.secondaryButtonText}>Ligar Agora</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Numero de suporte</Text>
          <Text style={styles.infoValue}>{SUPPORT_PHONE}</Text>
          <Text style={styles.infoHint}>
            Para alterar este numero, configure EXPO_PUBLIC_SUPPORT_PHONE.
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    backgroundColor: '#1E3A8A',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18
  },
  backButton: {
    color: '#90CAF9',
    marginBottom: 8,
    fontSize: 15
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700'
  },
  content: {
    padding: 20,
    gap: 14
  },
  subtitle: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 10
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A'
  },
  cardText: {
    fontSize: 13,
    color: '#4B5563'
  },
  primaryButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  secondaryButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '700'
  },
  infoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    gap: 6
  },
  infoTitle: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '700'
  },
  infoValue: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '700'
  },
  infoHint: {
    fontSize: 12,
    color: '#4B5563'
  }
})
