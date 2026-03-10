import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../types/navigation'
import apiService, { AggregatedProgress, CourseItem, CourseModule } from '../services/api'
import sessionService from '../services/session'
import { showAlert } from '../utils/alerts'

type CourseDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CourseDetail'>
type CourseDetailScreenRouteProp = RouteProp<RootStackParamList, 'CourseDetail'>

interface CourseDetailScreenProps {
  route: CourseDetailScreenRouteProp
  navigation: CourseDetailScreenNavigationProp
}

interface DetailState {
  course: CourseItem | null
  modules: CourseModule[]
  progress: AggregatedProgress | null
}

const initialState: DetailState = {
  course: null,
  modules: [],
  progress: null
}

export default function CourseDetailScreen({ route, navigation }: CourseDetailScreenProps) {
  const { courseId } = route.params
  const [state, setState] = useState<DetailState>(initialState)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async (): Promise<void> => {
    try {
      const userCode = await sessionService.getUserCode()
      if (!userCode) {
        navigation.navigate('Login')
        return
      }

      const [courses, modules, progress] = await Promise.all([
        apiService.getCourses(),
        apiService.getCourseModules(courseId),
        apiService.getAggregatedProgress(userCode)
      ])

      const course = courses.find(item => item.id === courseId) ?? null
      setState({ course, modules, progress })
    } catch (error) {
      showAlert('Erro', (error as Error).message)
    } finally {
      setLoading(false)
    }
  }, [courseId, navigation])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const progressItem = useMemo(
    () => state.progress?.courses.find(item => item.courseId === courseId),
    [state.progress, courseId]
  )

  const completed = useMemo(() => new Set(progressItem?.completedModules ?? []), [progressItem])

  const currentModule = useMemo(() => {
    const firstPending = state.modules.find(module => !completed.has(String(module.id)))
    return firstPending?.id ?? state.modules[state.modules.length - 1]?.id ?? 1
  }, [state.modules, completed])

  const openModule = (moduleId: number): void => {
    navigation.navigate('VideoLesson', { courseId, moduleId: String(moduleId) })
  }

  const openQuiz = (moduleId: number): void => {
    navigation.navigate('Quiz', { courseId, moduleId: String(moduleId) })
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    )
  }

  if (!state.course) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>Curso não encontrado.</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{state.course.title}</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryInstructor}>{state.course.instructor ?? 'Equipa Tecnica WIRA'}</Text>
        <Text style={styles.summaryMeta}>
          {state.course.duration_hours}h • {state.course.modules_count} módulos • {state.course.level}
        </Text>
        <Text style={styles.summaryDescription}>{state.course.description ?? 'Formacao profissional com certificado.'}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressItem?.progress ?? 0}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {progressItem?.progress ?? 0}% completo • módulo atual {progressItem?.currentModule ?? 1}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modulos</Text>
        {state.modules.map(module => {
          const done = completed.has(String(module.id))
          return (
            <View key={module.id} style={styles.moduleCard}>
              <View style={styles.moduleHeader}>
                <Text style={styles.moduleTitle}>Módulo {module.id}: {module.title}</Text>
                <Text style={[styles.badge, done ? styles.badgeDone : styles.badgePending]}>
                  {done ? 'Concluído' : 'Pendente'}
                </Text>
              </View>
              <Text style={styles.moduleDescription}>{module.description ?? 'Sem descricao detalhada.'}</Text>
              <Text style={styles.moduleMeta}>Duracao: {module.duration}</Text>

              <View style={styles.moduleActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => openModule(module.id)}>
                  <Text style={styles.secondaryButtonText}>Ver Aula</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={() => openQuiz(module.id)}>
                  <Text style={styles.primaryButtonText}>Fazer Quiz</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        })}
      </View>

      <View style={styles.footerAction}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => openQuiz(currentModule)}>
          <Text style={styles.primaryButtonText}>Quiz do módulo atual</Text>
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
  errorText: {
    color: '#B91C1C',
    fontSize: 16,
    fontWeight: '600'
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    backgroundColor: '#1E3A8A',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  backButton: {
    color: '#90CAF9',
    marginBottom: 8,
    fontSize: 15
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700'
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 16
  },
  summaryInstructor: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600'
  },
  summaryMeta: {
    marginTop: 6,
    color: '#6B7280',
    fontSize: 13
  },
  summaryDescription: {
    marginTop: 10,
    color: '#374151',
    lineHeight: 18
  },
  progressTrack: {
    marginTop: 14,
    height: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1E3A8A'
  },
  progressText: {
    marginTop: 8,
    color: '#1E3A8A',
    fontWeight: '600',
    fontSize: 12
  },
  section: {
    paddingHorizontal: 20
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8
  },
  moduleTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937'
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  badgeDone: {
    backgroundColor: '#DCFCE7',
    color: '#166534'
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    color: '#92400E'
  },
  moduleDescription: {
    marginTop: 8,
    fontSize: 13,
    color: '#4B5563'
  },
  moduleMeta: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280'
  },
  moduleActions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontWeight: '700',
    fontSize: 13
  },
  footerAction: {
    padding: 20,
    paddingTop: 8
  }
})

