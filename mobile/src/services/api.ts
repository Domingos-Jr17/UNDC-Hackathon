import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import sessionService from './session'

const ENV_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim()
let cachedApiBaseUrl: string | null = ENV_API_BASE_URL ?? null
const CACHE_PREFIX = 'wira_cache:'

type CachePolicy = {
  ttlMs: number
}

type CachePolicyKey =
  | 'courses'
  | 'modules'
  | 'quiz'
  | 'progressAggregate'
  | 'progressCourse'
  | 'certificates'
  | 'jobs'
  | 'jobMatching'

type CacheEnvelope<T> = {
  timestamp: number
  data: T
}

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, '')

const getDefaultBaseUrl = (): string => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000'
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost'
    return `http://${host}:3000`
  }

  return 'http://localhost:3000'
}

const buildCandidateBaseUrls = (): string[] => {
  const primary = normalizeBaseUrl(ENV_API_BASE_URL ?? getDefaultBaseUrl())

  if (ENV_API_BASE_URL) {
    return [primary]
  }

  const candidates = [primary]
  const match = primary.match(/^(https?:\/\/[^/:]+):(\d+)$/i)
  if (match) {
    const host = match[1]
    const port = Number(match[2])
    const fallbackPorts = [port, 3000, 3001, 3002]
    fallbackPorts.forEach(candidatePort => {
      const url = `${host}:${candidatePort}`
      if (!candidates.includes(url)) {
        candidates.push(url)
      }
    })
  }

  return candidates
}

interface ApiEnvelope<T> {
  success: boolean
  error?: string
  message?: string
}

export interface LoginUser {
  anonymousCode: string
  ngoId: string
  role: 'VICTIM' | 'STAFF' | 'ADMIN'
  createdAt: string
}

export interface LoginResponse extends ApiEnvelope<never> {
  token: string
  user: LoginUser
  expiresIn: string
}

export interface CourseItem {
  id: string
  title: string
  description?: string
  instructor?: string
  duration_hours: number
  modules_count: number
  level: string
  skills?: string
}

export interface CourseModule {
  id: number
  title: string
  duration: string
  videoUrl?: string
  pdfUrl?: string
  textContent?: string
  downloadable: boolean
  description?: string
}

export interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export interface ProgressCourse {
  courseId: string
  title: string
  modulesCount: number
  progress: number
  currentModule: number
  completedModules: string[]
  lastActivity: string | null
}

export interface AggregatedProgress {
  userCode: string
  summary: {
    totalCourses: number
    activeCourses: number
    averageProgress: number
  }
  courses: ProgressCourse[]
}

export interface CourseProgress {
  id: number
  user_code: string
  course_id: string
  completed_modules: string
  percentage: number
  current_module: number
  quiz_attempts: number
  last_quiz_score?: number
  last_activity: string
  completed_at?: string
}

export interface CertificateRecord {
  id: string
  verificationCode: string
  courseId: string
  courseTitle: string
  issueDate: string
  score: number
  qrCode: string
}

export interface JobRecord {
  id: string
  title: string
  description: string
  location: string
  required_skills: string
  contract_type: string
  schedule?: string | null
  salary_range?: string | null
  is_active: boolean
  employer?: {
    id: string
    name: string
    location?: string | null
  } | null
  matching?: {
    score: number
    sharedSkills: string[]
  }
}

type ApiFetchResult = {
  response: Response
  baseUrl: string
}

const fetchWithBaseUrlFallback = async (path: string, init: RequestInit): Promise<ApiFetchResult> => {
  const candidates = cachedApiBaseUrl
    ? [cachedApiBaseUrl]
    : buildCandidateBaseUrls()

  let lastNetworkError: Error | null = null

  for (const candidate of candidates) {
    const baseUrl = normalizeBaseUrl(candidate)
    try {
      const response = await fetch(`${baseUrl}${path}`, init)
      cachedApiBaseUrl = baseUrl
      return { response, baseUrl }
    } catch (error) {
      lastNetworkError = error as Error
    }
  }

  const attempted = candidates.join(', ')
    throw new Error(
      `Não foi possível conectar ao backend (${attempted}). Inicie a API e confira EXPO_PUBLIC_API_BASE_URL. ` +
      `Detalhe: ${lastNetworkError?.message ?? 'erro de rede'}`
    )
}

