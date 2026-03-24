import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import sessionService from './session'

const ENV_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim()
const ENV_API_BASE_URL_WEB = process.env.EXPO_PUBLIC_API_BASE_URL_WEB?.trim()
const ENV_API_BASE_URL_NATIVE = process.env.EXPO_PUBLIC_API_BASE_URL_NATIVE?.trim()

const resolvePlatformEnvBaseUrl = (): string | null => {
  if (Platform.OS === 'web') {
    return ENV_API_BASE_URL_WEB ?? ENV_API_BASE_URL ?? null
  }

  return ENV_API_BASE_URL_NATIVE ?? ENV_API_BASE_URL ?? null
}

let cachedApiBaseUrl: string | null = resolvePlatformEnvBaseUrl()
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

const getActiveBaseUrl = (): string => normalizeBaseUrl(cachedApiBaseUrl ?? resolvePlatformEnvBaseUrl() ?? getDefaultBaseUrl())

const isLoopbackAssetHost = (hostname: string): boolean =>
  ['localhost', '127.0.0.1', '10.0.2.2'].includes(hostname.toLowerCase())

const isPlaceholderAssetHost = (hostname: string): boolean => {
  const normalized = hostname.toLowerCase()
  return normalized === 'cdn.wira.local'
    || normalized === 'cdn.wira.training'
    || normalized.endsWith('.wira.local')
    || normalized.endsWith('.wira.training')
}

const normalizeAssetUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  const activeBaseUrl = getActiveBaseUrl()
  const activeOrigin = new URL(activeBaseUrl).origin

  if (trimmed.startsWith('/')) {
    return `${activeOrigin}${trimmed}`
  }

  if (/^cdn\.wira\./i.test(trimmed)) {
    return undefined
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return undefined
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return undefined
  }

  if (isPlaceholderAssetHost(parsed.hostname)) {
    return undefined
  }

  if (isLoopbackAssetHost(parsed.hostname) && parsed.origin !== activeOrigin) {
    return `${activeOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`
  }

  return parsed.toString()
}

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
  const envBaseUrl = resolvePlatformEnvBaseUrl()
  const primary = normalizeBaseUrl(envBaseUrl ?? getDefaultBaseUrl())

  if (envBaseUrl) {
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const parseMaybeJson = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const toArray = <T>(value: unknown): T[] => {
  const parsed = parseMaybeJson(value)
  return Array.isArray(parsed) ? (parsed as T[]) : []
}

const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

const getCollection = <T>(payload: unknown, key: string): T[] => {
  const parsed = parseMaybeJson(payload)
  if (Array.isArray(parsed)) {
    return parsed as T[]
  }

  if (!isRecord(parsed)) {
    return []
  }

  if (key in parsed) {
    return toArray<T>(parsed[key])
  }

  const data = parseMaybeJson(parsed.data)
  if (isRecord(data) && key in data) {
    return toArray<T>(data[key])
  }

  return []
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

export interface QuizReview {
  questionId: number
  question: string
  selectedIndex: number
  correctIndex: number
  isCorrect: boolean
  explanation: string
}

export interface QuizSubmissionResult {
  courseId: string
  anonymousCode: string
  totalQuestions: number
  correctAnswers: number
  score: number
  passed: boolean
  reviews: QuizReview[]
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

const normalizeCourseItem = (value: unknown): CourseItem => {
  const item = parseMaybeJson(value)
  const record = isRecord(item) ? item : {}
  const normalized: CourseItem = {
    id: String(record.id ?? ''),
    title: typeof record.title === 'string' ? record.title : 'Curso sem titulo',
    duration_hours: toNumber(record.duration_hours, 0),
    modules_count: toNumber(record.modules_count, 0),
    level: typeof record.level === 'string' ? record.level : 'Basico'
  }

  if (typeof record.description === 'string') {
    normalized.description = record.description
  }

  if (typeof record.instructor === 'string') {
    normalized.instructor = record.instructor
  }

  if (typeof record.skills === 'string') {
    normalized.skills = record.skills
  }

  return normalized
}

const normalizeCourseModule = (value: unknown): CourseModule => {
  const item = parseMaybeJson(value)
  const record = isRecord(item) ? item : {}
  const normalized: CourseModule = {
    id: toNumber(record.id, 0),
    title: typeof record.title === 'string' ? record.title : 'Modulo',
    duration: typeof record.duration === 'string' ? record.duration : '0 min',
    downloadable: Boolean(record.downloadable)
  }

  const normalizedVideoUrl = normalizeAssetUrl(record.videoUrl)
  if (normalizedVideoUrl) {
    normalized.videoUrl = normalizedVideoUrl
  }

  const normalizedPdfUrl = normalizeAssetUrl(record.pdfUrl)
  if (normalizedPdfUrl) {
    normalized.pdfUrl = normalizedPdfUrl
  }

  if (typeof record.textContent === 'string') {
    normalized.textContent = record.textContent
  }

  if (typeof record.description === 'string') {
    normalized.description = record.description
  }

  return normalized
}

const normalizeQuizQuestion = (value: unknown): QuizQuestion => {
  const item = parseMaybeJson(value)
  const record = isRecord(item) ? item : {}

  return {
    id: toNumber(record.id, 0),
    question: typeof record.question === 'string' ? record.question : '',
    options: toArray<string>(record.options).filter(option => typeof option === 'string'),
    correctAnswer: toNumber(record.correctAnswer, 0),
    explanation: typeof record.explanation === 'string' ? record.explanation : ''
  }
}

const normalizeProgressCourse = (value: unknown): ProgressCourse => {
  const item = parseMaybeJson(value)
  const record = isRecord(item) ? item : {}

  return {
    courseId: String(record.courseId ?? ''),
    title: typeof record.title === 'string' ? record.title : 'Curso',
    modulesCount: toNumber(record.modulesCount, 0),
    progress: toNumber(record.progress, 0),
    currentModule: toNumber(record.currentModule, 1),
    completedModules: toArray<string>(record.completedModules).map(moduleId => String(moduleId)),
    lastActivity: typeof record.lastActivity === 'string' ? record.lastActivity : null
  }
}

const normalizeCoursesPayload = (payload: unknown): CourseItem[] =>
  getCollection<unknown>(payload, 'courses').map(normalizeCourseItem)

const normalizeModulesPayload = (payload: unknown): CourseModule[] =>
  getCollection<unknown>(payload, 'modules').map(normalizeCourseModule)

const normalizeQuizPayload = (payload: unknown): QuizQuestion[] =>
  getCollection<unknown>(payload, 'quiz').map(normalizeQuizQuestion)

const normalizeAggregatedProgress = (payload: unknown): AggregatedProgress => {
  const parsed = parseMaybeJson(payload)
  const record = isRecord(parsed) ? parsed : {}
  const summary = isRecord(parseMaybeJson(record.summary)) ? (parseMaybeJson(record.summary) as Record<string, unknown>) : {}
  const courses = getCollection<unknown>(payload, 'courses').map(normalizeProgressCourse)

  return {
    userCode: typeof record.userCode === 'string' ? record.userCode : '',
    summary: {
      totalCourses: toNumber(summary.totalCourses, courses.length),
      activeCourses: toNumber(summary.activeCourses, courses.filter(course => course.progress > 0).length),
      averageProgress: toNumber(
        summary.averageProgress,
        courses.length > 0
          ? Math.round(courses.reduce((total, course) => total + course.progress, 0) / courses.length)
          : 0
      )
    },
    courses
  }
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

  async logout(): Promise<void> {
    try {
      await this.request<{ success: boolean }>('/api/auth/logout', {
        method: 'DELETE'
      })
    } finally {
      await sessionService.clearSession()
    }
  }

  async getCourses(): Promise<CourseItem[]> {
    const cacheKey = 'courses'
    const cached = await readCache<unknown>(cacheKey, this.getCachePolicy('courses'))
    if (cached !== null) {
      return normalizeCoursesPayload(cached)
    }

    const response = await this.request<unknown>('/api/courses', {
      method: 'GET'
    })
    const courses = normalizeCoursesPayload(response)
    await writeCache(cacheKey, courses)
    return courses
  }

  async getCourseModules(courseId: string): Promise<CourseModule[]> {
    const cacheKey = `modules:${courseId}`
    const cached = await readCache<unknown>(cacheKey, this.getCachePolicy('modules'))
    if (cached !== null) {
      return normalizeModulesPayload(cached)
    }

    const response = await this.request<unknown>(`/api/courses/${courseId}/modules`, {
      method: 'GET'
    })
    const modules = normalizeModulesPayload(response)
    await writeCache(cacheKey, modules)
    return modules
  }

  async getCourseQuiz(courseId: string): Promise<QuizQuestion[]> {
    const cacheKey = `quiz:${courseId}`
    const cached = await readCache<unknown>(cacheKey, this.getCachePolicy('quiz'))
    if (cached !== null) {
      return normalizeQuizPayload(cached)
    }

    const response = await this.request<unknown>(`/api/courses/${courseId}/quiz`, {
      method: 'GET'
    })
    const quiz = normalizeQuizPayload(response)
    await writeCache(cacheKey, quiz)
    return quiz
  }

  async getAggregatedProgress(userCode: string): Promise<AggregatedProgress> {
    const cacheKey = `progress:aggregate:${userCode}`
    const cached = await readCache<unknown>(cacheKey, this.getCachePolicy('progressAggregate'))
    if (cached !== null) {
      return normalizeAggregatedProgress(cached)
    }

    const response = await this.request<unknown>(`/api/progress/user/${userCode}`, {
      method: 'GET'
    })
    const progress = normalizeAggregatedProgress(response)
    await writeCache(cacheKey, progress)
    return progress
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

  async submitQuiz(anonymousCode: string, courseId: string, answers: number[]): Promise<QuizSubmissionResult> {
    const response = await this.request<{ success: boolean; result: QuizSubmissionResult }>('/api/quizzes/submit', {
      method: 'POST',
      body: JSON.stringify({
        anonymousCode,
        courseId,
        answers
      })
    })
    return response.result
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
