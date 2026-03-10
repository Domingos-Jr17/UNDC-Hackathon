import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import AppShell from '../components/AppShell'
import { RootStackParamList } from '../types/navigation'
import apiService, { JobRecord } from '../services/api'
import sessionService from '../services/session'
import { showAlert } from '../utils/alerts'
import { colors, shadows } from '../theme'

type JobsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Jobs'>

interface JobsScreenProps {
  navigation: JobsScreenNavigationProp
}

type JobSource = 'matching' | 'all'

interface JobsState {
  userCode: string
  jobs: JobRecord[]
  source: JobSource
  error: string | null
}

const initialState: JobsState = {
  userCode: '',
  jobs: [],
  source: 'matching',
  error: null
}

const normalizeErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    const message = error.message.trim()
    if (message.length > 0 && !message.startsWith('HTTP')) {
      return message
    }
  }
  return fallback
}

export default function JobsScreen({ navigation }: JobsScreenProps) {
  const [state, setState] = useState<JobsState>(initialState)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null)

  const loadJobs = useCallback(async (mode: 'initial' | 'refresh' = 'initial'): Promise<void> => {
    if (mode === 'initial') {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      const userCode = await sessionService.getUserCode()
      if (!userCode) {
        showAlert('Sessão expirada', 'Faça login novamente.')
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
        return
      }

      try {
        const jobs = await apiService.getJobMatching(userCode)
        setState({ userCode, jobs, source: 'matching', error: null })
      } catch {
        const jobs = await apiService.getJobs()
        setState({ userCode, jobs, source: 'all', error: null })
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        jobs: [],
        source: 'all',
        error: normalizeErrorMessage(error, 'Não foi possível carregar vagas agora.')
      }))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigation])

  useEffect(() => {
    void loadJobs('initial')
  }, [loadJobs])

  const handleApply = useCallback(
    async (jobId: string): Promise<void> => {
      if (!state.userCode) {
        showAlert('Sessão expirada', 'Faça login novamente.')
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
        return
      }

      setApplyingJobId(jobId)
      try {
        await apiService.applyToJob(jobId, state.userCode)
        showAlert('Candidatura enviada', 'A sua candidatura foi registada com sucesso.')
      } catch (error) {
        showAlert('Erro ao candidatar', normalizeErrorMessage(error, 'Não foi possível enviar a candidatura.'))
      } finally {
        setApplyingJobId(null)
      }
    },
    [navigation, state.userCode]
  )

  return (
    <AppShell
      navigation={navigation}
      activeRoute="Jobs"
      title="Vagas compatíveis"
      subtitle="Veja oportunidades que combinam com a sua formação e candidate-se com confiança."
      refreshing={refreshing}
      onRefresh={() => void loadJobs('refresh')}
    >
      {state.source === 'all' ? (
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
          <Text style={styles.infoBannerText}>Mostramos vagas gerais porque o matching automático não esteve disponível agora.</Text>
        </View>
      ) : null}

      {state.error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : state.jobs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Ainda não existem vagas disponíveis</Text>
          <Text style={styles.emptySubtitle}>Volte mais tarde ou use a área de apoio se precisar de orientação.</Text>
        </View>
      ) : (
        state.jobs.map(job => {
          const sharedSkills = job.matching?.sharedSkills.join(', ') ?? ''
          const isApplying = applyingJobId === job.id
          return (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                {typeof job.matching?.score === 'number' ? (
                  <View style={styles.matchPill}>
                    <Text style={styles.matchPillText}>{job.matching.score}% fit</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.jobCompany}>{job.employer?.name ?? 'Empresa não informada'}</Text>
              <Text style={styles.jobMeta}>Local: {job.location}</Text>
              <Text style={styles.jobMeta}>Contrato: {job.contract_type}</Text>
              {job.salary_range ? <Text style={styles.jobMeta}>Salário: {job.salary_range}</Text> : null}
              {job.schedule ? <Text style={styles.jobMeta}>Horário: {job.schedule}</Text> : null}
              {sharedSkills.length > 0 ? <Text style={styles.skillsText}>Competências em comum: {sharedSkills}</Text> : null}
              <Text style={styles.description}>{job.description}</Text>

              <TouchableOpacity
                style={[styles.applyButton, isApplying && styles.applyButtonDisabled]}
                onPress={() => {
                  void handleApply(job.id)
                }}
                disabled={isApplying}
              >
                <Ionicons name="send-outline" size={18} color={colors.textOnPrimary} />
                <Text style={styles.applyButtonText}>{isApplying ? 'A enviar...' : 'Candidatar-me'}</Text>
              </TouchableOpacity>
            </View>
          )
        })
      )}
    </AppShell>
  )
}

const styles = StyleSheet.create({
  infoBanner: {
    borderRadius: 22,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: '#F2D29A',
    padding: 16,
    flexDirection: 'row',
    gap: 10,
    ...shadows.card
  },
  infoBannerText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19
  },
  errorBanner: {
    borderRadius: 22,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: '#F5C0C0',
    padding: 16,
    flexDirection: 'row',
    gap: 10,
    ...shadows.card
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48
  },
  emptyCard: {
    borderRadius: 26,
    backgroundColor: colors.surface,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21
  },
  jobCard: {
    borderRadius: 26,
    backgroundColor: colors.surface,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 7,
    ...shadows.card
  },
  jobHeader: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  jobTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 19,
    fontWeight: '800'
  },
  matchPill: {
    borderRadius: 999,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  matchPillText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '800'
  },
  jobCompany: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700'
  },
  jobMeta: {
    color: colors.textMuted,
    fontSize: 13
  },
  skillsText: {
    marginTop: 4,
    color: colors.info,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600'
  },
  description: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20
  },
  applyButton: {
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  applyButtonDisabled: {
    opacity: 0.65
  },
  applyButtonText: {
    color: colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '800'
  }
})
