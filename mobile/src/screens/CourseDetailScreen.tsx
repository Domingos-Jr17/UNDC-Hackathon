import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { RootStackParamList } from '../types/navigation'
import apiService, { AggregatedProgress, CourseItem, CourseModule } from '../services/api'
import sessionService from '../services/session'
import { showAlert } from '../utils/alerts'
import { colors, shadows } from '../theme'

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
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
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
        <ActivityIndicator size="large" color={colors.primary} />
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={colors.primaryDark} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryEyebrow}>Plano de aprendizagem</Text>
          <Text style={styles.summaryTitle}>{state.course.title}</Text>
          <Text style={styles.summaryInstructor}>{state.course.instructor ?? 'Equipa técnica WIRA'}</Text>
          <Text style={styles.summaryMeta}>{state.course.duration_hours}h · {state.course.modules_count} módulos · {state.course.level}</Text>
          <Text style={styles.summaryDescription}>{state.course.description ?? 'Formação profissional com certificado.'}</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressItem?.progress ?? 0}%` }]} />
          </View>
          <Text style={styles.progressText}>{progressItem?.progress ?? 0}% concluído · módulo atual {progressItem?.currentModule ?? 1}</Text>

          <TouchableOpacity style={styles.primaryButton} onPress={() => openModule(currentModule)}>
            <Ionicons name="play-circle-outline" size={20} color={colors.textOnPrimary} />
            <Text style={styles.primaryButtonText}>Continuar no módulo recomendado</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Módulos</Text>
          {state.modules.map(module => {
            const done = completed.has(String(module.id))
            const isCurrent = module.id === currentModule
            return (
              <View key={module.id} style={[styles.moduleCard, isCurrent && styles.moduleCardCurrent]}>
                <View style={styles.moduleHeader}>
                  <Text style={styles.moduleTitle}>Módulo {module.id}: {module.title}</Text>
                  <View style={[styles.statusPill, done ? styles.statusPillDone : isCurrent ? styles.statusPillCurrent : styles.statusPillPending]}>
                    <Text style={[styles.statusPillText, done ? styles.statusPillTextDone : isCurrent ? styles.statusPillTextCurrent : styles.statusPillTextPending]}>
                      {done ? 'Concluído' : isCurrent ? 'Recomendado' : 'Pendente'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.moduleDescription}>{module.description ?? 'Sem descrição detalhada.'}</Text>
                <Text style={styles.moduleMeta}>Duração: {module.duration}</Text>

                <View style={styles.moduleActions}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => openModule(module.id)}>
                    <Text style={styles.secondaryButtonText}>Ver aula</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primarySmallButton} onPress={() => openQuiz(module.id)}>
                    <Text style={styles.primarySmallButtonText}>Fazer quiz</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '700'
  },
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  contentContainer: {
    padding: 20,
    gap: 18,
    paddingBottom: 32
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  backButtonText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '700'
  },
  summaryCard: {
    borderRadius: 30,
    backgroundColor: colors.surface,
    padding: 22,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  summaryEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800'
  },
  summaryInstructor: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700'
  },
  summaryMeta: {
    color: colors.textMuted,
    fontSize: 13
  },
  summaryDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21
  },
  progressTrack: {
    marginTop: 8,
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary
  },
  progressText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700'
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  sectionCard: {
    borderRadius: 28,
    backgroundColor: colors.surface,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800'
  },
  moduleCard: {
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    padding: 16,
    gap: 8
  },
  moduleCardCurrent: {
    borderWidth: 1,
    borderColor: colors.primary
  },
  moduleHeader: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  moduleTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800'
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  statusPillDone: {
    backgroundColor: colors.successSoft
  },
  statusPillCurrent: {
    backgroundColor: colors.primarySoft
  },
  statusPillPending: {
    backgroundColor: colors.warningSoft
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800'
  },
  statusPillTextDone: {
    color: colors.success
  },
  statusPillTextCurrent: {
    color: colors.primary
  },
  statusPillTextPending: {
    color: colors.warning
  },
  moduleDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19
  },
  moduleMeta: {
    color: colors.textMuted,
    fontSize: 12
  },
  moduleActions: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 8
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800'
  },
  primarySmallButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    alignItems: 'center'
  },
  primarySmallButtonText: {
    color: colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '800'
  }
})
