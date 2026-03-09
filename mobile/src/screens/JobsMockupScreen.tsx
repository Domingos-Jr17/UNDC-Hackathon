import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type JobsMockupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'JobsMockup'>;

interface JobsMockupScreenProps {
  navigation: JobsMockupScreenNavigationProp;
}

export default function JobsMockupScreen({ navigation }: JobsMockupScreenProps) {
  const jobs = [
    {
      id: 1,
      title: 'Costureira - Fábrica Textil Matola',
      company: 'Fábrica Textil Matola',
      location: 'Matola (5km de você)',
      salary: '8.000 MT/mês',
      type: 'Tempo Integral',
      compatibility: 95,
      benefits: ['Chapa incluída', 'Almoço', 'Seguro de saúde'],
      requirements: [
        'Experiência: 2 anos (você tem 3)',
        'Máquina industrial (você sabe)',
        'Certificado (você tem)'
      ],
      validated: true,
      description: 'Produção de uniformes escolares para rede pública.',
      logo: require('../../assets/icon.png')
    },
    {
      id: 2,
      title: 'Costureira - Cooperativa Mulheres',
      company: 'Cooperativa Mulheres de Maputo',
      location: 'Maputo Centro',
      salary: '6.500 MT/mês',
      type: 'Meio Período',
      compatibility: 88,
      benefits: ['Horário flexível', 'Participação nos lucros', 'Creche no local'],
      requirements: [
        'Experiência: 1 ano (você tem 3)',
        'Costura básica (você sabe)',
        'Certificado (você tem)'
      ],
      validated: true,
      description: 'Cooperativa focada em empoderamento feminino através da costura.',
      logo: require('../../assets/icon.png')
    },
    {
      id: 3,
      title: 'Auxiliar de Produção - Confecção',
      company: 'Confecção e Costura Lda',
      location: 'Matola (8km de você)',
      salary: '7.200 MT/mês',
      type: 'Tempo Integral',
      compatibility: 82,
      benefits: ['Transporte', 'Formação contínua', 'Plano de carreira'],
      requirements: [
        'Experiência: 1 ano (você tem 3)',
        'Conhecimento de produção (você tem)',
        'Certificado (você tem)'
      ],
      validated: true,
      description: 'Auxiliar na linha de produção de uniformes.',
      logo: require('../../assets/icon.png')
    }
  ];

  const handleJobPress = (jobId: number) => {
    Alert.alert(
      'MOCKUP - Fase 2',
      'Esta funcionalidade está em desenvolvimento. Na versão final, você poderá candidatar-se a vagas compatíveis com seu perfil.',
      [
        { text: 'Entendido', onPress: () => { } }
      ]
    );
  };

  const handleFilter = () => {
    Alert.alert(
      'Filtros Avançados',
      'Na versão final, você poderá filtrar vagas por localização, salário, tipo de contrato e benefícios.',
      [
        { text: 'OK', onPress: () => { } }
      ]
    );
  };

  const handleProfile = () => {
    Alert.alert(
      'Meu Perfil',
      'Na versão final, você poderá visualizar e editar seu perfil profissional para empregadores.',
      [
        { text: 'OK', onPress: () => { } }
      ]
    );
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
        <Text style={styles.title}>Vagas Compatíveis</Text>
        <TouchableOpacity onPress={handleFilter}>
          <Text style={styles.filterButton}>Filtrar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleProfile}>
          <Text style={styles.profileButton}>Meu Perfil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mockupNotice}>
        <Text style={styles.mockupTitle}>🚧 EM DESENVOLVIMENTO</Text>
        <Text style={styles.mockupText}>
          Esta é uma demonstração da Fase 2 do WIRA. Na versão final, você poderá candidatar-se a vagas reais compatíveis com seu perfil.
        </Text>
      </View>

      <View style={styles.jobsContainer}>
        {jobs.map((job) => (
          <TouchableOpacity
            key={job.id}
            style={styles.jobCard}
            onPress={() => handleJobPress(job.id)}
          >
            <View style={styles.jobHeader}>
              <Image
                source={job.logo}
                style={styles.companyLogo}
                resizeMode="contain"
              />

              <View style={styles.jobInfo}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobCompany}>{job.company}</Text>
                <Text style={styles.jobLocation}>📍 {job.location}</Text>
              </View>
            </View>

            <View style={styles.compatibilityContainer}>
              <Text style={styles.compatibilityLabel}>Compatibilidade:</Text>
              <View style={styles.compatibilityBar}>
                <View
                  style={[
                    styles.compatibilityFill,
                    { width: `${job.compatibility}%` }
                  ]}
                />
              </View>
              <Text style={styles.compatibilityText}>{job.compatibility}%</Text>
            </View>

            <View style={styles.jobDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Salário:</Text>
                <Text style={styles.detailValue}>{job.salary}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tipo:</Text>
                <Text style={styles.detailValue}>{job.type}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Validada:</Text>
                <Text style={[styles.detailValue, job.validated && styles.validatedText]}>
                  {job.validated ? '✅ Sim' : '❌ Não'}
                </Text>
              </View>
            </View>

            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Requisitos:</Text>
              {job.requirements.map((requirement, index) => (
                <Text key={index} style={styles.requirement}>
                  • {requirement}
                </Text>
              ))}
            </View>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Benefícios:</Text>
              {job.benefits.map((benefit, index) => (
                <Text key={index} style={styles.benefit}>
                  ✓ {benefit}
                </Text>
              ))}
            </View>

            <View style={styles.applyButton}>
              <Text style={styles.applyButtonText}>Ver Detalhes</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          MOCKUP - Algoritmo de Matching já codificado, aguardando validação de segurança
        </Text>
      </View>
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
    flex: 1,
    textAlign: 'center',
  },
  filterButton: {
    fontSize: 16,
    color: '#1E3A8A',
    padding: 10,
  },
  profileButton: {
    fontSize: 16,
    color: '#1E3A8A',
    padding: 10,
  },
  mockupNotice: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  mockupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 5,
  },
  mockupText: {
    fontSize: 14,
    color: '#E65100',
    textAlign: 'center',
    lineHeight: 20,
  },
  jobsContainer: {
    padding: 20,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  companyLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  jobCompany: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 5,
  },
  jobLocation: {
    fontSize: 14,
    color: '#1E3A8A',
  },
  compatibilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  compatibilityLabel: {
    fontSize: 14,
    color: '#757575',
    marginRight: 10,
  },
  compatibilityBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  compatibilityFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  compatibilityText: {
    fontSize: 14,
    color: '#1E3A8A',
    fontWeight: 'bold',
  },
  jobDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#757575',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: 'bold',
    flex: 1,
  },
  validatedText: {
    color: '#4CAF50',
  },
  requirementsContainer: {
    marginBottom: 15,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  requirement: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 5,
    lineHeight: 20,
  },
  benefitsContainer: {
    marginBottom: 15,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  benefit: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 5,
    lineHeight: 20,
  },
  applyButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#757575',
    fontStyle: 'italic',
  },
});
