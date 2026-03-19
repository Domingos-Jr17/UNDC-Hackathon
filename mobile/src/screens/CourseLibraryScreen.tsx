import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import AppShell from '../components/AppShell'
import { RootStackParamList } from '../types/navigation'
import apiService, { AggregatedProgress, CourseItem } from '../services/api'
import sessionService from '../services/session'
import { showAlert } from '../utils/alerts'
import { colors, shadows } from '../theme'

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

      const [coursesResult, progressResult] = await Promise.all([
        apiService.getCourses(),
        apiService.getAggregatedProgress(userCode)
      ])

      setCourses(coursesResult)
      setProgress(progressResult)
    } catch (error) {
      showAlert('Erro', (error as Error).message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigation])

  useEffect(() => {
    void loadData('initial')
  }, [loadData])

  const courseCards = useMemo<CourseWithProgress[]>(() => {
    const progressCourses = Array.isArray(progress?.courses) ? progress.courses : []
    const availableCourses = Array.isArray(courses) ? courses : []
    const byId = new Map(progressCourses.map(item => [item.courseId, item]))

    return availableCourses
      .map(course => {
        const progressItem = byId.get(course.id)
        return {
          ...course,
          progress: progressItem?.progress ?? 0,
          currentModule: progressItem?.currentModule ?? 1
        }
      })
      .sort((left, right) => {
        const leftActive = left.progress > 0 && left.progress < 100 ? 1 : 0
        const rightActive = right.progress > 0 && right.progress < 100 ? 1 : 0
        if (leftActive !== rightActive) return rightActive - leftActive
        return right.progress - left.progress
      })
  }, [courses, progress])

  const featuredCourse = courseCards.find(course => course.progress > 0 && course.progress < 100)

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
      activeRoute="CourseLibrary"
      title="Biblioteca de cursos"
      subtitle="Escolha o próximo conteúdo, retome módulos pendentes e acompanhe o seu ritmo."
      refreshing={refreshing}
      onRefresh={() => void loadData('refresh')}
    >
      {featuredCourse ? (
        <View style={styles.featuredCard}>
          <Text style={styles.featuredEyebrow}>Continue de onde ficou</Text>
          <Text style={styles.featuredTitle}>{featuredCourse.title}</Text>
          <Text style={styles.featuredText}>
            Está no módulo {featuredCourse.currentModule} e já concluiu {featuredCourse.progress}% desta formação.
          </Text>
          <TouchableOpacity
            style={styles.featuredButton}
            onPress={() => navigation.navigate('CourseDetail', { courseId: featuredCourse.id })}
          >
            <Ionicons name="play-circle-outline" size={20} color={colors.textOnPrimary} />
            <Text style={styles.featuredButtonText}>Retomar agora</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.listWrap}>
        {courseCards.map(course => (
          <TouchableOpacity
            key={course.id}
            style={styles.card}
            onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.title}>{course.title}</Text>
              <View style={[styles.levelPill, course.progress > 0 ? styles.levelPillActive : null]}>
                <Text style={[styles.levelPillText, course.progress > 0 ? styles.levelPillTextActive : null]}>{course.level}</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>{course.instructor ?? 'Equipa técnica WIRA'}</Text>
            <Text style={styles.meta}>
              {course.modules_count} módulos · {course.duration_hours}h
            </Text>
            <Text style={styles.description}>{course.description ?? 'Curso profissional com certificação.'}</Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {course.progress}% concluído · módulo atual {course.currentModule}
            </Text>
          </TouchableOpacity>
        ))}
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
  featuredCard: {
    borderRadius: 28,
    backgroundColor: colors.primary,
    padding: 20,
    gap: 10,
    ...shadows.card
  },
  featuredEyebrow: {
    color: '#CDE4F6',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  featuredTitle: {
    color: colors.textOnPrimary,
    fontSize: 24,
    fontWeight: '800'
  },
  featuredText: {
    color: '#DAECFA',
    fontSize: 14,
    lineHeight: 21
  },
  featuredButton: {
    marginTop: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8
  },
  featuredButtonText: {
    color: colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  listWrap: {
    gap: 14
  },
  card: {
    borderRadius: 26,
    backgroundColor: colors.surface,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    ...shadows.card
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text
  },
  levelPill: {
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  levelPillActive: {
    backgroundColor: colors.accentSoft
  },
  levelPillText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  levelPillTextActive: {
    color: colors.warning
  },
  subtitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600'
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19
  },
  progressTrack: {
    marginTop: 6,
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 999
  },
  progressText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700'
  }
})

