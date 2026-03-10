import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import AppShell from '../components/AppShell'
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

type ModuleStatus = 'completed' | 'current' | 'upcoming'

export default function CourseDetailScreen({ route, navigation }: CourseDetailScreenProps) {
  const { courseId } = route.params
  const [state, setState] = useState<DetailState>(initialState)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async (mode: 'initial' | 'refresh' = 'initial'): Promise<void> => {
    if (mode === 'initial') {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

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
      setRefreshing(false)
    }
  }, [courseId, navigation])

  useEffect(() => {
    void loadData('initial')
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

  const courseGuidance = useMemo(() => {
    if (!progressItem) {
      return 'Comece pelo primeiro módulo e avance de forma sequencial para construir uma base sólida.'
    }

    const remaining = Math.max(0, progressItem.modulesCount - progressItem.currentModule)
    return remaining > 0
      ? `A recomendação agora é concluir o módulo ${progressItem.currentModule}. Depois faltarão ${remaining} módulo${remaining > 1 ? 's' : ''}.`
      : 'Está muito perto de concluir este curso. Termine os últimos passos e avance para a avaliação.'
  }, [progressItem])

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
    <AppShell
      navigation={navigation}
      activeRoute="CourseLibrary"
      title={state.course.title}
      subtitle="Siga a recomendação abaixo para manter uma progressão clara e consistente."
      refreshing={refreshing}
      onRefresh={() => void loadData('refresh')}
      showBottomNav={false}
      showLogout={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={18} color={colors.primaryDark} />
        <Text style={styles.backButtonText}>Voltar para cursos</Text>
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
        <Text style={styles.progressText}>{progressItem?.progress ?? 0}% concluído · módulo actual {progressItem?.currentModule ?? 1}</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => openModule(currentModule)}>
          <Ionicons name="play-circle-outline" size={20} color={colors.textOnPrimary} />
          <Text style={styles.primaryButtonText}>Continuar no módulo recomendado</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.guidanceCard}>
        <View style={styles.guidanceIconWrap}>
          <Ionicons name="compass-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.guidanceCopy}>
          <Text style={styles.guidanceTitle}>Como avançar melhor</Text>
          <Text style={styles.guidanceText}>{courseGuidance}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Módulos</Text>
        {state.modules.map(module => {
          const status: ModuleStatus = completed.has(String(module.id))
            ? 'completed'
            : module.id === currentModule
              ? 'current'
              : 'upcoming'

          const canOpenLesson = status !== 'upcoming'
          const canOpenQuiz = status === 'completed' || status === 'current'

          return (
            <View key={module.id} style={[styles.moduleCard, status === 'current' && styles.moduleCardCurrent]}>
              <View style={styles.moduleHeader}>
                <Text style={styles.moduleTitle}>Módulo {module.id}: {module.title}</Text>
                <View style={[styles.statusPill, status === 'completed' ? styles.statusPillDone : status === 'current' ? styles.statusPillCurrent : styles.statusPillUpcoming]}>
                  <Text style={[styles.statusPillText, status === 'completed' ? styles.statusPillTextDone : status === 'current' ? styles.statusPillTextCurrent : styles.statusPillTextUpcoming]}>
                    {status === 'completed' ? 'Concluído' : status === 'current' ? 'Recomendado' : 'Depois deste'}
                  </Text>
                </View>
              </View>

              <Text style={styles.moduleDescription}>{module.description ?? 'Sem descrição detalhada.'}</Text>
              <Text style={styles.moduleMeta}>Duração: {module.duration}</Text>
              {status === 'upcoming' ? <Text style={styles.moduleHint}>Conclua o módulo recomendado antes de avançar para este passo.</Text> : null}

              <View style={styles.moduleActions}>
                <TouchableOpacity
                  style={[styles.secondaryButton, !canOpenLesson && styles.disabledButton]}
                  onPress={() => openModule(module.id)}
                  disabled={!canOpenLesson}
                >
                  <Text style={styles.secondaryButtonText}>{status === 'current' ? 'Ver aula agora' : 'Rever aula'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primarySmallButton, !canOpenQuiz && styles.disabledButton]}
                  onPress={() => openQuiz(module.id)}
                  disabled={!canOpenQuiz}
                >
                  <Text style={styles.primarySmallButtonText}>Fazer quiz</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        })}
      </View>
    </AppShell>
  )
}

const styles = StyleSheet.create({
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
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
  guidanceCard: {
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    padding: 18,
    flexDirection: 'row',
    gap: 14
  },
  guidanceIconWrap: {
    width: 42,
    height: 42,
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
  statusPillUpcoming: {
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
  statusPillTextUpcoming: {
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
  moduleHint: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600'
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
  },
  disabledButton: {
    opacity: 0.45
  }
})
