import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
        showAlert('Sessao expirada', 'Faca login novamente.')
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
        error: normalizeErrorMessage(error, 'Nao foi possivel carregar vagas agora.')
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
        showAlert('Sessao expirada', 'Faca login novamente.')
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
        return
      }

      setApplyingJobId(jobId)
      try {
        await apiService.applyToJob(jobId, state.userCode)
        showAlert('Candidatura enviada', 'A sua candidatura foi registada com sucesso.')
      } catch (error) {
        showAlert('Erro ao candidatar', normalizeErrorMessage(error, 'Nao foi possivel enviar a candidatura.'))
      } finally {
        setApplyingJobId(null)
      }
    },
    [navigation, state.userCode]
  )

  const summaryText = useMemo(() => {
    if (state.jobs.length === 0) {
      return 'Ainda nao ha vagas disponiveis. Vale a pena voltar mais tarde e manter o seu percurso atualizado.'
    }

    if (state.source === 'matching') {
      return `${state.jobs.length} oportunidade${state.jobs.length > 1 ? 's' : ''} com melhor afinidade para o seu perfil e percurso atual.`
    }

    return `${state.jobs.length} vaga${state.jobs.length > 1 ? 's' : ''} geral${state.jobs.length > 1 ? 'is' : ''} exibida${state.jobs.length > 1 ? 's' : ''} enquanto o matching automatico nao estiver disponivel.`
  }, [state.jobs.length, state.source])

  return (
    <AppShell
      navigation={navigation}
      activeRoute="Jobs"
      title="Vagas compativeis"
      subtitle="Veja oportunidades que combinam com a sua formacao e candidate-se com confianca."
      refreshing={refreshing}
      onRefresh={() => void loadJobs('refresh')}
    >
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconWrap}>
          <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryTitle}>Leitura rapida</Text>
          <Text style={styles.summaryText}>{summaryText}</Text>
        </View>
      </View>

      {state.source === 'all' ? (
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
          <Text style={styles.infoBannerText}>Mostramos vagas gerais porque o matching automatico nao esteve disponivel agora.</Text>
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
          <Text style={styles.emptyTitle}>Ainda nao existem vagas disponiveis</Text>
          <Text style={styles.emptySubtitle}>Volte mais tarde ou use a area de apoio se precisar de orientacao sobre os proximos passos.</Text>
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

              <Text style={styles.jobCompany}>{job.employer?.name ?? 'Empresa nao informada'}</Text>

              <View style={styles.metaChips}>
                <MetaChip icon="location-outline" label={job.location} />
                <MetaChip icon="document-text-outline" label={job.contract_type} />
                {job.salary_range ? <MetaChip icon="cash-outline" label={job.salary_range} /> : null}
              </View>

              {sharedSkills.length > 0 ? (
                <View style={styles.skillCallout}>
                  <Text style={styles.skillCalloutTitle}>Porque combina consigo</Text>
                  <Text style={styles.skillsText}>{sharedSkills}</Text>
                </View>
              ) : null}

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

function MetaChip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <Text style={styles.metaChipText}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  summaryCard: {
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start'
  },
  summaryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryCopy: {
    flex: 1,
    gap: 4
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  summaryText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19
  },
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
    gap: 10,
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
  metaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  metaChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600'
  },
  skillCallout: {
    borderRadius: 18,
    backgroundColor: colors.infoSoft,
    padding: 14,
    gap: 4
  },
  skillCalloutTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800'
  },
  skillsText: {
    color: colors.info,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600'
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20
  },
  applyButton: {
    marginTop: 2,
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
