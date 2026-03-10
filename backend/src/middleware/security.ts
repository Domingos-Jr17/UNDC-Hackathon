import { default as rateLimit } from 'express-rate-limit'
import { body, validationResult } from 'express-validator'
import type { ValidationChain } from 'express-validator'
import jwt from 'jsonwebtoken'
import winston from 'winston'
import express, { Request, Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types'
import prismaService from '../services/prisma'

// Logger configuration
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
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/app.log'
    })
  ]
})

const prisma = prismaService.getClient()

// Rate limiting middleware factory
const createRateLimit = (windowMs: number, max: number, message: string): express.RequestHandler => {
  return (rateLimit as any)({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        route: req.path
      })

      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      })
    }
  }) as express.RequestHandler
}

// Different rate limits for different endpoints
export const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // 10 requests per 15 minutes
  'Muitas tentativas de login. Tente novamente em 15 minutos.'
)

export const generalLimiter = createRateLimit(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'), // 15 minutes
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100'), // 100 requests per 15 minutes
  'Muitas requisiÃ§Ãµes. Tente novamente mais tarde.'
)

export const ussdLimiter = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  20, // 20 USSD requests per 5 minutes
  'Muitas requisiÃ§Ãµes USSD. Tente novamente em 5 minutos.'
)

// Input validation rules
export const validateLogin: ValidationChain[] = [
  body('code')
    .matches(/^V\d{4}$/i)
    .withMessage('CÃ³digo de acesso deve estar no formato V#### (ex: V0042)')
    .isLength({ min: 5, max: 5 })
    .withMessage('CÃ³digo deve ter exatamente 5 caracteres')
]

// Validation rules for staff email/password login
export const validateStaffLogin: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Email invÃ¡lido')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email muito longo'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .isLength({ max: 128 })
    .withMessage('Senha muito longa')
]

export const validateCertificateGeneration: ValidationChain[] = [
  body('anonymousCode')
    .matches(/^V\d{4}$/i)
    .withMessage('CÃ³digo anÃ´nimo invÃ¡lido'),
  body('courseId')
    .isIn(['costura', 'culinaria', 'agricultura'])
    .withMessage('ID de curso invÃ¡lido'),
  body('score')
    .isInt({ min: 0, max: 100 })
    .withMessage('PontuaÃ§Ã£o deve ser entre 0 e 100')
]

export const validateQuizSubmission: ValidationChain[] = [
  body('code')
    .matches(/^V\d{4}$/i)
    .withMessage('CÃ³digo de acesso invÃ¡lido'),
  body('courseId')
    .isIn(['costura', 'culinaria', 'agricultura'])
    .withMessage('ID de curso invÃ¡lido'),
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Respostas devem ser um array com pelo menos um elemento'),
  body('answers.*')
    .isInt({ min: 0 })
    .withMessage('Cada resposta deve ser um nÃºmero inteiro')
]

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    logger.warn('Validation error', {
      errors: errors.array(),
      ip: req.ip,
      route: req.path
    })

    res.status(400).json({
      error: 'Dados invÃ¡lidos',
      details: errors.array().map((err) => ({
        field: (err as { param?: string; path?: string }).param ?? (err as { param?: string; path?: string }).path,
        message: err.msg,
        value: (err as { value?: unknown }).value
      }))
    })
    return
  }

  next()
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start

    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })
  })

  next()
}

// Function to generate dynamic CORS origins based on current port
const generateDynamicOrigins = (port: number): string[] => {
  const env = process.env.NODE_ENV ?? 'development'

  // In production, use fixed origins
  if (env === 'production') {
    return process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []
  }

  // In development, generate origins for common frontend ports
  const dynamicOrigins = [
    // Always allow the current backend port
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,

    // Common frontend development ports (expanded range)
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173',  // Vite default
    'http://localhost:5174',  // Vite alternative
    'http://localhost:5175',  // Additional Vite port
    'http://localhost:5176',  // Additional Vite port
    'http://localhost:8081',  // React Native Web / Expo web dev server
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176',
    'http://127.0.0.1:8081'
  ]

  // Allow additional ports from environment variable
  const additionalPorts = process.env.DEV_FRONTEND_PORTS?.split(',')?.map(p => parseInt(p.trim())) || []

  additionalPorts.forEach(additionalPort => {
    if (!isNaN(additionalPort)) {
      dynamicOrigins.push(`http://localhost:${additionalPort}`)
      dynamicOrigins.push(`http://127.0.0.1:${additionalPort}`)
    }
  })

  return [...new Set(dynamicOrigins)] // Remove duplicates
}

