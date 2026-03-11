import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { VideoView, useVideoPlayer } from 'expo-video'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import AppShell from '../components/AppShell'
import { RootStackParamList } from '../types/navigation'
import apiService, { AggregatedProgress, CourseModule } from '../services/api'
import sessionService from '../services/session'
import { showAlert } from '../utils/alerts'
import { colors, shadows } from '../theme'

type VideoLessonScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VideoLesson'>
type VideoLessonScreenRouteProp = RouteProp<RootStackParamList, 'VideoLesson'>

interface VideoLessonScreenProps {
  route: VideoLessonScreenRouteProp
  navigation: VideoLessonScreenNavigationProp
}

interface LessonState {
  userCode: string
  module: CourseModule | null
  progress: AggregatedProgress | null
}

const initialState: LessonState = {
  userCode: '',
  module: null,
  progress: null
}

export default function VideoLessonScreen({ route, navigation }: VideoLessonScreenProps) {
  const { courseId, moduleId } = route.params
  const [state, setState] = useState<LessonState>(initialState)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoSource, setVideoSource] = useState<string | null>(null)

  const videoPlayer = useVideoPlayer(videoSource ? { uri: videoSource } : null, player => {
    player.loop = false
  })

  const loadData = useCallback(async (): Promise<void> => {
    try {
      const userCode = await sessionService.getUserCode()
      if (!userCode) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
        return
      }

      const [modules, progress] = await Promise.all([
        apiService.getCourseModules(courseId),
        apiService.getAggregatedProgress(userCode)
      ])

      const module = modules.find(item => String(item.id) === moduleId) ?? null
      setVideoSource(module?.videoUrl ?? null)
      setIsPlaying(false)
      setState({
        userCode,
        module,
        progress
      })
    } catch (error) {
      showAlert('Erro', (error as Error).message)
    } finally {
      setLoading(false)
    }
  }, [courseId, moduleId, navigation])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const progressItem = useMemo(
    () => state.progress?.courses.find(item => item.courseId === courseId),
    [state.progress, courseId]
  )

  const contentOrder = useMemo(() => {
    if (!state.module) return [] as string[]

    const steps: string[] = []
    if (state.module.videoUrl) steps.push('Veja o video principal')
    if (state.module.pdfUrl) steps.push('Abra o PDF para apoio detalhado')
    if (state.module.textContent) steps.push('Leia o resumo guiado do modulo')
    return steps
  }, [state.module])

  const togglePlayPause = (): void => {
    if (!state.module?.videoUrl) {
      showAlert('Sem video', 'Este modulo nao tem video publicado. Use o texto ou o PDF, se estiverem disponiveis.')
      return
    }

    if (isPlaying) {
      videoPlayer.pause()
    } else {
      videoPlayer.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleOpenPdf = async (): Promise<void> => {
    const pdfUrl = state.module?.pdfUrl
    if (!pdfUrl) {
      showAlert('Sem PDF', 'Este modulo nao tem PDF publicado.')
      return
    }

    try {
      const supported = await Linking.canOpenURL(pdfUrl)
      if (!supported) {
        showAlert('Ligacao invalida', 'Nao foi possivel abrir o PDF deste modulo.')
        return
      }
      await Linking.openURL(pdfUrl)
    } catch (error) {
      showAlert('Erro', (error as Error).message)
    }
  }

  const handleDownload = (): void => {
    if (!state.module?.downloadable || (!state.module.videoUrl && !state.module.pdfUrl)) {
      showAlert('Offline indisponivel', 'Este conteudo nao possui pacote offline no momento.')
      return
    }

    showAlert(
      'Offline indisponivel',
      'O pacote offline ainda nao esta disponivel no backend actual.'
    )
  }

  const handleComplete = async (): Promise<void> => {
    if (!state.module || !state.userCode) {
      return
    }

    const completed = new Set(progressItem?.completedModules ?? [])
    completed.add(String(state.module.id))

    const totalModules = progressItem?.modulesCount ?? Math.max(state.module.id, completed.size)
    const percentage = Math.min(100, Math.round((completed.size / totalModules) * 100))
    const completedNumbers = [...completed].map(value => Number(value)).filter(value => !Number.isNaN(value))
    const currentModule = completedNumbers.length > 0 ? Math.max(...completedNumbers) : 1

    try {
      setSubmitting(true)
      await apiService.updateProgress(state.userCode, courseId, [...completed], percentage, { currentModule })
      showAlert('Concluido', 'Modulo marcado como concluido com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    } catch (error) {
      showAlert('Erro', (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!state.module) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>Modulo nao encontrado.</Text>
      </View>
    )
  }

  const isCompleted = (progressItem?.completedModules ?? []).includes(String(state.module.id))
  const hasVideo = Boolean(state.module.videoUrl)
  const hasPdf = Boolean(state.module.pdfUrl)
  const hasText = Boolean(state.module.textContent)
  const hasAnyMaterial = hasVideo || hasPdf || hasText || Boolean(state.module.description)
  const primaryFormat = hasVideo ? 'Video' : hasPdf ? 'PDF' : hasText ? 'Texto' : 'Sem material publicado'

  return (
    <AppShell
      navigation={navigation}
      activeRoute="CourseLibrary"
      title={`Modulo ${moduleId}`}
      subtitle="Use o formato principal deste modulo e os restantes como apoio, quando existirem."
      showBottomNav={false}
      showLogout={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={18} color={colors.primaryDark} />
        <Text style={styles.backButtonText}>Voltar para o curso</Text>
      </TouchableOpacity>

      <View style={styles.videoWrapper}>
        {hasVideo ? (
          <VideoView
            player={videoPlayer}
            style={styles.video}
            nativeControls
            contentFit="contain"
            allowsFullscreen
            allowsPictureInPicture
          />
        ) : (
          <View style={styles.videoUnavailable}>
            <Ionicons name="document-text-outline" size={26} color={colors.primary} />
            <Text style={styles.videoUnavailableTitle}>Conteudo sem video</Text>
            <Text style={styles.videoUnavailableText}>
              Este modulo foi publicado noutro formato. Consulte o texto e o PDF abaixo, se estiverem disponiveis.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.contentCard}>
        <Text style={styles.moduleTitle}>{state.module.title}</Text>
        <Text style={styles.moduleMeta}>Duracao: {state.module.duration}</Text>
        <Text style={styles.moduleDescription}>{state.module.description ?? 'Sem descricao adicional.'}</Text>

        <View style={styles.overviewCard}>
          <View style={styles.overviewHead}>
            <Text style={styles.overviewLabel}>Material principal</Text>
            <Text style={styles.overviewValue}>{primaryFormat}</Text>
          </View>

          <View style={styles.formatRow}>
            <FormatBadge label="Video" active={hasVideo} />
            <FormatBadge label="PDF" active={hasPdf} />
            <FormatBadge label="Texto" active={hasText} />
          </View>

          {contentOrder.length > 0 ? (
            <View style={styles.sequenceCard}>
              <Text style={styles.sequenceTitle}>Ordem sugerida</Text>
              {contentOrder.map((step, index) => (
                <View key={step} style={styles.sequenceItem}>
                  <View style={styles.sequenceIndex}>
                    <Text style={styles.sequenceIndexText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.sequenceText}>{step}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionCard, !hasVideo && styles.disabledButton]} onPress={togglePlayPause}>
            <Ionicons name="play-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.actionTitle}>{isPlaying ? 'Pausar video' : 'Ver video'}</Text>
            <Text style={styles.actionText}>{hasVideo ? 'Abrir o material audiovisual principal.' : 'Nao ha video neste modulo.'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, !hasPdf && styles.disabledButton]} onPress={() => void handleOpenPdf()}>
            <Ionicons name="document-attach-outline" size={20} color={colors.primary} />
            <Text style={styles.actionTitle}>Abrir PDF</Text>
            <Text style={styles.actionText}>{hasPdf ? 'Consultar apoio detalhado e referencia.' : 'Nao ha PDF neste modulo.'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.guidanceCard}>
          <Ionicons name="bulb-outline" size={18} color={colors.primary} />
          <Text style={styles.guidanceText}>
            Marque como concluido apenas depois de terminar o material principal deste modulo com seguranca.
          </Text>
        </View>

        {hasText ? (
          <View style={styles.textCard}>
            <Text style={styles.textCardTitle}>Texto do modulo</Text>
            <Text style={styles.textCardBody}>{state.module.textContent}</Text>
          </View>
        ) : null}

        {!hasAnyMaterial ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Material ainda nao publicado</Text>
            <Text style={styles.emptyStateText}>
              Este modulo existe no percurso, mas ainda nao tem video, PDF ou texto publicado.
            </Text>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.secondaryButton, (!state.module.downloadable || (!hasVideo && !hasPdf)) && styles.disabledButton]} onPress={handleDownload}>
            <Text style={styles.secondaryButtonText}>Offline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, (submitting || isCompleted) && styles.disabledButton]}
            onPress={() => {
              void handleComplete()
            }}
            disabled={submitting || isCompleted}
          >
            <Text style={styles.primaryButtonText}>
              {isCompleted ? 'Modulo ja concluido' : submitting ? 'A guardar...' : 'Marcar como concluido'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.quizButton}
          onPress={() => navigation.navigate('Quiz', { courseId, moduleId: String(state.module?.id ?? moduleId) })}
        >
          <Text style={styles.quizButtonText}>Fazer quiz deste modulo</Text>
        </TouchableOpacity>
      </View>
    </AppShell>
  )
}

function FormatBadge({ label, active }: { label: string, active: boolean }) {
  return (
    <View style={[styles.formatBadge, active ? styles.formatBadgeActive : styles.formatBadgeInactive]}>
      <Text style={[styles.formatBadgeText, active ? styles.formatBadgeTextActive : styles.formatBadgeTextInactive]}>
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
  videoWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  video: {
    width: '100%',
    height: 240,
    backgroundColor: '#08101d'
  },
  videoUnavailable: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24
  },
  videoUnavailableTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800'
  },
  videoUnavailableText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20
  },
  contentCard: {
    borderRadius: 30,
    backgroundColor: colors.surface,
    padding: 22,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  moduleTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800'
  },
  moduleMeta: {
    color: colors.textMuted,
    fontSize: 14
  },
  moduleDescription: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22
  },
  overviewCard: {
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  overviewHead: {
    gap: 4
  },
  overviewLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  overviewValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800'
  },
  formatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  formatBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  formatBadgeActive: {
    backgroundColor: colors.primarySoft
  },
  formatBadgeInactive: {
    backgroundColor: '#E2E8F0'
  },
  formatBadgeText: {
    fontSize: 12,
    fontWeight: '700'
  },
  formatBadgeTextActive: {
    color: colors.primary
  },
  formatBadgeTextInactive: {
    color: colors.textMuted
  },
  sequenceCard: {
    gap: 8
  },
  sequenceTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800'
  },
  sequenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  sequenceIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sequenceIndexText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '800'
  },
  sequenceText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 10
  },
  actionCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8
  },
  actionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800'
  },
  actionText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19
  },
  guidanceCard: {
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    padding: 16,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  guidanceText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21
  },
  textCard: {
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  textCardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800'
  },
  textCardBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22
  },
  emptyState: {
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    padding: 16,
    gap: 6
  },
  emptyStateTitle: {
    color: '#9A3412',
    fontSize: 15,
    fontWeight: '800'
  },
  emptyStateText: {
    color: '#9A3412',
    fontSize: 14,
    lineHeight: 20
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 14,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700'
  },
  primaryButton: {
    flex: 1.5,
    borderRadius: 18,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  quizButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    alignItems: 'center'
  },
  quizButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800'
  },
  disabledButton: {
    opacity: 0.45
  }
})
