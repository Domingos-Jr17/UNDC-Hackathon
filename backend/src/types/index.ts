import { Request } from 'express'

// Database Types
export interface User {
  id: number
  anonymous_code: string
  real_name?: string
  phone?: string
  email?: string
  password?: string
  date_of_birth?: string
  initial_skills?: string
  location?: string
  ngo_id: string | null
  role: 'VICTIM' | 'STAFF' | 'ADMIN'
  email_verified: boolean
  created_at: string
  updated_at?: string
  last_login_at?: string
  is_active: boolean
  login_attempts: number
  locked_until?: string
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
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Progress {
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

// Alias for Progress to maintain compatibility
export { Progress as UserProgress }

export interface Certificate {
  id: string
  anonymous_code: string
  course_id: string
  course_title: string
  issue_date: string
  verification_code: string
  qr_code: string
  instructor?: string
  institution?: string
  score: number
  max_score: number
  verified: boolean
  verification_date?: string
  verification_ip?: string
  revoked: boolean
  revocation_reason?: string
  created_at: string
}

export interface NGO {
  id: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  license_number?: string
  is_active: boolean
  created_at: string
  updated_at?: string
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
  sector?: string
  nuit?: string
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  location?: string
  ngo_id?: string
  validation_status: EmployerValidationStatus
  validation_notes?: string
  reviewed_by_code?: string
  validation_reviewed_at?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Job {
  id: string
  title: string
  description: string
  location: string
  required_skills: string
  contract_type: string
  schedule?: string
  salary_range?: string
  availability?: string
  work_type?: string
  status: JobStatus
  validation_notes?: string
  is_active: boolean
  ngo_id?: string
  employer_id?: string
  created_at: string
  updated_at?: string
}

export interface JobMatch {
  id: string
  job_id: string
  anonymous_code: string
  ngo_id?: string
  score: number
  shared_skills?: string
  rationale?: string
  status: MatchStatus
  review_type?: string
  ngo_review_notes?: string
  social_review_notes?: string
  rejection_reason?: string
  victim_confirmation_at?: string
  created_at: string
  updated_at?: string
}

export interface JobApplication {
  id: number
  job_id: string
  anonymous_code: string
  job_match_id?: string
  ngo_id?: string
  status: ApplicationStatus
  score: number
  notes?: string
  transition_notes?: string
  last_transition_by_code?: string
  applied_at: string
  submitted_at?: string
  interview_scheduled_at?: string
  interview_completed_at?: string
  offer_made_at?: string
  accepted_at?: string
  placed_at?: string
  withdrawn_at?: string
  rejected_at?: string
  updated_at?: string
}

export interface FollowUpCheckin {
  id: string
  job_application_id: number
  anonymous_code: string
  ngo_id?: string
  period_label: string
  channel: FollowUpChannel
  prompt?: string
  response?: string
  response_code?: string
  status: CheckinStatus
  risk_severity: AlertSeverity
  due_at: string
  responded_at?: string
  created_at: string
  updated_at?: string
}

export interface Alert {
  id: string
  anonymous_code: string
  ngo_id?: string
  job_application_id?: number
  checkin_id?: string
  type: string
  severity: AlertSeverity
  source: string
  status: AlertStatus
  owner_code?: string
  resolution_notes?: string
  created_at: string
  updated_at?: string
  resolved_at?: string
}

export interface AuditLog {
  id: number
  user_code?: string
  action: string
  table_name?: string
  record_id?: string
  old_values?: string
  new_values?: string
  ip_address?: string
  user_agent?: string
  timestamp: string
}

// Encryption Types
export interface EncryptedData {
  iv: string
  tag: string
  encryptedData: string
}

export interface EncryptionResult {
  iv: string
  tag: string
  encryptedData: string
}

// API Request/Response Types
export interface LoginRequest {
  code: string
}

export interface LoginResponse {
  success: boolean
  token: string
  user: {
    anonymousCode: string
    ngoId: string
    role?: string | undefined
    email?: string | undefined
    realName?: string | undefined
    createdAt: string
  }
  expiresIn: string
}

export interface JWTayload {
  anonymousCode: string
  ngoId: string
  role?: string
  email?: string
  sessionId: string
  iat: number
  exp: number
  iss: string
  aud: string
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

export interface QuizSubmissionRequest {
  code: string
  courseId: string
  answers: number[]
}

export interface CertificateGenerationRequest {
  anonymousCode: string
  courseId: string
  score: number
}

export interface CertificateVerificationResponse {
  success: boolean
  valid: boolean
  certificate?: {
    anonymousCode: string
    courseTitle: string
    date: string
    score: number
  }
}

// USSD Types
export interface USSDRequest {
  sessionId: string
  serviceCode: string
  phoneNumber: string
  text: string
}

export interface USSDSession {
  phoneNumber: string
  step: 'welcome' | 'access_code' | 'main_menu' | 'courses_list' | 'course_detail' | 'progress_menu' | 'help_menu'
  data: {
    accessCode?: string
    user?: User
    selectedCourse?: Course
  }
  createdAt: Date
  lastActivity?: Date
}

// Express Extended Types
export interface AuthenticatedRequest extends Request {
  user?: {
    anonymousCode: string
    ngoId: string
    role?: 'VICTIM' | 'STAFF' | 'ADMIN'
    email?: string
    sessionId: string
  }
}

// Cache Types
export interface CacheStats {
  connected: boolean
  memory?: {
    used?: string
    peak?: string
  }
  keyspace?: {
    [key: string]: {
      keys: number
      expires: number
    }
  }
  error?: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime?: number
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'OK' | 'DEGRADED'
  timestamp: string
  uptime: number
  environment: string
  version: string
  services: {
    api: 'online' | 'offline' | 'error'
    ussd: 'online' | 'offline' | 'error'
    database: 'connected' | 'disconnected' | 'error'
    cache: 'online' | 'offline' | 'error' | 'disabled'
    security: {
      rateLimiting: 'active' | 'inactive'
      encryption: 'enabled' | 'disabled'
      validation: 'active' | 'inactive'
    }
  }
  performance?: {
    memory: NodeJS.MemoryUsage
    cpu: NodeJS.CpuUsage
  }
}

export interface SecurityInfoResponse {
  security: {
    rateLimiting: {
      windowMs: number
      maxRequests: number
    }
    encryption: {
      algorithm: string
      enabled: boolean
    }
    validation: {
      enabled: boolean
      strict: boolean
    }
    cors: {
      enabled: boolean
      origins: string[]
    }
  }
  lastUpdated: string
}

// Error Types
export interface APIError extends Error {
  status?: number
  details?: unknown
}

export interface ValidationError {
  field: string
  message: string
  value: unknown
}

export interface ErrorResponse {
  error: string
  message?: string
  details?: ValidationError[]
  requestId?: string
  timestamp?: string
  retryAfter?: number
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Database Query Types
export type QueryCallback<T = unknown> = (err: Error | null, row: T) => void
export type QueryAllCallback<T = unknown> = (err: Error | null, rows: T[]) => void

// Environment Variables Types
export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test'
  PORT: number
  DATABASE_PATH: string
  JWT_SECRET: string
  ENCRYPTION_KEY: string
  CORS_ORIGIN: string
  RATE_LIMIT_WINDOW_MS: number
  RATE_LIMIT_MAX_REQUESTS: number
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug'
  LOG_FILE: string
  REDIS_URL?: string
  REDIS_PASSWORD?: string
  USSD_SESSION_TIMEOUT_MS: number
  USSD_SHORTCODE: string
  SMS_API_KEY?: string
  SMS_USERNAME?: string
  SMS_SENDER?: string
  SMTP_HOST?: string
  SMTP_PORT?: number
  SMTP_USER?: string
  SMTP_PASS?: string
}

// Logger Types
export interface LogContext {
  [key: string]: unknown
}

export interface LogEntry {
  level: string
  message: string
  timestamp: string
  context?: LogContext
}

// Module Types
export interface ModuleExports {
  [key: string]: unknown
}