const isLocalhostOrigin = (origin: string): boolean => {
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
}

// CORS configuration with dynamic port support
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void {
    const env = process.env.NODE_ENV ?? 'development'

    // Get current port from environment or default
    const currentPort = parseInt(process.env.PORT || '3000')

    // Generate allowed origins based on current port
    const allowedOrigins = generateDynamicOrigins(currentPort)

    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true)

    // In development, allow any localhost origin (covers Expo / React Native web ports)
    if (env !== 'production' && isLocalhostOrigin(origin)) {
      return callback(null, true)
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      logger.warn('CORS violation', {
        origin,
        allowedOrigins: allowedOrigins.slice(0, 5), // Log first 5 origins to avoid spam
        currentPort,
        environment: process.env.NODE_ENV || 'development'
      })
      callback(new Error('NÃ£o permitido por CORS'))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}

// JWT Authentication middleware
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (!token) {
    res.status(401).json({
      error: 'Token de autenticaÃ§Ã£o nÃ£o fornecido'
    })
    return
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    logger.error('JWT_SECRET environment variable is not set')
    res.status(500).json({
      error: 'Erro interno do servidor'
    })
    return
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      logger.warn('Invalid token attempt', {
        error: err.message,
        ip: req.ip,
        token: token.substring(0, 10) + '...'
      })

      res.status(403).json({
        error: 'Token invÃ¡lido ou expirado'
      })
      return
    }

    req.user = user as { anonymousCode: string; ngoId: string; sessionId: string; iat: number; exp: number }
    next()
  })
}

// Role-based authentication middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Token de autenticaÃ§Ã£o nÃ£o fornecido'
      })
      return
    }

    const userRole = (req.user as any).role
    if (!userRole || !allowedRoles.includes(userRole)) {
      logger.warn('Unauthorized access attempt', {
        userRole,
        allowedRoles,
        ip: req.ip,
        route: req.path
      })

      res.status(403).json({
        error: 'Acesso nÃ£o autorizado para esta funÃ§Ã£o'
      })
      return
    }

    next()
  }
}

// Middleware for NGO staff routes (STAFF and ADMIN roles)
export const requireStaffRole = requireRole(['STAFF', 'ADMIN'])

// Middleware for admin only routes
export const requireAdminRole = requireRole(['ADMIN'])

export const isPrivilegedRole = (role?: string): boolean => role === 'STAFF' || role === 'ADMIN'

export const canAccessAnonymousCode = (
  actor: { anonymousCode: string; role?: string } | undefined,
  targetAnonymousCode: string
): boolean => {
  if (!actor) {
    return false
  }

  if (isPrivilegedRole(actor.role)) {
    return true
  }

  return actor.anonymousCode.toUpperCase() === targetAnonymousCode.toUpperCase()
}

// Input sanitization middleware
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      const value = req.query[key]
      if (typeof value === 'string') {
        req.query[key] = value.trim()
      }
    })
  }

  // Sanitize body parameters
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      const value = req.body[key]
      if (typeof value === 'string') {
        ; (req.body as Record<string, unknown>)[key] = value.trim()
      }
    })
  }

  next()
}

// Security headers middleware
export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Remove Express-powered-by header
  res.removeHeader('X-Powered-By')

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  next()
}

// Request ID middleware for tracking
export const requestId = (req: Request & { id?: string }, res: Response, next: NextFunction): void => {
  req.id = Math.random().toString(36).substring(2, 15)
  res.setHeader('X-Request-ID', req.id)
  next()
}

// Error logging middleware
export const errorLogger = (err: Error, req: Request, _res: Response, next: NextFunction): void => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: (req as Request & { id?: string }).id
  })

  next(err)
}

// Development error handler
export const developmentErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  if ((process.env.NODE_ENV ?? 'development') === 'development') {
    res.status((err as Error & { status?: number }).status ?? 500).json({
      error: 'Erro interno do servidor',
      message: err.message,
      stack: err.stack,
      requestId: (req as Request & { id?: string }).id
    })
  } else {
    next(err)
  }
}

// Production error handler
export const productionErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  if ((process.env.NODE_ENV ?? 'development') === 'production') {
    res.status((err as Error & { status?: number }).status ?? 500).json({
      error: 'Erro interno do servidor',
      requestId: (req as Request & { id?: string }).id
    })
  } else {
    next(err)
  }
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('404 Not Found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  res.status(404).json({
    error: 'Endpoint nÃ£o encontrado',
    path: req.originalUrl,
    method: req.method
  })
}

