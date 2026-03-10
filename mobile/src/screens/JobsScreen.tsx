import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types/navigation'
import apiService, { JobRecord } from '../services/api'
import sessionService from '../services/session'
import { showAlert } from '../utils/alerts'

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

  const loadJobs = useCallback(async (): Promise<void> => {
    try {
      const userCode = await sessionService.getUserCode()
      if (!userCode) {
        showAlert('Sessao expirada', 'Faca login novamente.')
        navigation.navigate('Login')
        return
      }

      try {
        const jobs = await apiService.getJobMatching(userCode)
        setState({
          userCode,
          jobs,
          source: 'matching',
          error: null
        })
      } catch {
        const jobs = await apiService.getJobs()
        setState({
          userCode,
          jobs,
          source: 'all',
          error: null
        })
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
    void loadJobs()
  }, [loadJobs])

  const onRefresh = useCallback((): void => {
    setRefreshing(true)
    void loadJobs()
  }, [loadJobs])

  const handleApply = useCallback(
    async (jobId: string): Promise<void> => {
      if (!state.userCode) {
        showAlert('Sessao expirada', 'Faca login novamente.')
        navigation.navigate('Login')
        return
      }

      setApplyingJobId(jobId)
      try {
        await apiService.applyToJob(jobId, state.userCode)
        showAlert('Candidatura enviada', 'Sua candidatura foi registrada com sucesso.')
      } catch (error) {
        showAlert(
          'Erro ao candidatar',
          normalizeErrorMessage(error, 'Não foi possível enviar a candidatura.')
        )
      } finally {
        setApplyingJobId(null)
      }
    },
    [navigation, state.userCode]
  )

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Vagas Compativeis</Text>
      </View>

      {state.source === 'all' ? (
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>Mostrando vagas gerais (matching indisponivel no momento).</Text>
        </View>
      ) : null}

      {state.error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : state.jobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Sem vagas disponiveis</Text>
          <Text style={styles.emptySubtitle}>Tente novamente mais tarde.</Text>
        </View>
      ) : (
        <View style={styles.jobsContainer}>
          {state.jobs.map(job => {
            const sharedSkills = job.matching?.sharedSkills.join(', ') ?? ''
            const isApplying = applyingJobId === job.id

            return (
              <View key={job.id} style={styles.jobCard}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobCompany}>{job.employer?.name ?? 'Empresa não informada'}</Text>
                <Text style={styles.jobMeta}>Local: {job.location}</Text>
                <Text style={styles.jobMeta}>Contrato: {job.contract_type}</Text>

                {job.salary_range ? <Text style={styles.jobMeta}>Salario: {job.salary_range}</Text> : null}
                {job.schedule ? <Text style={styles.jobMeta}>Horario: {job.schedule}</Text> : null}

                {typeof job.matching?.score === 'number' ? (
                  <Text style={styles.matchText}>Matching: {job.matching.score}%</Text>
                ) : null}

                {sharedSkills.length > 0 ? (
                  <Text style={styles.skillsText}>Skills em comum: {sharedSkills}</Text>
                ) : null}

                <Text style={styles.description}>{job.description}</Text>

                <TouchableOpacity
                  style={[styles.applyButton, isApplying && styles.applyButtonDisabled]}
                  onPress={() => {
                    void handleApply(job.id)
                  }}
                  disabled={isApplying}
                >
                  <Text style={styles.applyButtonText}>{isApplying ? 'Enviando...' : 'Candidatar-se'}</Text>
                </TouchableOpacity>
              </View>
            )
          })}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    backgroundColor: '#1E3A8A',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24
  },
  backButton: {
    color: '#90CAF9',
    fontSize: 16,
    marginBottom: 8
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold'
  },
  infoBanner: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFB300',
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    padding: 12
  },
  infoBannerText: {
    color: '#8D6E63',
    fontSize: 13
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderColor: '#E53935',
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    padding: 12
  },
  errorText: {
    color: '#B71C1C',
    fontSize: 13
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48
  },
  emptyContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20
  },
  emptyTitle: {
    color: '#1E3A8A',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6
  },
  emptySubtitle: {
    color: '#616161',
    fontSize: 14
  },
  jobsContainer: {
    padding: 20,
    gap: 12
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16
  },
  jobTitle: {
    color: '#1E3A8A',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6
  },
  jobCompany: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600'
  },
  jobMeta: {
    color: '#4B5563',
    fontSize: 13,
    marginBottom: 4
  },
  matchText: {
    color: '#0D9488',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6
  },
  skillsText: {
    color: '#4338CA',
    fontSize: 13,
    marginTop: 4
  },
  description: {
    color: '#374151',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8
  },
  applyButton: {
    marginTop: 14,
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center'
  },
  applyButtonDisabled: {
    opacity: 0.65
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  }
})
