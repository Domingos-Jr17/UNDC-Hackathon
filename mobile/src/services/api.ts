import sessionService from './session'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'

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
  videoUrl: string
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

const buildUrl = (path: string): string => `${API_BASE_URL}${path}`

const parseJson = async <T>(response: Response): Promise<T> => {
  const data = (await response.json()) as T
  return data
}

class ApiService {
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

    const response = await fetch(buildUrl(path), {
      ...init,
      headers
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as { error?: string; message?: string }))
      throw new Error(errorData.error ?? errorData.message ?? `HTTP ${response.status}`)
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
    const response = await this.request<{ success: boolean; courses: CourseItem[] }>('/api/courses', {
      method: 'GET'
    })
    return response.courses
  }

  async getCourseModules(courseId: string): Promise<CourseModule[]> {
    const response = await this.request<{ success: boolean; modules: CourseModule[] }>(`/api/courses/${courseId}/modules`, {
      method: 'GET'
    })
    return response.modules
  }

  async getCourseQuiz(courseId: string): Promise<QuizQuestion[]> {
    const response = await this.request<{ success: boolean; quiz: QuizQuestion[] }>(`/api/courses/${courseId}/quiz`, {
      method: 'GET'
    })
    return response.quiz
  }

  async getAggregatedProgress(userCode: string): Promise<AggregatedProgress> {
    return this.request<AggregatedProgress>(`/api/progress/user/${userCode}`, {
      method: 'GET'
    })
  }

  async updateProgress(userCode: string, courseId: string, completedModules: string[], percentage: number): Promise<void> {
    await this.request<{ success: boolean }>(`/api/progress/user/${userCode}/course/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify({
        completedModules,
        percentage
      })
    })
  }

  async getUserCertificates(userCode: string): Promise<CertificateRecord[]> {
    const response = await this.request<{ success: boolean; certificates: CertificateRecord[] }>(
      `/api/certificates/user/${userCode}`,
      { method: 'GET' }
    )
    return response.certificates
  }

  async generateCertificate(userCode: string, courseId: string, score: number): Promise<{
    success: boolean
    verificationCode: string
    qrCode: string
  }> {
    return this.request<{
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
  }

  async getJobs(): Promise<JobRecord[]> {
    const response = await this.request<{ success: boolean; jobs: JobRecord[] }>('/api/jobs', {
      method: 'GET'
    })
    return response.jobs
  }

  async getJobMatching(userCode: string, location?: string): Promise<JobRecord[]> {
    const response = await this.request<{ success: boolean; jobs: JobRecord[] }>('/api/jobs/matching', {
      method: 'POST',
      body: JSON.stringify({
        anonymousCode: userCode,
        location
      })
    })
    return response.jobs
  }

  async applyToJob(jobId: string, userCode: string): Promise<void> {
    await this.request<{ success: boolean }>(`/api/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify({
        anonymousCode: userCode
      })
    })
  }
}

export const apiService = new ApiService()

export default apiService
