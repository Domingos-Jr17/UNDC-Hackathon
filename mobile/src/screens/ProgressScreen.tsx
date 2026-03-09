import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types/navigation'
import apiService, { AggregatedProgress } from '../services/api'
import sessionService from '../services/session'

export default function ProgressScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [progress, setProgress] = useState<AggregatedProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadProgress = useCallback(async (): Promise<void> => {
    const userCode = await sessionService.getUserCode()
    if (!userCode) {
      navigation.navigate('Login')
      return
    }

    const aggregated = await apiService.getAggregatedProgress(userCode)
    setProgress(aggregated)
  }, [navigation])

  useEffect(() => {
    const run = async (): Promise<void> => {
      try {
        setLoading(true)
        await loadProgress()
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [loadProgress])

  const onRefresh = useCallback(() => {
    const run = async (): Promise<void> => {
      try {
        setRefreshing(true)
        await loadProgress()
      } finally {
        setRefreshing(false)
      }
    }
    void run()
  }, [loadProgress])

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meu Progresso</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{progress?.summary.totalCourses ?? 0}</Text>
            <Text style={styles.statLabel}>Cursos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{progress?.summary.activeCourses ?? 0}</Text>
            <Text style={styles.statLabel}>Ativos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{progress?.summary.averageProgress ?? 0}%</Text>
            <Text style={styles.statLabel}>Média</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes por Curso</Text>
          {(progress?.courses ?? []).map(course => (
            <TouchableOpacity
              key={course.courseId}
              style={styles.courseCard}
              onPress={() => navigation.navigate('CourseDetail', { courseId: course.courseId })}
            >
              <View style={styles.courseHeader}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.coursePercentage}>{course.progress}%</Text>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
              </View>

              <Text style={styles.courseMeta}>
                Módulo atual: {course.currentModule}/{course.modulesCount}
              </Text>
              <Text style={styles.courseMeta}>
                Módulos concluídos: {course.completedModules.length}
              </Text>
              <Text style={styles.courseMeta}>
                Última atividade: {course.lastActivity ? new Date(course.lastActivity).toLocaleDateString() : 'Sem atividade'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB'
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  scrollView: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backButton: {
    fontSize: 24,
    color: '#374151'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827'
  },
  placeholder: {
    width: 24
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 12
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A8A'
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4
  },
  section: {
    padding: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1
  },
  coursePercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A'
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#1E3A8A'
  },
  courseMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2
  }
})
