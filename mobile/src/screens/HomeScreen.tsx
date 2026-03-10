import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import AppShell from '../components/AppShell'
import { RootStackParamList } from '../types/navigation'
import apiService, { AggregatedProgress, CertificateRecord, ProgressCourse } from '../services/api'
import sessionService from '../services/session'
import { showAlert } from '../utils/alerts'
import { colors, shadows } from '../theme'

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp
}

interface HomeState {
  userCode: string
  progress: AggregatedProgress | null
  certificates: CertificateRecord[]
}

const emptyState: HomeState = {
  userCode: '',
  progress: null,
  certificates: []
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [state, setState] = useState<HomeState>(emptyState)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadHome = useCallback(async (mode: 'initial' | 'refresh' = 'initial'): Promise<void> => {
    if (mode === 'initial') {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      const userCode = await sessionService.getUserCode()
      if (!userCode) {
        showAlert('Sessão expirada', 'Faça login novamente para continuar.')
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
        return
      }

      const [progress, certificates] = await Promise.all([
        apiService.getAggregatedProgress(userCode),
        apiService.getUserCertificates(userCode)
      ])

      setState({
        userCode,
        progress,
        certificates
      })
    } catch (error) {
      showAlert('Erro', (error as Error).message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigation])

  useEffect(() => {
    void loadHome('initial')
  }, [loadHome])

  useFocusEffect(
    useCallback(() => {
      if (state.userCode) {
        void loadHome('refresh')
      }
    }, [loadHome, state.userCode])
  )

  const currentCourse: ProgressCourse | undefined = state.progress?.courses.find(
    course => course.progress > 0 && course.progress < 100
  ) ?? state.progress?.courses[0]

  const stats = useMemo(() => ({
    coursesCompleted: state.progress?.courses.filter(course => course.progress >= 100).length ?? 0,
    coursesInProgress: state.progress?.courses.filter(course => course.progress > 0 && course.progress < 100).length ?? 0,
    certificatesEarned: state.certificates.length,
    totalHours: Math.round((state.progress?.summary.averageProgress ?? 0) * 0.4)
  }), [state.certificates.length, state.progress])

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
      activeRoute="Home"
      headerVariant="hero"
      title={`Olá, ${state.userCode}!`}
      subtitle="Hoje o foco é retomar o próximo passo da sua jornada de aprendizagem."
      refreshing={refreshing}
      onRefresh={() => void loadHome('refresh')}
    >
      <View style={styles.recommendationCard}>
        <View style={styles.recommendationHeader}>
          <Text style={styles.sectionEyebrow}>Próximo passo</Text>
          {currentCourse ? (
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{currentCourse.progress}% concluído</Text>
            </View>
          ) : null}
        </View>

        {currentCourse ? (
          <>
            <Text style={styles.recommendationTitle}>{currentCourse.title}</Text>
            <Text style={styles.recommendationText}>
              Continue no módulo {currentCourse.currentModule} de {currentCourse.modulesCount}. Cada sessão concluída aproxima-a do certificado final.
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${currentCourse.progress}%` }]} />
            </View>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => navigation.navigate('CourseDetail', { courseId: currentCourse.courseId })}
            >
              <Ionicons name="play-circle-outline" size={20} color={colors.textOnPrimary} />
              <Text style={styles.primaryActionText}>Continuar aprendizagem</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.recommendationTitle}>Escolha o seu primeiro curso</Text>
            <Text style={styles.recommendationText}>
              Explore a biblioteca e inicie uma jornada de capacitação profissional ao seu ritmo.
            </Text>
            <TouchableOpacity style={styles.primaryAction} onPress={() => navigation.navigate('CourseLibrary')}>
              <Ionicons name="book-outline" size={20} color={colors.textOnPrimary} />
              <Text style={styles.primaryActionText}>Ver cursos disponíveis</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Concluídos" value={stats.coursesCompleted} icon="checkmark-circle" />
        <StatCard label="Em curso" value={stats.coursesInProgress} icon="sparkles" />
        <StatCard label="Certificados" value={stats.certificatesEarned} icon="ribbon" />
        <StatCard label="Horas" value={`${stats.totalHours}h`} icon="time" />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Atalhos úteis</Text>
        <View style={styles.quickActions}>
          <QuickAction
            icon="ribbon-outline"
            title="Os meus certificados"
            subtitle="Veja certificados emitidos e validações."
            onPress={() => navigation.navigate('Certificate', { courseId: currentCourse?.courseId ?? 'costura' })}
          />
          <QuickAction
            icon="chatbubble-ellipses-outline"
            title="Falar com apoio"
            subtitle="Peça ajuda se tiver dúvidas sobre acesso ou percurso."
            onPress={() => navigation.navigate('Support')}
          />
        </View>
      </View>
    </AppShell>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function QuickAction({ title, subtitle, icon, onPress }: { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <View style={styles.quickActionIconWrap}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.quickActionCopy}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
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
    borderRadius: 28,
    backgroundColor: colors.surface,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    ...shadows.card
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  sectionEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  progressBadge: {
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  progressBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700'
  },
  recommendationTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800'
  },
  recommendationText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary
  },
  primaryAction: {
    marginTop: 6,
    borderRadius: 18,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  primaryActionText: {
    color: colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },
  statCard: {
    width: '48%',
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadows.card
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
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
  quickActions: {
    gap: 12
  },
  quickActionCard: {
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  quickActionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickActionCopy: {
    flex: 1,
    gap: 3
  },
  quickActionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800'
  },
  quickActionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18
  }
})
