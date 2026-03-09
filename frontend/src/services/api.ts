import { getApiBaseUrl } from '../utils/portDetector'

const STATIC_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  requiresAuth?: boolean
  retryOnAuthError?: boolean
}

type ErrorPayload = {
  error?: string
  message?: string
}

interface LoginPayload {
  success: boolean
  token: string
  user: {
    anonymousCode: string
    ngoId: string
    role: 'VICTIM' | 'STAFF' | 'ADMIN'
    createdAt: string
    email?: string
    realName?: string
  }
  expiresIn: string
}

interface DashboardStatsEnvelope {
  success: boolean
  stats: DashboardStats
}

interface RecentActivityEnvelope {
  success: boolean
  activity: Activity[]
}

interface UsersEnvelope {
  success: boolean
  users: User[]
}

interface UserDetailEnvelope {
  success: boolean
  user: User
}

interface GenerateCodeEnvelope {
  success: boolean
  code: string
}

interface ActivateUserEnvelope {
  success: boolean
  user: User
}

interface SmsEnvelope {
  success: boolean
  mode: string
  sms: {
    id: string
    to: string
    message: string
    sentAt: string
    provider: string
  }
}

interface VerifyCertificateEnvelope {
  success: boolean
  valid: boolean
  certificate?: {
    anonymousCode: string
    courseTitle: string
    date: string
    score: number
  }
}

class ApiError extends Error {
  public status: number
  public code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

class ApiService {
  private baseURL: string
  private timeout: number
  private refreshPromise: Promise<string | null> | null = null

  constructor(baseURL: string = STATIC_API_URL, timeout: number = 10000) {
    this.baseURL = baseURL
    this.timeout = timeout
  }

  private async resolveBaseUrl(): Promise<string> {
    if (this.baseURL !== STATIC_API_URL) {
      return this.baseURL
    }

    try {
      return await getApiBaseUrl()
    } catch {
      return this.baseURL
    }
  }

  private getToken(): string | null {
    return localStorage.getItem('wira_token')
  }

  private setToken(token: string): void {
    localStorage.setItem('wira_token', token)
  }

  private clearToken(): void {
    localStorage.removeItem('wira_token')
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const text = await response.text()
    if (!text) {
      return {} as T
    }
    return JSON.parse(text) as T
  }

  private async refreshToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    const token = this.getToken()
    if (!token) {
      return null
    }

    this.refreshPromise = (async () => {
      const baseUrl = await this.resolveBaseUrl()
      const response = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        this.clearToken()
        return null
      }

      const parsed = await this.parseResponse<{ token?: string }>(response)
      if (!parsed.token) {
        this.clearToken()
        return null
      }

      this.setToken(parsed.token)
      return parsed.token
    })()

    try {
      return await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      requiresAuth = true,
      retryOnAuthError = true
    } = options