const parseJson = async <T>(response: Response): Promise<T> => {
  const data = (await response.json()) as T
  return data
}

const buildCacheStorageKey = (key: string): string => `${CACHE_PREFIX}${key}`

const readCache = async <T>(key: string, policy: CachePolicy): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(buildCacheStorageKey(key))
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as CacheEnvelope<T>
    if (Date.now() - parsed.timestamp > policy.ttlMs) {
      await AsyncStorage.removeItem(buildCacheStorageKey(key))
      return null
    }

    return parsed.data
  } catch {
    return null
  }
}

const writeCache = async <T>(key: string, data: T): Promise<void> => {
  try {
    const payload: CacheEnvelope<T> = {
      timestamp: Date.now(),
      data
    }
    await AsyncStorage.setItem(buildCacheStorageKey(key), JSON.stringify(payload))
  } catch {
    // Ignore cache write failures and continue with network result.
  }
}

const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys()
    const matching = keys.filter(key => key.startsWith(CACHE_PREFIX) && key.includes(pattern))
    if (matching.length > 0) {
      await AsyncStorage.multiRemove(matching)
    }
  } catch {
    // Ignore cache invalidation failures.
  }
}

class ApiService {
  private readonly cachePolicies: Record<CachePolicyKey, CachePolicy> = {
    courses: { ttlMs: 5 * 60 * 1000 },
    modules: { ttlMs: 5 * 60 * 1000 },
    quiz: { ttlMs: 10 * 60 * 1000 },
    progressAggregate: { ttlMs: 90 * 1000 },
    progressCourse: { ttlMs: 90 * 1000 },
    certificates: { ttlMs: 5 * 60 * 1000 },
    jobs: { ttlMs: 3 * 60 * 1000 },
    jobMatching: { ttlMs: 2 * 60 * 1000 }
  }

  private getCachePolicy(key: CachePolicyKey): CachePolicy {
    return this.cachePolicies[key]
  }

