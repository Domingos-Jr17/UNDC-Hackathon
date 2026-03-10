import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import AppShell from '../components/AppShell'
import { RootStackParamList } from '../types/navigation'
import apiService, { AggregatedProgress } from '../services/api'
import sessionService from '../services/session'
import { showAlert } from '../utils/alerts'
import { colors, shadows } from '../theme'

export default function ProgressScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [progress, setProgress] = useState<AggregatedProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadProgress = useCallback(async (mode: 'initial' | 'refresh' = 'initial'): Promise<void> => {
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

      const aggregated = await apiService.getAggregatedProgress(userCode)
      setProgress(aggregated)
    } catch (error) {
      showAlert('Erro', (error as Error).message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigation])

  useEffect(() => {
    void loadProgress('initial')
  }, [loadProgress])

  const nextCourse = useMemo(
    () => progress?.courses.find(course => course.progress > 0 && course.progress < 100),
    [progress]
  )

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <AppShell
      navigation={navigation}
      activeRoute="Progress"
      title="O seu progresso"
      subtitle="Veja o que já avançou e qual curso merece a sua atenção agora."
      refreshing={refreshing}
      onRefresh={() => void loadProgress('refresh')}
    >
      {nextCourse ? (
        <TouchableOpacity
          style={styles.recommendationCard}
          onPress={() => navigation.navigate('CourseDetail', { courseId: nextCourse.courseId })}
        >
          <View style={styles.recommendationIconWrap}>
            <Ionicons name="trending-up-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.recommendationCopy}>
            <Text style={styles.recommendationTitle}>Melhor próximo passo</Text>
            <Text style={styles.recommendationText}>
              Retome {nextCourse.title}: está em {nextCourse.progress}% e no módulo {nextCourse.currentModule}.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}

      <View style={styles.statsRow}>
        <ProgressStat label="Cursos" value={progress?.summary.totalCourses ?? 0} />
        <ProgressStat label="Ativos" value={progress?.summary.activeCourses ?? 0} />
        <ProgressStat label="Média" value={`${progress?.summary.averageProgress ?? 0}%`} />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Detalhes por curso</Text>
        {(progress?.courses ?? []).length === 0 ? (
          <Text style={styles.emptyText}>Ainda não há cursos em progresso. Explore a biblioteca para começar.</Text>
        ) : (
          (progress?.courses ?? []).map(course => (
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

              <Text style={styles.courseMeta}>Módulo atual: {course.currentModule}/{course.modulesCount}</Text>
              <Text style={styles.courseMeta}>Módulos concluídos: {course.completedModules.length}</Text>
              <Text style={styles.courseMeta}>
                Última atividade: {course.lastActivity ? new Date(course.lastActivity).toLocaleDateString('pt-PT') : 'Sem atividade'}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </AppShell>
  )
}

function ProgressStat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  recommendationCard: {
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...shadows.card
  },
  recommendationIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  recommendationCopy: {
    flex: 1,
    gap: 4
  },
  recommendationTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  recommendationText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  statCard: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: colors.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.card
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800'
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4
  },
  sectionCard: {
    borderRadius: 28,
    backgroundColor: colors.surface,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
    ...shadows.card
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800'
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21
  },
  courseCard: {
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    padding: 16,
    gap: 8
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  courseTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  coursePercentage: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800'
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.surface
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary
  },
  courseMeta: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18
  }
})
