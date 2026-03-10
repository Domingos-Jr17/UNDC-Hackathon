import { useState, useEffect, useCallback } from 'react'
import { apiService, ApiError, User, DashboardStats, Activity, Course } from '../services/api'
import { toast } from 'sonner'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useApi<T>(apiCall: () => Promise<T>, dependencies: unknown[] = []): UseApiState<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => undefined
  })

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await apiCall()
      setState({
        data: result,
        loading: false,
        error: null,
        refetch: fetchData
      })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: (error as Error).message,
        refetch: fetchData
      })
    }
  }, dependencies)

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return state
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
    const raw = localStorage.getItem('wira_user')
    if (!raw) {
      setLoading(false)
      return
    }

    try {
      const parsed = JSON.parse(raw) as User
      setUser(parsed)
      setIsAuthenticated(true)
    } catch {
      localStorage.removeItem('wira_user')
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (code: string): Promise<boolean> => {
    try {
      setLoading(true)
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

  const logout = useCallback(() => {
    localStorage.removeItem('wira_user')
    localStorage.removeItem('wira_token')
    setUser(null)
    setIsAuthenticated(false)
    toast.info('Sessao encerrada')
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
  return useApi<DashboardStats>(() => apiService.getDashboardStats(), [])
}

export function useRecentActivity() {
  return useApi<Activity[]>(() => apiService.getRecentActivity(), [])
}

export function useUsers(filters?: { status?: string }) {
  return useApi<User[]>(
    () => apiService.getUsers(filters),
    [filters?.status]
  )
}

export function useUserDetails(userId: string) {
  return useApi<User>(() => apiService.getUserDetails(userId), [userId])
}

export function useCourses() {
  return useApi<Course[]>(() => apiService.getCourses(), [])
}

export function useUserActivation() {
  const [loading, setLoading] = useState(false)

  const activateUser = useCallback(async (userData: {
    realName: string
    ngoId: string
    dateOfBirth: string
    initialSkills?: string
    phone?: string
  }) => {
    setLoading(true)
    try {
      const user = await apiService.activateUser(userData)
      toast.success('Beneficiária activada com sucesso')
      return user
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Falha ao activar beneficiaria')
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
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkHealth = useCallback(async () => {
    const healthy = await apiService.testConnection()
    setIsHealthy(healthy)
    setLastCheck(new Date())
    return healthy
  }, [])

  useEffect(() => {
    void checkHealth()
    const interval = setInterval(() => {
      void checkHealth()
    }, 30000)

    return () => clearInterval(interval)
  }, [checkHealth])

  return { isHealthy, lastCheck, checkHealth }
}