// Rate limiting by user (for authenticated routes)
const userRequestBuckets = new Map<string, { count: number; resetAt: number }>()
const USER_RATE_LIMIT_ACTION = 'USER_RATE_LIMIT_TRACK'

const getUserRateLimitMode = (): 'memory' | 'database' => {
  const configuredMode = (process.env.USER_RATE_LIMIT_STORE ?? '').trim().toLowerCase()

  if (configuredMode === 'database') {
    return 'database'
  }

  if (configuredMode === 'memory') {
    return 'memory'
  }

  return (process.env.NODE_ENV ?? 'development') === 'production' ? 'database' : 'memory'
}

const consumeUserRateLimitFromDatabase = async (
  userCode: string,
  route: string,
  method: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfter?: number }> => {
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMs)

  const countInWindow = await prisma.auditLog.count({
    where: {
      user_code: userCode,
      action: USER_RATE_LIMIT_ACTION,
      timestamp: { gte: windowStart }
    }
  })

  if (countInWindow >= maxRequests) {
    const oldestInWindow = await prisma.auditLog.findFirst({
      where: {
        user_code: userCode,
        action: USER_RATE_LIMIT_ACTION,
        timestamp: { gte: windowStart }
      },
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true }
    })

    const resetAt = oldestInWindow
      ? oldestInWindow.timestamp.getTime() + windowMs
      : now.getTime() + windowMs

    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((resetAt - now.getTime()) / 1000))
    }
  }

  await prisma.auditLog.create({
    data: {
      user_code: userCode,
      action: USER_RATE_LIMIT_ACTION,
      table_name: 'rate_limit',
      record_id: route,
      new_values: JSON.stringify({ method, route, trackedAt: now.toISOString() })
    }
  })

  if (Math.random() < 0.03) {
    await prisma.auditLog.deleteMany({
      where: {
        action: USER_RATE_LIMIT_ACTION,
        timestamp: { lt: new Date(now.getTime() - windowMs * 2) }
      }
    })
  }

  return { allowed: true }
}

export const userRateLimit = (): express.RequestHandler => {
  const windowMs = 15 * 60 * 1000
  const maxRequests = 120

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      next()
      return
    }

    const key = req.user.anonymousCode

    if (getUserRateLimitMode() === 'database') {
      try {
        const result = await consumeUserRateLimitFromDatabase(
          key,
          req.path,
          req.method,
          maxRequests,
          windowMs
        )

        if (!result.allowed) {
          res.status(429).json({
            error: 'Limite de requisições por usuário excedido. Tente novamente mais tarde.',
            retryAfter: result.retryAfter ?? Math.ceil(windowMs / 1000)
          })
          return
        }

        next()
        return
      } catch (error) {
        logger.warn('Database user rate limit unavailable, falling back to memory', {
          error: (error as Error).message,
          userCode: key
        })
      }
    }

    const now = Date.now()
    const current = userRequestBuckets.get(key)

    if (!current || current.resetAt <= now) {
      userRequestBuckets.set(key, {
        count: 1,
        resetAt: now + windowMs
      })
      next()
      return
    }

    if (current.count >= maxRequests) {
      res.status(429).json({
        error: 'Limite de requisições por usuário excedido. Tente novamente mais tarde.',
        retryAfter: Math.ceil((current.resetAt - now) / 1000)
      })
      return
    }

    current.count += 1
    userRequestBuckets.set(key, current)

    next()
  }
}

// IP-based rate limiting for sensitive operations
export const ipRateLimit = (max: number, windowMs: number): express.RequestHandler => {
  return createRateLimit(windowMs, max, 'Muitas tentativas deste IP. Tente novamente mais tarde.')
}

// Validate anonymous code format
export const validateAnonymousCode = (code: string): boolean => {
  return /^V\d{4}$/i.test(code.toUpperCase())
}

// Mask sensitive data for logging
export const maskSensitiveData = (data: Record<string, unknown>): Record<string, unknown> => {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const masked = { ...data }

  // Mask common sensitive fields
  const sensitiveFields = ['password', 'token', 'key', 'secret', 'real_name', 'phone', 'email']

  sensitiveFields.forEach(field => {
    if (masked[field]) {
      const value = String(masked[field])
      if (value.length > 4) {
        masked[field] = value.substring(0, 2) + '***' + value.substring(value.length - 2)
      } else {
        masked[field] = '***'
      }
    }
  })

  return masked
}

// Export logger for use in other modules
export { logger }



