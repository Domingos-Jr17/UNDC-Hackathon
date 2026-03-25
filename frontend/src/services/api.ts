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

interface ValidateSessionPayload {
  success: boolean
  valid: boolean
  user: {
    anonymousCode: string
    ngoId: string
    role: 'VICTIM' | 'STAFF' | 'ADMIN'
    createdAt: string
    email?: string
    realName?: string
  }
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
  pagination?: {
    total: number
    page: number
    pageSize: number
    limit: number
    offset: number
  }
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

interface SmsStatusEnvelope {
  success: boolean
  service: string
  status: string
  providerMode: string
  provider: string
  timestamp: string
}

interface CreateCourseEnvelope {
  success: boolean
  course: Course
}

interface EmployersEnvelope {
  success: boolean
  employers: Employer[]
}

interface EmployerEnvelope {
  success: boolean
  employer: Employer
}

interface JobsEnvelope {
  success: boolean
  jobs: Job[]
}

interface JobEnvelope {
  success: boolean
  job: Job
}

interface MatchesEnvelope {
  success: boolean
  matches: JobMatch[]
}

interface MatchEnvelope {
  success: boolean
  match: JobMatch
}

interface ApplicationsEnvelope {
  success: boolean
  applications: JobApplication[]
}

interface ApplicationEnvelope {
  success: boolean
  application: JobApplication
}

interface CheckinsEnvelope {
  success: boolean
  checkins: FollowUpCheckin[]
}

interface CheckinEnvelope {
  success: boolean
  checkin: FollowUpCheckin
}

interface AlertsEnvelope {
  success: boolean
  alerts: Alert[]
}

interface AlertEnvelope {
  success: boolean
  alert: Alert
}

export interface CourseModule {
  id: number
  title: string
  duration: string
  description?: string
  videoUrl?: string
  pdfUrl?: string
  textContent?: string
  downloadable: boolean
}

export interface CreateCourseModuleInput {
  title: string
  description?: string
  duration_minutes: number
  video_url?: string
  pdf_url?: string
  text_content?: string
  downloadable?: boolean
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

interface UserCertificatesEnvelope {
  success: boolean
  certificates: CertificateRecord[]
}

interface GenerateCertificateEnvelope {
  success: boolean
  verificationCode: string
  qrCode: string
  message: string
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

