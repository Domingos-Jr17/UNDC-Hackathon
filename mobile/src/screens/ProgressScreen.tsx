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

  const completedCourses = progress?.courses.filter(course => course.progress >= 100).length ?? 0

  const guidanceText = useMemo(() => {
    if (!nextCourse) {
      return 'Ainda nao existe um curso em andamento. Explore a biblioteca e comece um percurso que faca sentido para si.'
    }

    const remainingModules = Math.max(0, nextCourse.modulesCount - nextCourse.currentModule)
    return remainingModules > 0
      ? `Retome ${nextCourse.title}. Faltam ${remainingModules} modulo${remainingModules > 1 ? 's' : ''} apos o modulo atual para concluir este percurso.`
      : `Esta muito perto de concluir ${nextCourse.title}. Falta validar os ultimos passos para desbloquear o certificado.`
  }, [nextCourse])

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
      subtitle="Veja o que ja avancou e qual curso merece a sua atencao agora."
      refreshing={refreshing}
      onRefresh={() => void loadProgress('refresh')}
    >
      <View style={styles.guidanceCard}>
        <View style={styles.guidanceIconWrap}>
          <Ionicons name="trail-sign-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.guidanceCopy}>
          <Text style={styles.guidanceTitle}>Leitura rapida</Text>
          <Text style={styles.guidanceText}>{guidanceText}</Text>
        </View>
      </View>

      {nextCourse ? (
        <TouchableOpacity
          style={styles.recommendationCard}
          onPress={() => navigation.navigate('CourseDetail', { courseId: nextCourse.courseId })}
        >
          <View style={styles.recommendationIconWrap}>
            <Ionicons name="trending-up-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.recommendationCopy}>
            <Text style={styles.recommendationTitle}>Melhor proximo passo</Text>
            <Text style={styles.recommendationText}>
              Retome {nextCourse.title}: esta em {nextCourse.progress}% e no modulo {nextCourse.currentModule}.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}

      <View style={styles.statsRow}>
        <ProgressStat label="Cursos" value={progress?.summary.totalCourses ?? 0} />
        <ProgressStat label="Ativos" value={progress?.summary.activeCourses ?? 0} />
        <ProgressStat label="Concluidos" value={completedCourses} />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Detalhes por curso</Text>
        {(progress?.courses ?? []).length === 0 ? (
          <Text style={styles.emptyText}>Ainda nao ha cursos em progresso. Explore a biblioteca para comecar.</Text>
        ) : (
          (progress?.courses ?? []).map(course => {
            const needsAttention = course.progress > 0 && course.progress < 35

            return (
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

                <Text style={styles.courseMeta}>Modulo atual: {course.currentModule}/{course.modulesCount}</Text>
                <Text style={styles.courseMeta}>Modulos concluidos: {course.completedModules.length}</Text>
                <Text style={styles.courseMeta}>
                  Ultima atividade: {course.lastActivity ? new Date(course.lastActivity).toLocaleDateString('pt-PT') : 'Sem atividade'}
                </Text>
                <View style={[styles.courseHintPill, needsAttention ? styles.courseHintAttention : styles.courseHintNormal]}>
                  <Text style={[styles.courseHintText, needsAttention ? styles.courseHintAttentionText : styles.courseHintNormalText]}>
                    {needsAttention ? 'Precisa de retoma' : course.progress >= 100 ? 'Percurso concluido' : 'Ritmo consistente'}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })
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
  guidanceCard: {
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  },
  courseHintPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4
  },
  courseHintAttention: {
    backgroundColor: colors.warningSoft
  },
  courseHintNormal: {
    backgroundColor: colors.successSoft
  },
  courseHintText: {
    fontSize: 12,
    fontWeight: '800'
  },
  courseHintAttentionText: {
    color: colors.warning
  },
  courseHintNormalText: {
    color: colors.success
  }
})