    const baseUrl = await this.resolveBaseUrl()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      const token = this.getToken()
      if (requiresAuth && token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method,
        signal: controller.signal,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      })

      if (response.status === 401 && requiresAuth && retryOnAuthError) {
        const refreshed = await this.refreshToken()
        if (refreshed) {
          return this.request<T>(endpoint, {
            ...options,
            retryOnAuthError: false
          })
        }
      }

      const parsed = await this.parseResponse<T | ErrorPayload>(response)
      if (!response.ok) {
        const payload = parsed as ErrorPayload
        throw new ApiError(payload.error ?? payload.message ?? `HTTP ${response.status}`, response.status)
      }

      return parsed as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Timeout de requisicao', 408, 'TIMEOUT')
      }

      throw new ApiError((error as Error).message ?? 'Erro de rede', 500, 'NETWORK_ERROR')
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async authenticateUser(code: string): Promise<LoginPayload> {
    const payload = await this.request<LoginPayload>('/api/auth/login', {
      method: 'POST',
      body: { code },
      requiresAuth: false
    })
    this.setToken(payload.token)
    return payload
  }

  async authenticateStaff(email: string, password: string): Promise<LoginPayload> {
    const payload = await this.request<LoginPayload>('/api/auth/staff/login', {
      method: 'POST',
      body: { email, password },
      requiresAuth: false
    })
    this.setToken(payload.token)
    return payload
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const payload = await this.request<DashboardStatsEnvelope>('/api/dashboard/stats')
    return payload.stats
  }

  async getRecentActivity(): Promise<Activity[]> {
    const payload = await this.request<RecentActivityEnvelope>('/api/dashboard/activity')
    return payload.activity
  }

  async getUsers(filters?: { status?: string; limit?: number; offset?: number }): Promise<User[]> {
    const query = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : ''
    const payload = await this.request<UsersEnvelope>(`/api/users${query}`)
    return payload.users
  }

  async getUserDetails(userId: string): Promise<User> {
    const payload = await this.request<UserDetailEnvelope>(`/api/users/${userId}`)
    return payload.user
  }

  async activateUser(userData: {
    realName: string
    ngoId: string
    dateOfBirth: string
    initialSkills?: string
  }): Promise<User> {
    const payload = await this.request<ActivateUserEnvelope>('/api/users/activate', {
      method: 'POST',
      body: userData
    })
    return payload.user
  }

  async generateUserCode(): Promise<string> {
    const payload = await this.request<GenerateCodeEnvelope>('/api/users/generate-code', {
      method: 'POST'
    })
    return payload.code
  }

  async sendSMSCode(code: string, phoneNumber?: string): Promise<SmsEnvelope['sms']> {
    const payload = await this.request<SmsEnvelope>('/api/sms/send', {
      method: 'POST',
      body: {
        phoneNumber,
        message: `Seu codigo de acesso WIRA: ${code}`
      }
    })
    return payload.sms
  }

  async getCourses(): Promise<Course[]> {
    const payload = await this.request<{ success: boolean; courses: Course[] }>('/api/courses', {
      requiresAuth: false
    })
    return payload.courses
  }

  async getCourseProgress(userId: string): Promise<unknown> {
    return this.request(`/api/users/${userId}/progress`)
  }

  async getCertificates(userId: string): Promise<unknown> {
    return this.request(`/api/users/${userId}/certificates`)
  }

  async verifyCertificate(code: string): Promise<VerifyCertificateEnvelope> {
    return this.request<VerifyCertificateEnvelope>(`/api/certificates/verify/${encodeURIComponent(code)}`)
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/health', {
        requiresAuth: false,
        retryOnAuthError: false
      })
      return true
    } catch {
      return false
    }
  }

  async testConnection(): Promise<boolean> {
    return this.healthCheck()
  }
}

export const apiService = new ApiService()

export interface User {
  id: string
  anonymousCode: string
  ngoId: string
  role?: 'VICTIM' | 'STAFF' | 'ADMIN'
  status: 'Ativo' | 'Inativo'
  lastActivity: string
  coursesCompleted: number
  certificatesEarned: number
  totalProgress: number
  createdAt?: string
  progress?: Array<{
    courseId: string
    courseTitle: string
    percentage: number
    currentModule: number
    lastActivity: string
  }>
  certificates?: Array<{
    id: string
    code: string
    courseTitle: string
    issueDate: string
    score: number
  }>
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  coursesCompleted: number
  certificatesIssued: number
  averageCompletionTime: number
}

export interface Activity {
  id: number
  user: string
  action: string
  time: string
}

export interface Course {
  id: string
  title: string
  description?: string
  instructor?: string
  duration_hours: number
  modules_count: number
  level: string
  skills?: string
}

export interface CertificateVerification {
  success: boolean
  valid: boolean
  certificate?: {
    anonymousCode: string
    courseTitle: string
    date: string
    score: number
  }
}

export { ApiError }
