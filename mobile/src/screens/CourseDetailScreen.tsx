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

  const progressCourses = Array.isArray(state.progress?.courses) ? state.progress.courses : []

  const progressItem = useMemo(
    () => progressCourses.find(item => item.courseId === courseId),
    [progressCourses, courseId]
  )

  const completed = useMemo(() => new Set(progressItem?.completedModules ?? []), [progressItem])

  const currentModule = useMemo(() => {
    const firstPending = state.modules.find(module => !completed.has(String(module.id)))
    return firstPending?.id ?? state.modules[state.modules.length - 1]?.id ?? 1
  }, [state.modules, completed])

  const contentSummary = useMemo(() => {
    return state.modules.reduce(
      (acc, module) => {
        if (module.videoUrl) acc.video += 1
        if (module.pdfUrl) acc.pdf += 1
        if (module.textContent) acc.text += 1
        if ([module.videoUrl, module.pdfUrl, module.textContent].filter(Boolean).length > 1) {
          acc.mixed += 1
        }
        return acc
      },
      { video: 0, pdf: 0, text: 0, mixed: 0 }
    )
  }, [state.modules])

  const openModule = (moduleId: number): void => {
    navigation.navigate('VideoLesson', { courseId, moduleId: String(moduleId) })
  }

  const openQuiz = (moduleId: number): void => {
    navigation.navigate('Quiz', { courseId, moduleId: String(moduleId) })
  }

  const courseGuidance = useMemo(() => {
    if (!progressItem) {
      return 'Comece pelo primeiro modulo e avance de forma sequencial. O conteudo pode combinar video, PDF e texto.'
    }

    const remaining = Math.max(0, progressItem.modulesCount - progressItem.currentModule)
    return remaining > 0
      ? `A recomendacao agora e concluir o modulo ${progressItem.currentModule}. Depois faltarao ${remaining} modulo${remaining > 1 ? 's' : ''}.`
      : 'Esta muito perto de concluir este curso. Termine os ultimos passos e avance para a avaliacao.'
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
        <Text style={styles.errorText}>Curso nao encontrado.</Text>
      </View>
    )
  }

  return (
    <AppShell
      navigation={navigation}
      activeRoute="CourseLibrary"
      title={state.course.title}
      subtitle="Siga a recomendacao abaixo para manter uma progressao clara e consistente."
      refreshing={refreshing}
      onRefresh={() => void loadData('refresh')}
      showLogout={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={18} color={colors.primaryDark} />
        <Text style={styles.backButtonText}>Voltar para cursos</Text>
      </TouchableOpacity>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryEyebrow}>Plano de aprendizagem</Text>
        <Text style={styles.summaryTitle}>{state.course.title}</Text>
        <Text style={styles.summaryInstructor}>{state.course.instructor ?? 'Equipa tecnica WIRA'}</Text>
        <Text style={styles.summaryMeta}>{state.course.duration_hours}h · {state.course.modules_count} modulos · {state.course.level}</Text>
        <Text style={styles.summaryDescription}>{state.course.description ?? 'Formacao profissional com certificado.'}</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressItem?.progress ?? 0}%` }]} />
        </View>
        <Text style={styles.progressText}>{progressItem?.progress ?? 0}% concluido · modulo actual {progressItem?.currentModule ?? 1}</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => openModule(currentModule)}>
          <Ionicons name="play-circle-outline" size={20} color={colors.textOnPrimary} />
          <Text style={styles.primaryButtonText}>Abrir modulo recomendado</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.guidanceCard}>
        <View style={styles.guidanceIconWrap}>
          <Ionicons name="compass-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.guidanceCopy}>
          <Text style={styles.guidanceTitle}>Como avancar melhor</Text>
          <Text style={styles.guidanceText}>{courseGuidance}</Text>
        </View>
      </View>

      <View style={styles.mixCard}>
        <Text style={styles.sectionTitle}>Formatos disponiveis no curso</Text>
        <View style={styles.mixGrid}>
          <SummaryChip label="Video" value={contentSummary.video} />
          <SummaryChip label="PDF" value={contentSummary.pdf} />
          <SummaryChip label="Texto" value={contentSummary.text} />
          <SummaryChip label="Misto" value={contentSummary.mixed} />
        </View>
        <Text style={styles.mixHint}>
          Quando um modulo tiver mais de um formato, comece pelo material principal indicado no cartao e use os restantes como apoio.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Modulos</Text>
        {state.modules.map(module => {
          const status: ModuleStatus = completed.has(String(module.id))
            ? 'completed'
            : module.id === currentModule
              ? 'current'
              : 'upcoming'

          const canOpenLesson = status !== 'upcoming'
          const canOpenQuiz = status === 'completed' || status === 'current'
          const hasVideo = Boolean(module.videoUrl)
          const hasPdf = Boolean(module.pdfUrl)
          const hasText = Boolean(module.textContent)
          const formatCount = [hasVideo, hasPdf, hasText].filter(Boolean).length
          const primaryFormat = hasVideo ? 'Video' : hasPdf ? 'PDF' : hasText ? 'Texto' : 'Sem material'
          const actionLabel = hasVideo ? 'Abrir video e materiais' : hasPdf ? 'Abrir PDF e leitura' : hasText ? 'Ler modulo' : 'Conteudo indisponivel'
          const modulePreview = module.textContent
            ? module.textContent.slice(0, 110) + (module.textContent.length > 110 ? '...' : '')
            : null

          return (
            <View key={module.id} style={[styles.moduleCard, status === 'current' && styles.moduleCardCurrent]}>
              <View style={styles.moduleHeader}>
                <Text style={styles.moduleTitle}>Modulo {module.id}: {module.title}</Text>
                <View style={[styles.statusPill, status === 'completed' ? styles.statusPillDone : status === 'current' ? styles.statusPillCurrent : styles.statusPillUpcoming]}>
                  <Text style={[styles.statusPillText, status === 'completed' ? styles.statusPillTextDone : status === 'current' ? styles.statusPillTextCurrent : styles.statusPillTextUpcoming]}>
                    {status === 'completed' ? 'Concluido' : status === 'current' ? 'Recomendado' : 'Depois deste'}
                  </Text>
                </View>
              </View>

              <Text style={styles.moduleDescription}>{module.description ?? 'Sem descricao detalhada.'}</Text>
              <Text style={styles.moduleMeta}>Duracao: {module.duration}</Text>

              <View style={styles.moduleSummaryCard}>
                <View style={styles.moduleSummaryItem}>
                  <Text style={styles.moduleSummaryLabel}>Material principal</Text>
                  <Text style={styles.moduleSummaryValue}>{primaryFormat}</Text>
                </View>
                <View style={styles.moduleSummaryItem}>
                  <Text style={styles.moduleSummaryLabel}>Formatos</Text>
                  <Text style={styles.moduleSummaryValue}>
                    {formatCount === 0 ? '0 publicados' : `${formatCount} publicado${formatCount > 1 ? 's' : ''}`}
                  </Text>
                </View>
              </View>

              <View style={styles.contentTags}>
                <ContentTag label="Video" active={hasVideo} />
                <ContentTag label="PDF" active={hasPdf} />
                <ContentTag label="Texto" active={hasText} />
              </View>

              {modulePreview ? <Text style={styles.modulePreview}>{modulePreview}</Text> : null}

              {status === 'upcoming' ? <Text style={styles.moduleHint}>Conclua o modulo recomendado antes de avancar para este passo.</Text> : null}

              <View style={styles.moduleActions}>
                <TouchableOpacity
                  style={[styles.secondaryButton, !canOpenLesson && styles.disabledButton]}
                  onPress={() => openModule(module.id)}
                  disabled={!canOpenLesson}
                >
                  <Text style={styles.secondaryButtonText}>{status === 'current' ? actionLabel : 'Rever conteudo'}</Text>
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

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryChip}>
      <Text style={styles.summaryChipLabel}>{label}</Text>
      <Text style={styles.summaryChipValue}>{value}</Text>
    </View>
  )
}

function ContentTag({ label, active }: { label: string, active: boolean }) {
  return (
    <View style={[styles.contentTag, active ? styles.contentTagActive : styles.contentTagInactive]}>
      <Text style={[styles.contentTagText, active ? styles.contentTagTextActive : styles.contentTagTextInactive]}>
        {active ? label : `Sem ${label.toLowerCase()}`}
      </Text>
    </View>
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
    color: colors.textMuted,
    fontSize: 15
  },
  summaryMeta: {
    color: colors.textMuted,
    fontSize: 14
  },
  summaryDescription: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.border
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary
  },
  progressText: {
    color: colors.textMuted,
    fontSize: 14
  },
  primaryButton: {
    marginTop: 4,
    borderRadius: 18,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  guidanceCard: {
    borderRadius: 24,
    backgroundColor: colors.surfaceMuted,
    padding: 18,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  guidanceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  guidanceCopy: {
    flex: 1,
    gap: 4
  },
  guidanceTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800'
  },
  guidanceText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21
  },
  mixCard: {
    borderRadius: 24,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  mixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  summaryChip: {
    minWidth: '47%',
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4
  },
  summaryChipLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  summaryChipValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800'
  },
  mixHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20
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
    padding: 18,
    gap: 10
  },
  moduleCardCurrent: {
    borderWidth: 1,
    borderColor: colors.primary
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'flex-start'
  },
  moduleTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    flex: 1
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  statusPillDone: {
    backgroundColor: '#DCFCE7'
  },
  statusPillCurrent: {
    backgroundColor: colors.primarySoft
  },
  statusPillUpcoming: {
    backgroundColor: '#E2E8F0'
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800'
  },
  statusPillTextDone: {
    color: '#166534'
  },
  statusPillTextCurrent: {
    color: colors.primary
  },
  statusPillTextUpcoming: {
    color: colors.textMuted
  },
  moduleDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21
  },
  moduleMeta: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700'
  },
  moduleSummaryCard: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    gap: 10
  },
  moduleSummaryItem: {
    flex: 1,
    gap: 2
  },
  moduleSummaryLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  moduleSummaryValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800'
  },
  contentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  contentTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  contentTagActive: {
    backgroundColor: colors.primarySoft
  },
  contentTagInactive: {
    backgroundColor: '#E2E8F0'
  },
  contentTagText: {
    fontSize: 12,
    fontWeight: '700'
  },
  contentTagTextActive: {
    color: colors.primary
  },
  contentTagTextInactive: {
    color: colors.textMuted
  },
  modulePreview: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20
  },
  moduleHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19
  },
  moduleActions: {
    flexDirection: 'row',
    gap: 10
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700'
  },
  primarySmallButton: {
    borderRadius: 16,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primarySmallButtonText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '800'
  },
  disabledButton: {
    opacity: 0.45
  }
})

