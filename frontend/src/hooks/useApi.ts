import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  apiService,
  ApiError,
  User,
  DashboardStats,
  Activity,
  Course,
  CourseModule,
  UsersPageResult,
  CertificateRecord,
  Employer,
  Job,
  JobMatch,
  JobApplication,
  FollowUpCheckin,
  Alert
} from '../services/api'

interface UseApiOptions {
  dependencies?: unknown[]
  staleTime?: number
  enabled?: boolean
}

interface BaseUseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  updatedAt: number | null
}

interface UseApiState<T> extends BaseUseApiState<T> {
  refetch: () => Promise<void>
}

interface CacheEntry<T> {
  data: T
  updatedAt: number
}

const DEFAULT_STALE_TIME = 60_000
const apiCache = new Map<string, CacheEntry<unknown>>()
const inFlightRequests = new Map<string, Promise<unknown>>()

const isCacheFresh = (updatedAt: number, staleTime: number): boolean =>
  Date.now() - updatedAt < staleTime

const getCacheEntry = <T,>(cacheKey: string): CacheEntry<T> | null => {
  const entry = apiCache.get(cacheKey)
  return entry ? (entry as CacheEntry<T>) : null
}

export function invalidateApiCache(
  matcher?: string | string[] | ((cacheKey: string) => boolean)
): void {
  if (!matcher) {
    apiCache.clear()
    inFlightRequests.clear()
    return
  }

  const shouldDelete = typeof matcher === 'function'
    ? matcher
    : (cacheKey: string) => Array.isArray(matcher) ? matcher.includes(cacheKey) : cacheKey === matcher

  Array.from(apiCache.keys()).forEach(cacheKey => {
    if (shouldDelete(cacheKey)) {
      apiCache.delete(cacheKey)
      inFlightRequests.delete(cacheKey)
    }
  })
}

