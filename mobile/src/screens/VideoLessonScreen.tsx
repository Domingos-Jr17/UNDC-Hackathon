import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Video, ResizeMode } from 'expo-av'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../types/navigation'
import apiService, { AggregatedProgress, CourseModule } from '../services/api'
import sessionService from '../services/session'

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
  const videoRef = useRef<Video>(null)
  const [state, setState] = useState<VideoState>(initialState)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const loadData = useCallback(async (): Promise<void> => {
    try {
      const userCode = await sessionService.getUserCode()
      if (!userCode) {
        navigation.navigate('Login')
        return
      }

      const [modules, progress] = await Promise.all([
        apiService.getCourseModules(courseId),
        apiService.getAggregatedProgress(userCode)
      ])

      const module = modules.find(item => String(item.id) === moduleId) ?? null
      setState({
        userCode,
        module,
        progress
      })
    } catch (error) {
      Alert.alert('Erro', (error as Error).message)
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
      Alert.alert('Vídeo indisponível', 'Este módulo ainda não possui vídeo publicado.')
      return
    }

    if (isPlaying) {
      void videoRef.current?.pauseAsync()
    } else {
      void videoRef.current?.playAsync()
    }
    setIsPlaying(!isPlaying)
  }

  const handleDownload = (): void => {
    if (!state.module?.downloadable || !state.module?.videoUrl) {
      Alert.alert('Offline indisponivel', 'Este conteudo nao possui pacote offline no momento.')
      return
    }

    Alert.alert(
      'Offline indisponível',
      'Pacote offline não disponível para este módulo no backend atual.'
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

    try {
      setSubmitting(true)
      await apiService.updateProgress(state.userCode, courseId, [...completed], percentage)
      Alert.alert('Concluido', 'Modulo marcado como concluido com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    } catch (error) {
      Alert.alert('Erro', (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Modulo {moduleId}</Text>
      </View>

      <View style={styles.videoWrapper}>
        {state.module.videoUrl ? (
          <Video
            ref={videoRef}
            source={{ uri: state.module.videoUrl }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={status => {
              if (status.isLoaded) {
                setIsPlaying(status.isPlaying ?? false)
              }
            }}
          />
        ) : (
          <View style={styles.videoUnavailable}>
            <Text style={styles.videoUnavailableText}>Vídeo ainda não publicado para este módulo.</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.moduleTitle}>{state.module.title}</Text>
        <Text style={styles.moduleMeta}>Duracao: {state.module.duration}</Text>
        <Text style={styles.moduleDescription}>{state.module.description ?? 'Sem descricao adicional.'}</Text>

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
            {isCompleted ? 'Modulo ja concluido' : submitting ? 'Salvando...' : 'Marcar como concluido'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quizButton}
          onPress={() => navigation.navigate('Quiz', { courseId, moduleId: String(state.module?.id ?? moduleId) })}
        >
          <Text style={styles.quizButtonText}>Fazer Quiz deste módulo</Text>
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
    paddingBottom: 18
  },
  backButton: {
    color: '#90CAF9',
    fontSize: 15,
    marginBottom: 8
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700'
  },
  videoWrapper: {
    backgroundColor: '#000000',
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden'
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24
  },
  moduleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827'
  },
  moduleMeta: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 13
  },
  moduleDescription: {
    marginTop: 10,
    color: '#374151',
    lineHeight: 19
  },
  actionsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontWeight: '700'
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  disabledButton: {
    opacity: 0.65
  },
  quizButton: {
    marginTop: 10,
    backgroundColor: '#047857',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center'
  },
  quizButtonText: {
    color: '#FFFFFF',
    fontWeight: '700'
  }
})