  async downloadReport(endpoint: string, filename: string): Promise<void> {
    const baseUrl = await this.resolveBaseUrl()
    const headers: Record<string, string> = {}
    const token = this.getToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      const parsed = await this.parseResponse<ErrorPayload>(response).catch(() => undefined)
      throw new ApiError(parsed?.error ?? parsed?.message ?? `HTTP ${response.status}`, response.status)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
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

  async validateSession(): Promise<ValidateSessionPayload> {
    return this.request<ValidateSessionPayload>('/api/auth/validate', {
      method: 'POST'
    })
  }

  async logout(): Promise<void> {
    try {
      await this.request<{ success: boolean }>('/api/auth/logout', {
        method: 'DELETE'
      })
    } finally {
      this.clearToken()
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const payload = await this.request<DashboardStatsEnvelope>('/api/dashboard/stats')
    return payload.stats
  }

  async getRecentActivity(): Promise<Activity[]> {
    const payload = await this.request<RecentActivityEnvelope>('/api/dashboard/activity')
    return payload.activity
  }

  async getUsers(filters?: { status?: string; limit?: number; offset?: number; page?: number; pageSize?: number; search?: string; ngoId?: string }): Promise<UsersPageResult> {
    const query = filters ? `?${new URLSearchParams(Object.entries(filters).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = String(value)
      }
      return acc
    }, {})).toString()}` : ''
    const payload = await this.request<UsersEnvelope>(`/api/users${query}`)
    return {
      users: payload.users,
      pagination: payload.pagination
    }
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
    phone?: string
    location?: string
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

  async sendSMSCode(code: string, phoneNumber: string): Promise<SmsEnvelope['sms']> {
    const payload = await this.request<SmsEnvelope>('/api/sms/send', {
      method: 'POST',
      body: {
        phoneNumber,
        message: `O seu código de acesso WIRA: ${code}`
      }
    })
    return payload.sms
  }

  async sendSms(phoneNumber: string, message: string): Promise<SmsEnvelope['sms']> {
    const payload = await this.request<SmsEnvelope>('/api/sms/send', {
      method: 'POST',
      body: {
        phoneNumber,
        message
      }
    })
    return payload.sms
  }

  async getSmsStatus(): Promise<SmsStatusEnvelope> {
    return this.request<SmsStatusEnvelope>('/api/sms/status')
  }

  async getCourses(): Promise<Course[]> {
    const payload = await this.request<{ success: boolean; courses: Course[] }>('/api/courses', {
      requiresAuth: false
    })
    return payload.courses
  }

  async createCourse(data: {
    title: string
    description?: string
    instructor?: string
    duration_hours: number
    modules_count: number
    level: string
    skills?: string
    modules?: CreateCourseModuleInput[]
  }): Promise<Course> {
    const payload = await this.request<CreateCourseEnvelope>('/api/courses', {
      method: 'POST',
      body: data
    })
    return payload.course
  }

  async getCourseModules(courseId: string): Promise<CourseModule[]> {
    const payload = await this.request<{ success: boolean; modules: CourseModule[] }>(`/api/courses/${courseId}/modules`, {
      requiresAuth: false
    })
    return payload.modules
  }

  async getCourseProgress(userId: string): Promise<unknown> {
    return this.request(`/api/users/${userId}/progress`)
  }

  async getUserCertificates(userId: string): Promise<CertificateRecord[]> {
    const payload = await this.request<UserCertificatesEnvelope>(`/api/users/${encodeURIComponent(userId)}/certificates`)
    return payload.certificates
  }

  async generateCertificate(data: {
    anonymousCode: string
    courseId: string
    score: number
  }): Promise<GenerateCertificateEnvelope> {
    return this.request<GenerateCertificateEnvelope>('/api/certificates/generate', {
      method: 'POST',
      body: data
    })
  }

  async verifyCertificate(code: string): Promise<VerifyCertificateEnvelope> {
    return this.request<VerifyCertificateEnvelope>(`/api/certificates/verify/${encodeURIComponent(code)}`)
  }

  async getEmployers(filters?: { status?: string; ngoId?: string; active?: boolean }): Promise<Employer[]> {
    const query = filters ? `?${new URLSearchParams(Object.entries(filters).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = String(value)
      }
      return acc
    }, {})).toString()}` : ''
    const payload = await this.request<EmployersEnvelope>(`/api/employers${query}`)
    return payload.employers
  }

  async createEmployer(data: EmployerMutationInput): Promise<Employer> {
    const payload = await this.request<EmployerEnvelope>('/api/employers', {
      method: 'POST',
      body: data
    })
    return payload.employer
  }

  async updateEmployer(id: string, data: EmployerMutationInput): Promise<Employer> {
    const payload = await this.request<EmployerEnvelope>(`/api/employers/${id}`, {
      method: 'PUT',
      body: data
    })
    return payload.employer
  }

  async getJobsAdmin(filters?: {
    status?: string
    ngoId?: string
    employerId?: string
    location?: string
  }): Promise<Job[]> {
    const query = filters ? `?${new URLSearchParams(Object.entries(filters).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value) {
        acc[key] = value
      }
      return acc
    }, {})).toString()}` : ''
    const payload = await this.request<JobsEnvelope>(`/api/jobs${query}`)
    return payload.jobs
  }

  async createJob(data: JobMutationInput): Promise<Job> {
    const payload = await this.request<JobEnvelope>('/api/jobs', {
      method: 'POST',
      body: data
    })
    return payload.job
  }

  async updateJob(id: string, data: Partial<JobMutationInput> & { isActive?: boolean }): Promise<Job> {
    const payload = await this.request<JobEnvelope>(`/api/jobs/${id}`, {
      method: 'PUT',
      body: data
    })
    return payload.job
  }

  async generateJobMatches(jobId: string): Promise<JobMatch[]> {
    const payload = await this.request<{ success: boolean; matches: JobMatch[] }>(`/api/jobs/${jobId}/match`, {
      method: 'POST'
    })
    return payload.matches
  }

  async getMatches(filters?: { jobId?: string; anonymousCode?: string; status?: string }): Promise<JobMatch[]> {
    const query = filters ? `?${new URLSearchParams(Object.entries(filters).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value) {
        acc[key] = value
      }
      return acc
    }, {})).toString()}` : ''
    const payload = await this.request<MatchesEnvelope>(`/api/matches${query}`)
    return payload.matches
  }

  async reviewMatch(id: string, data: {
    decision: 'approve' | 'reject'
    reviewType: 'ngo' | 'social'
    notes?: string
    rejectionReason?: string
  }): Promise<JobMatch> {
    const payload = await this.request<MatchEnvelope>(`/api/matches/${id}/review`, {
      method: 'POST',
      body: data
    })
    return payload.match
  }

  async confirmVictimMatch(id: string, data: { confirmed: boolean; notes?: string }): Promise<JobMatch> {
    const payload = await this.request<MatchEnvelope>(`/api/matches/${id}/confirm-victim`, {
      method: 'POST',
      body: data
    })
    return payload.match
  }

  async getApplications(filters?: { status?: string; jobId?: string; anonymousCode?: string }): Promise<JobApplication[]> {
    const query = filters ? `?${new URLSearchParams(Object.entries(filters).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value) {
        acc[key] = value
      }
      return acc
    }, {})).toString()}` : ''
    const payload = await this.request<ApplicationsEnvelope>(`/api/applications${query}`)
    return payload.applications
  }

  async transitionApplication(id: number, data: { status: ApplicationStatus; notes?: string }): Promise<JobApplication> {
    const payload = await this.request<ApplicationEnvelope>(`/api/applications/${id}/transition`, {
      method: 'POST',
      body: data
    })
    return payload.application
  }

  async getCheckins(filters?: { status?: string; channel?: string; jobApplicationId?: number; anonymousCode?: string }): Promise<FollowUpCheckin[]> {
    const query = filters ? `?${new URLSearchParams(Object.entries(filters).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = String(value)
      }
      return acc
    }, {})).toString()}` : ''
    const payload = await this.request<CheckinsEnvelope>(`/api/checkins${query}`)
    return payload.checkins
  }

  async scheduleCheckin(data: {
    jobApplicationId: number
    periodLabel: string
    channel: FollowUpChannel
    prompt?: string
    dueAt?: string
  }): Promise<FollowUpCheckin> {
    const payload = await this.request<CheckinEnvelope>('/api/checkins/schedule', {
      method: 'POST',
      body: data
    })
    return payload.checkin
  }

  async respondCheckin(id: string, data: { response?: string; responseCode?: string }): Promise<FollowUpCheckin> {
    const payload = await this.request<CheckinEnvelope>(`/api/checkins/${id}/respond`, {
      method: 'POST',
      body: data
    })
    return payload.checkin
  }

  async getAlerts(filters?: { status?: string; severity?: string; ngoId?: string; anonymousCode?: string }): Promise<Alert[]> {
    const query = filters ? `?${new URLSearchParams(Object.entries(filters).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value) {
        acc[key] = value
      }
      return acc
    }, {})).toString()}` : ''
    const payload = await this.request<AlertsEnvelope>(`/api/alerts${query}`)
    return payload.alerts
  }

  async updateAlert(id: string, data: { status?: AlertStatus; resolutionNotes?: string; ownerCode?: string }): Promise<Alert> {
    const payload = await this.request<AlertEnvelope>(`/api/alerts/${id}`, {
      method: 'PUT',
      body: data
    })
    return payload.alert
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
  realName?: string | null
  phone?: string | null
  dateOfBirth?: string | null
  initialSkills?: string | null
  location?: string | null
}

export interface UsersPageResult {
  users: User[]
  pagination?: UsersEnvelope['pagination']
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  coursesCompleted: number
  certificatesIssued: number
  averageCompletionTime: number
  openAlerts?: number
  placedApplications?: number
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
  is_active?: boolean
  created_at?: string
  updated_at?: string
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

export interface CertificateRecord {
  id: string | number
  verificationCode: string
  courseId: string
  courseTitle: string
  issueDate: string
  score: number
  qrCode: string
}

export type EmployerValidationStatus = 'PENDING' | 'VALIDATED' | 'REJECTED' | 'SUSPENDED'
export type JobStatus = 'DRAFT' | 'VALIDATED' | 'OPEN' | 'CLOSED' | 'REJECTED'
export type MatchStatus = 'SUGGESTED' | 'NGO_REVIEWED' | 'SOCIAL_REVIEWED' | 'VICTIM_CONFIRMED' | 'REJECTED' | 'SUBMITTED'
export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_COMPLETED'
  | 'OFFER_MADE'
  | 'REJECTED'
  | 'ACCEPTED'
  | 'PLACED'
  | 'WITHDRAWN'
export type FollowUpChannel = 'SMS' | 'USSD' | 'APP' | 'MANUAL'
export type CheckinStatus = 'PENDING' | 'RESPONDED' | 'MISSED'
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type AlertStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED'

export interface Employer {
  id: string
  name: string
  sector?: string | null
  nuit?: string | null
  contact_name?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  location?: string | null
  ngo_id?: string | null
  validation_status: EmployerValidationStatus
  validation_notes?: string | null
  reviewed_by_code?: string | null
  validation_reviewed_at?: string | null
  notes?: string | null
  is_active: boolean
  created_at: string
  updated_at?: string | null
  jobs?: Array<{
    id: string
    title: string
    status: JobStatus
    is_active: boolean
  }>
  ngo?: {
    id: string
    name: string
  }
}

export interface EmployerMutationInput {
  name: string
  sector?: string
  nuit?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  location?: string
  ngoId?: string
  validationStatus?: EmployerValidationStatus
  validationNotes?: string
  notes?: string
  isActive?: boolean
}

export interface Job {
  id: string
  title: string
  description: string
  location: string
  required_skills: string
  contract_type: string
  schedule?: string | null
  salary_range?: string | null
  availability?: string | null
  work_type?: string | null
  status: JobStatus
  validation_notes?: string | null
  is_active: boolean
  ngo_id?: string | null
  employer_id?: string | null
  created_at: string
  updated_at?: string | null
  employer?: {
    id: string
    name: string
    location?: string | null
    validation_status?: EmployerValidationStatus
  } | null
  matching?: {
    score: number
    sharedSkills: string[]
    rationale?: string[]
  }
}

export interface JobMutationInput {
  title: string
  description: string
  location: string
  requiredSkills: string
  contractType: string
  schedule?: string
  salaryRange?: string
  availability?: string
  workType?: string
  status?: JobStatus
  validationNotes?: string
  employerId?: string
  ngoId?: string
}

export interface JobMatch {
  id: string
  job_id: string
  anonymous_code: string
  ngo_id?: string | null
  score: number
  shared_skills?: string | null
  rationale?: string | null
  status: MatchStatus
  review_type?: string | null
  ngo_review_notes?: string | null
  social_review_notes?: string | null
  rejection_reason?: string | null
  victim_confirmation_at?: string | null
  created_at: string
  updated_at?: string | null
  job?: {
    id: string
    title: string
    location: string
    status: JobStatus
  }
  user?: {
    anonymous_code: string
    ngo_id?: string | null
    location?: string | null
    initial_skills?: string | null
  }
  applications?: Array<{
    id: number
    status: ApplicationStatus
    applied_at: string
  }>
}

export interface JobApplication {
  id: number
  job_id: string
  anonymous_code: string
  job_match_id?: string | null
  ngo_id?: string | null
  status: ApplicationStatus
  score: number
  notes?: string | null
  transition_notes?: string | null
  last_transition_by_code?: string | null
  applied_at: string
  submitted_at?: string | null
  interview_scheduled_at?: string | null
  interview_completed_at?: string | null
  offer_made_at?: string | null
  accepted_at?: string | null
  placed_at?: string | null
  withdrawn_at?: string | null
  rejected_at?: string | null
  updated_at?: string | null
  job?: {
    id: string
    title: string
    location: string
  }
  user?: {
    anonymous_code: string
    ngo_id?: string | null
    location?: string | null
  }
  job_match?: {
    id: string
    status: MatchStatus
    score: number
  } | null
}

export interface FollowUpCheckin {
  id: string
  job_application_id: number
  anonymous_code: string
  ngo_id?: string | null
  period_label: string
  channel: FollowUpChannel
  prompt?: string | null
  response?: string | null
  response_code?: string | null
  status: CheckinStatus
  risk_severity: AlertSeverity
  due_at: string
  responded_at?: string | null
  created_at: string
  updated_at?: string | null
  job_application?: {
    id: number
    status: ApplicationStatus
    job?: {
      id: string
      title: string
    }
  }
}

export interface Alert {
  id: string
  anonymous_code: string
  ngo_id?: string | null
  job_application_id?: number | null
  checkin_id?: string | null
  type: string
  severity: AlertSeverity
  source: string
  status: AlertStatus
  owner_code?: string | null
  resolution_notes?: string | null
  created_at: string
  updated_at?: string | null
  resolved_at?: string | null
  job_application?: {
    id: number
    status: ApplicationStatus
  } | null
  checkin?: {
    id: string
    period_label: string
    status: CheckinStatus
  } | null
}

export { ApiError }
