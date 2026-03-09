import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

type CertificateScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Certificate'>;
type CertificateScreenRouteProp = RouteProp<RootStackParamList, 'Certificate'>;

interface CertificateScreenProps {
  route: CertificateScreenRouteProp;
  navigation: CertificateScreenNavigationProp;
}

export default function CertificateScreen({ route, navigation }: CertificateScreenProps) {
  const { courseId } = route.params;

  const certificateData = {
    costura: {
      title: 'Costura Avançada - Uniformes Escolares',
      date: '25 de Outubro de 2025',
      code: 'V0042-COSTURA-2025',
      instructor: 'Professora Ana Machel',
      institution: 'Centro de Acolhimento Maputo',
      duration: '40 horas',
      modules: 8,
      score: 85,
      qrCode: 'WIRA-CERT-V0042-COSTURA-2025'
    },
    culinaria: {
      title: 'Culinária Profissional Moçambicana',
      date: '20 de Outubro de 2025',
      code: 'V0042-CULINARIA-2025',
      instructor: 'Chef João Sitoe',
      institution: 'Centro de Acolhimento Maputo',
      duration: '35 horas',
      modules: 7,
      score: 78,
      qrCode: 'WIRA-CERT-V0042-CULINARIA-2025'
    },
    agricultura: {
      title: 'Agricultura Sustentável',
      date: null,
      code: null,
      instructor: 'Eng. Maria Cossa',
      institution: 'Centro de Acolhimento Maputo',
      duration: '30 horas',
      modules: 6,
      score: 0,
      qrCode: null
    }
  };

  const certificate = certificateData[courseId as keyof typeof certificateData] || certificateData.costura;
  const isCompleted = certificate.qrCode !== null;

  const handleShare = () => {
    // Simular compartilhamento
    alert('Certificado compartilhado com sucesso!');
  };

  const handleDownload = () => {
    // Simular download
    alert('Download do certificado iniciado!');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Certificado</Text>
      </View>

      {isCompleted ? (
        <View>
          <View style={styles.certificateContainer}>
            <View style={styles.certificateHeader}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />

              <View style={styles.headerInfo}>
                <Text style={styles.certificateTitle}>CERTIFICADO DE COMPETÊNCIA</Text>
                <Text style={styles.certificateSubtitle}>Plataforma WIRA</Text>
              </View>
            </View>

            <View style={styles.certificateBody}>
              <View style={styles.certificateInfo}>
                <Text style={styles.infoLabel}>Nome do Curso:</Text>
                <Text style={styles.infoValue}>{certificate.title}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Código do Certificado:</Text>
                  <Text style={styles.infoValue}>{certificate.code}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Data de Emissão:</Text>
                  <Text style={styles.infoValue}>{certificate.date}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Instrutor(a):</Text>
                  <Text style={styles.infoValue}>{certificate.instructor}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Instituição:</Text>
                  <Text style={styles.infoValue}>{certificate.institution}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Duração:</Text>
                  <Text style={styles.infoValue}>{certificate.duration}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Módulos Concluídos:</Text>
                  <Text style={styles.infoValue}>{certificate.modules} de {certificate.modules}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoLabel}>Pontuação Final:</Text>
                  <Text style={styles.infoValue}>{certificate.score}%</Text>
                </View>
              </View>
            </View>

            <View style={styles.qrContainer}>
              <Text style={styles.qrTitle}>Código QR de Verificação</Text>
              <View style={styles.qrBox}>
                <Text style={styles.qrCode}>{certificate.qrCode}</Text>
              </View>
              <Text style={styles.qrInstructions}>
                Escaneie este código para verificar a autenticidade do certificado
              </Text>
            </View>

            <View style={styles.validityContainer}>
              <Text style={styles.validityTitle}>Validade e Reconhecimento</Text>
              <Text style={styles.validityText}>
                Este certificado é reconhecido pelo Ministério do Trabalho de Moçambique
                e válido para comprovação de competências profissionais.
              </Text>
            </View>

            <View style={styles.signatureContainer}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureText}>
                Assinado Digitalmente: Centro de Acolhimento Maputo
              </Text>
              <View style={styles.signatureLine} />
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Text style={styles.actionButtonText}>Compartilhar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDownload}
            >
              <Text style={styles.actionButtonText}>Baixar PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.notCompletedContainer}>
          <View style={styles.notCompletedIcon}>
            <Text style={styles.notCompletedIconText}>🔒</Text>
          </View>

          <Text style={styles.notCompletedTitle}>Certificado Não Disponível</Text>
          <Text style={styles.notCompletedText}>
            Complete o curso para gerar seu certificado de competência.
          </Text>

          <TouchableOpacity
            style={styles.backToCourseButton}
            onPress={handleBack}
          >
            <Text style={styles.backToCourseButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      )
      }
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    fontSize: 16,
    color: '#1E3A8A',
    marginRight: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  certificateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  certificateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  certificateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textAlign: 'center',
  },
  certificateSubtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  certificateBody: {
    padding: 20,
  },
  certificateInfo: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoRow: {
    marginBottom: 15,
  },
  infoColumn: {
    flex: 1,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1E3A8A',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  qrCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textAlign: 'center',
    letterSpacing: 1,
  },
  qrInstructions: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    maxWidth: 250,
  },
  validityContainer: {
    backgroundColor: '#F0F4F4',
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
  },
  validityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  validityText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
  },
  signatureContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  signatureLine: {
    width: 200,
    height: 1,
    backgroundColor: '#1E3A8A',
    marginVertical: 5,
  },
  signatureText: {
    fontSize: 12,
    color: '#757575',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  notCompletedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  notCompletedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  notCompletedIconText: {
    fontSize: 40,
  },
  notCompletedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 10,
  },
  notCompletedText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  backToCourseButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backToCourseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
