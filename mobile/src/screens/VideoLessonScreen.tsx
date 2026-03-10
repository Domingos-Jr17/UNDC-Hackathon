import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
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

interface VideoState {
  userCode: string
  module: CourseModule | null
  progress: AggregatedProgress | null
}

const initialState: VideoState = {
  userCode: '',
  module: null,
  progress: null
}

export default function VideoLessonScreen({ route, navigation }: VideoLessonScreenProps) {
  const { courseId, moduleId } = route.params
  const [state, setState] = useState<VideoState>(initialState)
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

  const togglePlayPause = (): void => {
    if (!state.module?.videoUrl) {
      showAlert('Vídeo indisponível', 'Este módulo ainda não possui vídeo publicado.')
      return
    }

    if (isPlaying) {
      videoPlayer.pause()
    } else {
      videoPlayer.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleDownload = (): void => {
    if (!state.module?.downloadable || !state.module?.videoUrl) {
      showAlert('Offline indisponível', 'Este conteúdo não possui pacote offline no momento.')
      return
    }

    showAlert(
      'Offline indisponível',
      'O pacote offline ainda não está disponível no backend actual.'
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
      showAlert('Concluído', 'Módulo marcado como concluído com sucesso.', [
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
        <Text style={styles.errorText}>Módulo não encontrado.</Text>
      </View>
    )
  }

  const isCompleted = (progressItem?.completedModules ?? []).includes(String(state.module.id))

  return (
    <AppShell
      navigation={navigation}
      activeRoute="CourseLibrary"
      title={`Módulo ${moduleId}`}
      subtitle="Assista com calma, conclua o passo actual e avance para a avaliação quando fizer sentido."
      showBottomNav={false}
      showLogout={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={18} color={colors.primaryDark} />
        <Text style={styles.backButtonText}>Voltar para o curso</Text>
      </TouchableOpacity>

      <View style={styles.videoWrapper}>
        {state.module.videoUrl ? (
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
            <Text style={styles.videoUnavailableText}>Vídeo ainda não publicado para este módulo.</Text>
          </View>
        )}
      </View>

      <View style={styles.contentCard}>
        <Text style={styles.moduleTitle}>{state.module.title}</Text>
        <Text style={styles.moduleMeta}>Duração: {state.module.duration}</Text>
        <Text style={styles.moduleDescription}>{state.module.description ?? 'Sem descrição adicional.'}</Text>

        <View style={styles.guidanceCard}>
          <Ionicons name="bulb-outline" size={18} color={colors.primary} />
          <Text style={styles.guidanceText}>
            Assista primeiro ao conteúdo principal e marque como concluído apenas quando terminar este passo com segurança.
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={togglePlayPause}>
            <Text style={styles.secondaryButtonText}>{isPlaying ? 'Pausar' : 'Reproduzir'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleDownload}>
            <Text style={styles.secondaryButtonText}>Offline</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, (submitting || isCompleted) && styles.disabledButton]}
          onPress={() => {
            void handleComplete()
          }}
          disabled={submitting || isCompleted}
        >
          <Text style={styles.primaryButtonText}>
            {isCompleted ? 'Módulo já concluído' : submitting ? 'A guardar...' : 'Marcar como concluído'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quizButton}
          onPress={() => navigation.navigate('Quiz', { courseId, moduleId: String(state.module?.id ?? moduleId) })}
        >
          <Text style={styles.quizButtonText}>Fazer quiz deste módulo</Text>
        </TouchableOpacity>
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
  videoWrapper: {
    backgroundColor: '#000000',
    borderRadius: 24,
    overflow: 'hidden',
    ...shadows.card
  },
  video: {
    width: '100%',
    height: 220
  },
  videoUnavailable: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  videoUnavailableText: {
    color: '#E5E7EB',
    textAlign: 'center'
  },
  contentCard: {
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 12,
    ...shadows.card
  },
  moduleTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text
  },
  moduleMeta: {
    color: colors.textMuted,
    fontSize: 13
  },
  moduleDescription: {
    color: colors.textMuted,
    lineHeight: 20
  },
  guidanceCard: {
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    padding: 14,
    flexDirection: 'row',
    gap: 10
  },
  guidanceText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '800'
  },
  primaryButton: {
    marginTop: 2,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontWeight: '800'
  },
  disabledButton: {
    opacity: 0.65
  },
  quizButton: {
    backgroundColor: colors.success,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center'
  },
  quizButtonText: {
    color: colors.textOnPrimary,
    fontWeight: '800'
  }
})
