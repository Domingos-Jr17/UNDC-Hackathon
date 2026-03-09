import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types/navigation'
import apiService, { AggregatedProgress, CourseItem } from '../services/api'
import sessionService from '../services/session'

type CourseLibraryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CourseLibrary'>

interface CourseLibraryScreenProps {
  navigation: CourseLibraryScreenNavigationProp
}

interface CourseWithProgress extends CourseItem {
  progress: number
  currentModule: number
}

export default function CourseLibraryScreen({ navigation }: CourseLibraryScreenProps) {
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [progress, setProgress] = useState<AggregatedProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async (): Promise<void> => {
    try {
      const userCode = await sessionService.getUserCode()
      if (!userCode) {
        navigation.navigate('Login')
        return
      }

      const [coursesResult, progressResult] = await Promise.all([
        apiService.getCourses(),
        apiService.getAggregatedProgress(userCode)
      ])

      setCourses(coursesResult)
      setProgress(progressResult)
    } catch (error) {
      Alert.alert('Erro', (error as Error).message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigation])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    void loadData()
  }, [loadData])

  const courseCards = useMemo<CourseWithProgress[]>(() => {
    const byId = new Map(progress?.courses.map(item => [item.courseId, item]) ?? [])
    return courses.map(course => {
      const progressItem = byId.get(course.id)
      return {
        ...course,
        progress: progressItem?.progress ?? 0,
        currentModule: progressItem?.currentModule ?? 1
      }
    })
  }, [courses, progress])

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Biblioteca de Cursos</Text>
      </View>

      <View style={styles.content}>
        {courseCards.map(course => (
          <TouchableOpacity
            key={course.id}
            style={styles.card}
            onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
          >
            <Text style={styles.title}>{course.title}</Text>
            <Text style={styles.subtitle}>{course.instructor ?? 'Equipe Tecnica WIRA'}</Text>
            <Text style={styles.meta}>
              Nivel: {course.level} • Modulos: {course.modules_count} • Duracao: {course.duration_hours}h
            </Text>
            <Text style={styles.description}>{course.description ?? 'Curso profissional com certificacao.'}</Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {course.progress}% completo • modulo atual {course.currentModule}
            </Text>
          </TouchableOpacity>
        ))}
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
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  backButton: {
    color: '#90CAF9',
    fontSize: 15,
    marginBottom: 8
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700'
  },
  content: {
    padding: 20,
    gap: 12
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A'
  },
  subtitle: {
    marginTop: 4,
    color: '#4B5563',
    fontSize: 14
  },
  meta: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 12
  },
  description: {
    marginTop: 10,
    color: '#374151',
    fontSize: 13,
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
    fontSize: 12,
    fontWeight: '600'
  }
})