  private async request<T>(path: string, init?: RequestInit, requiresAuth: boolean = true): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined)
    }

    if (requiresAuth) {
      const token = await sessionService.getToken()
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    const { response, baseUrl } = await fetchWithBaseUrlFallback(path, {
      ...init,
      headers
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as { error?: string; message?: string }))
      throw new Error(errorData.error ?? errorData.message ?? `HTTP ${response.status} (${baseUrl}${path})`)
    }

    return parseJson<T>(response)
  }

  async login(code: string): Promise<LoginResponse> {
    return this.request<LoginResponse>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ code })
      },
      false
    )
  }

  async getCourses(): Promise<CourseItem[]> {
    const cacheKey = 'courses'
    const cached = await readCache<CourseItem[]>(cacheKey, this.getCachePolicy('courses'))
    if (cached) {
      return cached
    }

    const response = await this.request<{ success: boolean; courses: CourseItem[] }>('/api/courses', {
      method: 'GET'
    })
    await writeCache(cacheKey, response.courses)
    return response.courses
  }

  async getCourseModules(courseId: string): Promise<CourseModule[]> {
    const cacheKey = `modules:${courseId}`
    const cached = await readCache<CourseModule[]>(cacheKey, this.getCachePolicy('modules'))
    if (cached) {
      return cached
    }

    const response = await this.request<{ success: boolean; modules: CourseModule[] }>(`/api/courses/${courseId}/modules`, {
      method: 'GET'
    })
    await writeCache(cacheKey, response.modules)
    return response.modules
  }

  async getCourseQuiz(courseId: string): Promise<QuizQuestion[]> {
    const cacheKey = `quiz:${courseId}`
    const cached = await readCache<QuizQuestion[]>(cacheKey, this.getCachePolicy('quiz'))
    if (cached) {
      return cached
    }

    const response = await this.request<{ success: boolean; quiz: QuizQuestion[] }>(`/api/courses/${courseId}/quiz`, {
      method: 'GET'
    })
    await writeCache(cacheKey, response.quiz)
    return response.quiz
  }

  async getAggregatedProgress(userCode: string): Promise<AggregatedProgress> {
    const cacheKey = `progress:aggregate:${userCode}`
    const cached = await readCache<AggregatedProgress>(cacheKey, this.getCachePolicy('progressAggregate'))
    if (cached) {
      return cached
    }

    const response = await this.request<AggregatedProgress>(`/api/progress/user/${userCode}`, {
      method: 'GET'
    })
    await writeCache(cacheKey, response)
    return response
  }

  async getCourseProgress(userCode: string, courseId: string): Promise<CourseProgress> {
    const cacheKey = `progress:course:${userCode}:${courseId}`
    const cached = await readCache<CourseProgress>(cacheKey, this.getCachePolicy('progressCourse'))
    if (cached) {
      return cached
    }

    const response = await this.request<{ success: boolean; progress: CourseProgress }>(
      `/api/progress/user/${userCode}/course/${courseId}`,
      { method: 'GET' }
    )
    await writeCache(cacheKey, response.progress)
    return response.progress
  }

  async updateProgress(
    userCode: string,
    courseId: string,
    completedModules: string[],
    percentage: number,
    options?: {
      currentModule?: number
      quizAttempts?: number
      lastQuizScore?: number
    }
  ): Promise<void> {
    await this.request<{ success: boolean }>(`/api/progress/user/${userCode}/course/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify({
        completedModules,
        percentage,
        currentModule: options?.currentModule,
        quizAttempts: options?.quizAttempts,
        lastQuizScore: options?.lastQuizScore
      })
    })
    await invalidateCache(`progress:aggregate:${userCode}`)
    await invalidateCache(`progress:course:${userCode}:`)
  }

  async getUserCertificates(userCode: string): Promise<CertificateRecord[]> {
    const cacheKey = `certificates:${userCode}`
    const cached = await readCache<CertificateRecord[]>(cacheKey, this.getCachePolicy('certificates'))
    if (cached) {
      return cached
    }

    const response = await this.request<{ success: boolean; certificates: CertificateRecord[] }>(
      `/api/certificates/user/${userCode}`,
      { method: 'GET' }
    )
    await writeCache(cacheKey, response.certificates)
    return response.certificates
  }

  async generateCertificate(userCode: string, courseId: string, score: number): Promise<{
    success: boolean
    verificationCode: string
    qrCode: string
  }> {
    const payload = await this.request<{
      success: boolean
      verificationCode: string
      qrCode: string
    }>('/api/certificates/generate', {
      method: 'POST',
      body: JSON.stringify({
        anonymousCode: userCode,
        courseId,
        score
      })
    })
    await invalidateCache(`certificates:${userCode}`)
    return payload
  }

  async getJobs(): Promise<JobRecord[]> {
    const cacheKey = 'jobs:list'
    const cached = await readCache<JobRecord[]>(cacheKey, this.getCachePolicy('jobs'))
    if (cached) {
      return cached
    }

    const response = await this.request<{ success: boolean; jobs: JobRecord[] }>('/api/jobs', {
      method: 'GET'
    })
    await writeCache(cacheKey, response.jobs)
    return response.jobs
  }

  async getJobMatching(userCode: string, location?: string): Promise<JobRecord[]> {
    const cacheKey = `jobs:matching:${userCode}:${location ?? ''}`
    const cached = await readCache<JobRecord[]>(cacheKey, this.getCachePolicy('jobMatching'))
    if (cached) {
      return cached
    }

    const response = await this.request<{ success: boolean; jobs: JobRecord[] }>('/api/jobs/matching', {
      method: 'POST',
      body: JSON.stringify({
        anonymousCode: userCode,
        location
      })
    })
    await writeCache(cacheKey, response.jobs)
    return response.jobs
  }

  async applyToJob(jobId: string, userCode: string): Promise<void> {
    await this.request<{ success: boolean }>(`/api/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify({
        anonymousCode: userCode
      })
    })
    await invalidateCache('jobs:')
  }
}

export const apiService = new ApiService()

export default apiService