export function useApi<T>(
  cacheKey: string,
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiState<T> {
  const {
    dependencies = [],
    staleTime = DEFAULT_STALE_TIME,
    enabled = true
  } = options

  const [state, setState] = useState<BaseUseApiState<T>>(() => {
    const cached = enabled ? getCacheEntry<T>(cacheKey) : null
    return {
      data: cached?.data ?? null,
      loading: enabled ? !cached : false,
      error: null,
      updatedAt: cached?.updatedAt ?? null
    }
  })

  const fetchData = useCallback(async ({
    force = false,
    background = false
  }: {
    force?: boolean
    background?: boolean
  } = {}): Promise<void> => {
    if (!enabled) {
      return
    }

    const cached = getCacheEntry<T>(cacheKey)
    if (!force && cached && isCacheFresh(cached.updatedAt, staleTime)) {
      setState({
        data: cached.data,
        loading: false,
        error: null,
        updatedAt: cached.updatedAt
      })
      return
    }

    if (!background) {
      setState(prev => ({
        ...prev,
        loading: prev.data === null || force,
        error: null
      }))
    }

    let request = (!force ? inFlightRequests.get(cacheKey) : undefined) as Promise<T> | undefined

    if (!request) {
      const pendingRequest = apiCall()
        .then(result => {
          const entry: CacheEntry<T> = {
            data: result,
            updatedAt: Date.now()
          }
          apiCache.set(cacheKey, entry)
          return result
        })
        .finally(() => {
          if (inFlightRequests.get(cacheKey) === pendingRequest) {
            inFlightRequests.delete(cacheKey)
          }
        })

      inFlightRequests.set(cacheKey, pendingRequest)
      request = pendingRequest
    }

    try {
      const result = await request
      const entry = getCacheEntry<T>(cacheKey)

      setState({
        data: result,
        loading: false,
        error: null,
        updatedAt: entry?.updatedAt ?? Date.now()
      })
    } catch (error) {
      setState(prev => ({
        data: prev.data,
        loading: false,
        error: (error as Error).message,
        updatedAt: prev.updatedAt
      }))
      throw error
    }
  }, [apiCall, cacheKey, enabled, staleTime, ...dependencies])

  const refetch = useCallback(async () => {
    await fetchData({ force: true })
  }, [fetchData])

  useEffect(() => {
    if (!enabled) {
      setState({
        data: null,
        loading: false,
        error: null,
        updatedAt: null
      })
      return
    }

    const cached = getCacheEntry<T>(cacheKey)
    if (cached) {
      setState({
        data: cached.data,
        loading: false,
        error: null,
        updatedAt: cached.updatedAt
      })

      if (!isCacheFresh(cached.updatedAt, staleTime)) {
        void fetchData({ background: true })
      }
      return
    }

    setState({
      data: null,
      loading: true,
      error: null,
      updatedAt: null
    })
    void fetchData()
  }, [cacheKey, enabled, staleTime, fetchData])

  return {
    ...state,
    refetch
  }
}

const toFrontendUser = (payload: {
  anonymousCode: string
  ngoId: string
  role: 'VICTIM' | 'STAFF' | 'ADMIN'
  createdAt: string
  email?: string
  realName?: string
}): User => ({
  id: payload.anonymousCode,
  anonymousCode: payload.anonymousCode,
  ngoId: payload.ngoId,
  role: payload.role,
  status: 'Ativo',
  lastActivity: new Date().toISOString(),
  coursesCompleted: 0,
  certificatesEarned: 0,
  totalProgress: 0,
  createdAt: payload.createdAt
})

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const bootstrapAuth = async (): Promise<void> => {
      const rawUser = localStorage.getItem('wira_user')
      const rawToken = localStorage.getItem('wira_token')

      if (!rawUser || !rawToken) {
        localStorage.removeItem('wira_user')
        localStorage.removeItem('wira_token')
        setLoading(false)
        return
      }

      try {
        const payload = await apiService.validateSession()
        const mapped = toFrontendUser(payload.user)
        setUser(mapped)
        setIsAuthenticated(true)
        localStorage.setItem('wira_user', JSON.stringify(mapped))
      } catch {
        localStorage.removeItem('wira_user')
        localStorage.removeItem('wira_token')
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    void bootstrapAuth()
  }, [])

  const login = useCallback(async (code: string): Promise<boolean> => {
    try {
      setLoading(true)
      invalidateApiCache()
      const normalizedCode = code.trim().toUpperCase()
      const payload = await apiService.authenticateUser(normalizedCode)
      const mapped = toFrontendUser(payload.user)
      setUser(mapped)
      setIsAuthenticated(true)
      localStorage.setItem('wira_user', JSON.stringify(mapped))
      toast.success(`Login realizado com sucesso para ${payload.user.anonymousCode}`)
      return true
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Falha ao autenticar')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const staffLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      invalidateApiCache()
      const payload = await apiService.authenticateStaff(email, password)
      const mapped = toFrontendUser(payload.user)
      setUser(mapped)
      setIsAuthenticated(true)
      localStorage.setItem('wira_user', JSON.stringify(mapped))
      toast.success(`Bem-vinda/o ${payload.user.anonymousCode}`)
      return true
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Falha ao autenticar equipa')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    invalidateApiCache()
    try {
      await apiService.logout()
    } catch {
      // Session cleanup must continue even if logout fails server-side.
    }
    localStorage.removeItem('wira_user')
    localStorage.removeItem('wira_token')
    setUser(null)
    setIsAuthenticated(false)
    toast.info('Sessão encerrada')
  }, [])

  return {
    user,
    isAuthenticated,
    loading,
    login,
    staffLogin,
    logout
  }
}

export function useDashboardStats() {
  return useApi<DashboardStats>('dashboard-stats', () => apiService.getDashboardStats(), {
    staleTime: 60_000
  })
}

export function useRecentActivity() {
  return useApi<Activity[]>('recent-activity', () => apiService.getRecentActivity(), {
    staleTime: 45_000
  })
}

export function useUsers(filters?: {
  status?: string
  page?: number
  pageSize?: number
  search?: string
  ngoId?: string
}) {
  return useApi<UsersPageResult>(
    `users:${filters?.status ?? 'all'}:${filters?.page ?? 1}:${filters?.pageSize ?? 50}:${filters?.search ?? ''}:${filters?.ngoId ?? ''}`,
    () => apiService.getUsers(filters),
    {
      dependencies: [filters?.status, filters?.page, filters?.pageSize, filters?.search, filters?.ngoId],
      staleTime: 60_000
    }
  )
}

export function useUserDetails(userId: string) {
  return useApi<User>(
    `user-details:${userId}`,
    () => apiService.getUserDetails(userId),
    {
      dependencies: [userId],
      enabled: Boolean(userId),
      staleTime: 60_000
    }
  )
}

export function useUserCertificates(userId: string) {
  return useApi<CertificateRecord[]>(
    `user-certificates:${userId}`,
    () => apiService.getUserCertificates(userId),
    {
      dependencies: [userId],
      enabled: Boolean(userId),
      staleTime: 60_000
    }
  )
}

export function useCourses() {
  return useApi<Course[]>('courses', () => apiService.getCourses(), {
    staleTime: 5 * 60_000
  })
}

export function useCourseModules(courseId: string) {
  return useApi<CourseModule[]>(
    `course-modules:${courseId}`,
    () => apiService.getCourseModules(courseId),
    {
      dependencies: [courseId],
      enabled: Boolean(courseId),
      staleTime: 5 * 60_000
    }
  )
}

export function useUserActivation() {
  const [loading, setLoading] = useState(false)
  const toIsoDate = (value: string): string => {
    const [day, month, year] = value.split('/')
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toISOString()
  }

  const activateUser = useCallback(async (userData: {
    realName: string
    ngoId: string
    dateOfBirth: string
    initialSkills?: string
    phone?: string
    location?: string
  }) => {
    setLoading(true)
    try {
      const payload = {
        ...userData,
        dateOfBirth: toIsoDate(userData.dateOfBirth)
      }
      const user = await apiService.activateUser(payload)
      invalidateApiCache(cacheKey =>
        cacheKey === 'dashboard-stats' ||
        cacheKey === 'recent-activity' ||
        cacheKey.startsWith('users:')
      )
      toast.success('Beneficiária activada com sucesso')
      return user
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Falha ao activar beneficiária')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const generateCode = useCallback(async () => {
    setLoading(true)
    try {
      const code = await apiService.generateUserCode()
      toast.success('Código gerado com sucesso')
      return code
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Falha ao gerar código')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const sendSMS = useCallback(async (code: string, phoneNumber: string) => {
    setLoading(true)
    try {
      const sms = await apiService.sendSMSCode(code, phoneNumber)
      toast.success(`SMS enviado via ${sms.provider}`)
      return sms
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Falha ao enviar SMS')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    activateUser,
    generateCode,
    sendSMS
  }
}

export function useApiHealth() {
  const state = useApi<boolean>('api-health', () => apiService.testConnection(), {
    staleTime: 2 * 60_000
  })

  return {
    isHealthy: state.data,
    lastCheck: state.updatedAt ? new Date(state.updatedAt) : null,
    checkHealth: state.refetch
  }
}

export function useEmployers(filters?: { status?: string; ngoId?: string; active?: boolean }) {
  return useApi<Employer[]>(
    `employers:${filters?.status ?? 'all'}:${filters?.ngoId ?? ''}:${filters?.active ?? 'all'}`,
    () => apiService.getEmployers(filters),
    {
      dependencies: [filters?.status, filters?.ngoId, filters?.active],
      staleTime: 60_000
    }
  )
}

export function useJobsAdmin(filters?: { status?: string; ngoId?: string; employerId?: string; location?: string }) {
  return useApi<Job[]>(
    `jobs-admin:${filters?.status ?? 'all'}:${filters?.ngoId ?? ''}:${filters?.employerId ?? ''}:${filters?.location ?? ''}`,
    () => apiService.getJobsAdmin(filters),
    {
      dependencies: [filters?.status, filters?.ngoId, filters?.employerId, filters?.location],
      staleTime: 60_000
    }
  )
}

export function useMatches(filters?: { jobId?: string; anonymousCode?: string; status?: string }) {
  return useApi<JobMatch[]>(
    `matches:${filters?.jobId ?? ''}:${filters?.anonymousCode ?? ''}:${filters?.status ?? 'all'}`,
    () => apiService.getMatches(filters),
    {
      dependencies: [filters?.jobId, filters?.anonymousCode, filters?.status],
      staleTime: 45_000
    }
  )
}

export function useApplications(filters?: { status?: string; jobId?: string; anonymousCode?: string }) {
  return useApi<JobApplication[]>(
    `applications:${filters?.status ?? 'all'}:${filters?.jobId ?? ''}:${filters?.anonymousCode ?? ''}`,
    () => apiService.getApplications(filters),
    {
      dependencies: [filters?.status, filters?.jobId, filters?.anonymousCode],
      staleTime: 45_000
    }
  )
}

export function useCheckins(filters?: { status?: string; channel?: string; jobApplicationId?: number; anonymousCode?: string }) {
  return useApi<FollowUpCheckin[]>(
    `checkins:${filters?.status ?? 'all'}:${filters?.channel ?? 'all'}:${filters?.jobApplicationId ?? ''}:${filters?.anonymousCode ?? ''}`,
    () => apiService.getCheckins(filters),
    {
      dependencies: [filters?.status, filters?.channel, filters?.jobApplicationId, filters?.anonymousCode],
      staleTime: 45_000
    }
  )
}

export function useAlerts(filters?: { status?: string; severity?: string; ngoId?: string; anonymousCode?: string }) {
  return useApi<Alert[]>(
    `alerts:${filters?.status ?? 'all'}:${filters?.severity ?? 'all'}:${filters?.ngoId ?? ''}:${filters?.anonymousCode ?? ''}`,
    () => apiService.getAlerts(filters),
    {
      dependencies: [filters?.status, filters?.severity, filters?.ngoId, filters?.anonymousCode],
      staleTime: 45_000
    }
  )
}
