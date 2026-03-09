import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useFocusEffect } from '@react-navigation/native'
import { RootStackParamList } from '../types/navigation'
import apiService, { AggregatedProgress, CertificateRecord, ProgressCourse } from '../services/api'
import sessionService from '../services/session'

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp
}

interface HomeState {
  userCode: string
  progress: AggregatedProgress | null
  certificates: CertificateRecord[]
}

const emptyState: HomeState = {
  userCode: '',
  progress: null,
  certificates: []
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [state, setState] = useState<HomeState>(emptyState)
  const [loading, setLoading] = useState(true)

  const loadHome = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const userCode = await sessionService.getUserCode()
      if (!userCode) {
        Alert.alert('Sessão expirada', 'Faça login novamente.')
        navigation.navigate('Login')
        return
      }

      const [progress, certificates] = await Promise.all([
        apiService.getAggregatedProgress(userCode),
        apiService.getUserCertificates(userCode)
      ])

      setState({
        userCode,
        progress,
        certificates
      })
    } catch (error) {
      Alert.alert('Erro', (error as Error).message)
    } finally {
      setLoading(false)
    }
  }, [navigation])

  useEffect(() => {
    void loadHome()
  }, [loadHome])

  useFocusEffect(
    useCallback(() => {
      void loadHome()
    }, [loadHome])
  )

  const currentCourse: ProgressCourse | undefined = state.progress?.courses.find(
    course => course.progress > 0 && course.progress < 100
  ) ?? state.progress?.courses[0]

  const stats = {
    coursesCompleted: state.progress?.courses.filter(course => course.progress >= 100).length ?? 0,
    coursesInProgress: state.progress?.courses.filter(course => course.progress > 0 && course.progress < 100).length ?? 0,
    certificatesEarned: state.certificates.length,
    totalHours: Math.round((state.progress?.summary.averageProgress ?? 0) * 0.4)
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Olá, {state.userCode}!</Text>
        <Text style={styles.subtitle}>Pronta para construir seu futuro?</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.coursesCompleted}</Text>
          <Text style={styles.statLabel}>Cursos Concluídos</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.coursesInProgress}</Text>
          <Text style={styles.statLabel}>Em Progresso</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.certificatesEarned}</Text>
          <Text style={styles.statLabel}>Certificados</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalHours}h</Text>
          <Text style={styles.statLabel}>Horas Estudadas</Text>
        </View>
      </View>

      <View style={styles.currentCourseContainer}>
        <Text style={styles.sectionTitle}>Continue Aprendendo</Text>

        {currentCourse ? (
          <>
            <View style={styles.courseCard}>
              <Text style={styles.courseTitle}>{currentCourse.title}</Text>
              <Text style={styles.courseSubtitle}>
                Módulo {currentCourse.currentModule} de {currentCourse.modulesCount} • {currentCourse.progress}% completo
              </Text>

              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${currentCourse.progress}%` }]} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => navigation.navigate('CourseDetail', { courseId: currentCourse.courseId })}
            >
              <Text style={styles.continueButtonText}>Continuar Curso →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Sem cursos ativos no momento.</Text>
          </View>
        )}
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>

        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('CourseLibrary')}>
          <Text style={styles.actionIcon}>📚</Text>
          <Text style={styles.actionText}>Biblioteca de Cursos</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Certificate', { courseId: currentCourse?.courseId ?? 'costura' })}
        >
          <Text style={styles.actionIcon}>🏆</Text>
          <Text style={styles.actionText}>Meus Certificados</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Jobs')}>
          <Text style={styles.actionIcon}>💼</Text>
          <Text style={styles.actionText}>Vagas Compatíveis</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Progress')}>
          <Text style={styles.actionIcon}>📈</Text>
          <Text style={styles.actionText}>Meu Progresso</Text>
          <Text style={styles.actionArrow}>›</Text>
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
    backgroundColor: '#1E3A8A',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4
  },
  subtitle: {
    color: '#90CAF9',
    fontSize: 16
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF'
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center'
  },
  currentCourseContainer: {
    padding: 20
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 16
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12
  },
  emptyText: {
    color: '#666666',
    fontSize: 14
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 8
  },
  courseSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1E3A8A',
    borderRadius: 4
  },
  continueButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  quickActionsContainer: {
    padding: 20
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '500'
  },
  actionArrow: {
    fontSize: 18,
    color: '#90CAF9'
  }
})
