import winston from 'winston'
import { Course, Progress, USSDSession, CacheStats, RateLimitResult } from '../types'

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

type CacheEntry = {
  value: string
  expiresAt: number | null
}

class CacheService {
  private readonly isRedisEnabled: boolean = false
  private readonly store = new Map<string, CacheEntry>()

  constructor() {
    logger.info('CacheService initialized (memory mode)')
  }

  private isExpired(entry: CacheEntry): boolean {
    return entry.expiresAt !== null && entry.expiresAt <= Date.now()
  }

  private getEntry(key: string): CacheEntry | null {
    const entry = this.store.get(key) ?? null
    if (!entry) {
      return null
    }

    if (this.isExpired(entry)) {
      this.store.delete(key)
      return null
    }

    return entry
  }

  // Connection methods (no-op)
  async connect(): Promise<void> {
    logger.debug('CacheService.connect() called (Redis disabled)')
    // No-op - Redis is disabled
  }

  async disconnect(): Promise<void> {
    logger.debug('CacheService.disconnect() called (Redis disabled)')
    // No-op - Redis is disabled
  }

  async get(key: string): Promise<string | null> {
    return this.getEntry(key)?.value ?? null
  }

  async set(key: string, value: string, expireInSeconds?: number): Promise<boolean> {
    this.store.set(key, {
      value,
      expiresAt: typeof expireInSeconds === 'number' ? Date.now() + expireInSeconds * 1000 : null
    })
    return true
  }

  async del(key: string): Promise<boolean> {
    return this.store.delete(key)
  }

  async exists(key: string): Promise<boolean> {
    return this.getEntry(key) !== null
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const entry = this.getEntry(key)
    if (!entry) {
      return false
    }

    entry.expiresAt = Date.now() + seconds * 1000
    this.store.set(key, entry)
    return true
  }

  async ttl(key: string): Promise<number> {
    const entry = this.getEntry(key)
    if (!entry) {
      return -2
    }

    if (entry.expiresAt === null) {
      return -1
    }

    return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000))
  }

  async hGet(key: string, field: string): Promise<string | null> {
    const data = await this.getJSON<Record<string, string>>(key)
    return data?.[field] ?? null
  }

  async hSet(key: string, field: string, value: string): Promise<boolean> {
    const data = (await this.getJSON<Record<string, string>>(key)) ?? {}
    data[field] = value
    return this.setJSON(key, data)
  }

  async hDel(key: string, field: string): Promise<boolean> {
    const data = (await this.getJSON<Record<string, string>>(key)) ?? {}
    if (!(field in data)) {
      return false
    }
    delete data[field]
    return this.setJSON(key, data)
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return (await this.getJSON<Record<string, string>>(key)) ?? {}
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.get(key)
    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async setJSON<T>(key: string, value: T, expireInSeconds?: number): Promise<boolean> {
    return this.set(key, JSON.stringify(value), expireInSeconds)
  }

  async lPush(key: string, ...values: string[]): Promise<number> {
    const existing = (await this.getJSON<string[]>(key)) ?? []
    existing.unshift(...values)
    await this.setJSON(key, existing)
    return existing.length
  }

  async rPop(key: string): Promise<string | null> {
    const existing = (await this.getJSON<string[]>(key)) ?? []
    const value = existing.pop() ?? null
    await this.setJSON(key, existing)
    return value
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    const existing = (await this.getJSON<string[]>(key)) ?? []
    const normalizedStop = stop < 0 ? existing.length : stop + 1
    return existing.slice(start, normalizedStop)
  }

  async sAdd(key: string, ...members: string[]): Promise<number> {
    const set = new Set((await this.getJSON<string[]>(key)) ?? [])
    members.forEach(member => set.add(member))
    await this.setJSON(key, [...set])
    return set.size
  }

  async sRem(key: string, ...members: string[]): Promise<number> {
    const set = new Set((await this.getJSON<string[]>(key)) ?? [])
    let removed = 0
    members.forEach(member => {
      if (set.delete(member)) {
        removed += 1
      }
    })
    await this.setJSON(key, [...set])
    return removed
  }

  async sMembers(key: string): Promise<string[]> {
    return (await this.getJSON<string[]>(key)) ?? []
  }

  async cacheCourse(courseId: string, course: Course, expireInSeconds?: number): Promise<boolean> {
    return this.setJSON(`course:${courseId}`, course, expireInSeconds)
  }

  async getCachedCourse(courseId: string): Promise<Course | null> {
    return this.getJSON<Course>(`course:${courseId}`)
  }

  async cacheProgress(userCode: string, courseId: string, progress: Progress, expireInSeconds?: number): Promise<boolean> {
    return this.setJSON(`progress:${userCode}:${courseId}`, progress, expireInSeconds)
  }

  async getCachedProgress(userCode: string, courseId: string): Promise<Progress | null> {
    return this.getJSON<Progress>(`progress:${userCode}:${courseId}`)
  }

  async cacheUSSDSession(sessionId: string, session: USSDSession, expireInSeconds?: number): Promise<boolean> {
    return this.setJSON(`ussd:${sessionId}`, session, expireInSeconds)
  }

  async getCachedUSSDSession(sessionId: string): Promise<USSDSession | null> {
    return this.getJSON<USSDSession>(`ussd:${sessionId}`)
  }

  async invalidateUserCache(userCode: string): Promise<boolean> {
    return this.invalidatePattern(userCode)
  }

  async invalidateCourseCache(courseId: string): Promise<boolean> {
    return this.invalidatePattern(courseId)
  }

  async invalidatePattern(pattern: string): Promise<boolean> {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
    const regex = new RegExp(escaped)
    let removed = 0

    for (const key of this.store.keys()) {
      if (regex.test(key) || key.includes(pattern)) {
        this.store.delete(key)
        removed += 1
      }
    }

    return removed > 0
  }

  async checkRateLimit(identifier: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    logger.debug(`CacheService.checkRateLimit() called for identifier: ${identifier} (memory mode pass-through)`)
    return {
      allowed: true,
      remaining: limit,
      resetTime: Date.now() + windowMs
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    return {
      status: 'healthy',
      message: `Memory cache active with ${this.store.size} entr${this.store.size === 1 ? 'y' : 'ies'}`
    }
  }

  async getStats(): Promise<CacheStats> {
    return {
      connected: true,
      memory: {
        used: `${this.store.size} entries`,
        peak: `${this.store.size} entries`
      }
    }
  }

  async flushAll(): Promise<boolean> {
    this.store.clear()
    return true
  }

  async ping(): Promise<boolean> {
    return true
  }

  getClient(): null {
    return null
  }

  isRedisConnected(): boolean {
    return true
  }

  async warmupCache(): Promise<void> {
    logger.debug('CacheService.warmupCache() called (memory mode)')
  }
}

// Create and export singleton instance
const cacheService = new CacheService()

export default cacheService
