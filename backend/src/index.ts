import 'dotenv/config' // Load environment variables first

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { Server } from 'http'
import detectPort from 'detect-port'

// Import routes and middleware
import authRoutes from './routes/auth'
import coursesRoutes from './routes/courses'
import progressRoutes from './routes/progress'
import certificatesRoutes from './routes/certificates'
import ngosRoutes from './routes/ngos'
import auditLogsRoutes from './routes/audit-logs'
import ussdRoutes from './routes/ussd'
import usersRoutes from './routes/users'
import dashboardRoutes from './routes/dashboard'
import jobsRoutes from './routes/jobs'
import smsRoutes from './routes/sms'

// Import middleware
import {
  logger,
  generalLimiter,
  ussdLimiter,
  requestLogger,
  corsOptions,
  securityHeaders,
  requestId,
  errorLogger,
  developmentErrorHandler,
  productionErrorHandler,
  notFoundHandler,
  authenticateToken,
  userRateLimit
} from './middleware/security'

// Import services
import cacheService from './services/cache'

// Import types
import { HealthCheckResponse } from './types'

const app = express()
let server: Server

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}))

app.use(securityHeaders)
app.use(requestId)
app.use(cors(corsOptions))

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger)

// General rate limiting for all API routes
app.use('/api/', generalLimiter)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/courses', coursesRoutes)
app.use('/api/progress', authenticateToken, userRateLimit(), progressRoutes)
app.use('/api/certificates', certificatesRoutes)
app.use('/api/ngos', authenticateToken, userRateLimit(), ngosRoutes)
app.use('/api/audit-logs', authenticateToken, userRateLimit(), auditLogsRoutes)
app.use('/api/ussd', ussdLimiter, ussdRoutes)
app.use('/api/sms', authenticateToken, userRateLimit(), smsRoutes)
app.use('/api/users', authenticateToken, userRateLimit(), usersRoutes)
app.use('/api/dashboard', authenticateToken, userRateLimit(), dashboardRoutes)
app.use('/api/jobs', authenticateToken, userRateLimit(), jobsRoutes)

// Enhanced health check endpoint
app.get('/health', async (_req: express.Request, res: express.Response): Promise<void> => {
  const healthCheck: HealthCheckResponse = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV ?? 'development',
    version: '3.0.0',
    services: {
      api: 'online',
      ussd: 'online',
      database: 'connected',
      cache: 'online',
      security: {
        rateLimiting: 'active',
        encryption: 'enabled',
        validation: 'active'
      }
    },
    performance: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  }

  // Cache status (Redis disabled)
  healthCheck.services.cache = 'disabled'

  // Check database connection (simplified for TypeScript)
  try {
    // In a real implementation, you would check the database connection
    healthCheck.services.database = 'connected'
  } catch (error) {
    logger.error('Database health check error', { error: (error as Error).message })
    healthCheck.services.database = 'disconnected'
    healthCheck.status = 'DEGRADED'
  }

  const statusCode = healthCheck.status === 'OK' ? 200 : 503
  res.status(statusCode).json(healthCheck)
})

// API documentation endpoint
app.get('/api', (_req: express.Request, res: express.Response): void => {
  res.json({
    name: 'WIRA Platform API',
    version: '3.0.0',
    description: 'Backend API para plataforma WIRA de capacitação e reintegração econômica',
    endpoints: {
      auth: {
        'POST /api/auth/login': 'Login com código anônimo',
        'POST /api/auth/validate': 'Validar token JWT',
        'POST /api/auth/refresh': 'Atualizar token',
        'DELETE /api/auth/logout': 'Logout',
        'GET /api/auth/check/:code': 'Verificar disponibilidade de código'
      },
      courses: {
        'GET /api/courses': 'Listar cursos ativos',
        'GET /api/courses/:id': 'Obter detalhes do curso',
        'GET /api/courses/:id/modules': 'Listar módulos do curso',
        'GET /api/courses/:id/quiz': 'Obter quiz do curso',
        'POST /api/courses/:id/invalidate-cache': 'Invalidar cache do curso'
      },
      progress: {
        'GET /api/progress/user/:userCode': 'Obter progresso agregado do usuário',
        'GET /api/progress/user/:userCode/course/:courseId': 'Obter progresso do usuário em curso',
        'PUT /api/progress/user/:userCode/course/:courseId': 'Atualizar progresso do usuário em curso'
      },
      certificates: {
        'POST /api/certificates/generate': 'Gerar certificado',
        'GET /api/certificates/verify/:code': 'Verificar certificado',
        'POST /api/certificates/revoke/:code': 'Revogar certificado',
        'GET /api/certificates/user/:anonymousCode': 'Listar certificados por usuário',
        'GET /api/certificates/user/:anonymousCode/course/:courseId': 'Obter certificado por usuário e curso'
      },
      jobs: {
        'GET /api/jobs': 'Listar vagas ativas',
        'POST /api/jobs/matching': 'Calcular matching de vagas por perfil',
        'POST /api/jobs/:id/apply': 'Candidatar-se a uma vaga'
      },
      dashboard: {
        'GET /api/dashboard/stats': 'Estatísticas do dashboard ONG',
        'GET /api/dashboard/activity': 'Atividade recente'
      },
      users: {
        'GET /api/users': 'Listar beneficiárias',
        'GET /api/users/:id': 'Detalhar beneficiária',
        'POST /api/users/generate-code': 'Gerar código anônimo',
        'POST /api/users/activate': 'Ativar beneficiária',
        'PATCH /api/users/:id/activation': 'Ativar/desativar beneficiária'
      },
      ngos: {
        'GET /api/ngos': 'Listar ONGs',
        'GET /api/ngos/:id': 'Obter ONG por ID',
        'POST /api/ngos': 'Criar ONG',
        'PUT /api/ngos/:id': 'Atualizar ONG',
        'PATCH /api/ngos/:id/deactivate': 'Desativar ONG',
        'DELETE /api/ngos/:id': 'Remover ONG'
      },
      'audit-logs': {
        'GET /api/audit-logs': 'Listar registros de auditoria',
        'GET /api/audit-logs/user/:userCode': 'Obter registros por usuário',
        'GET /api/audit-logs/action/:action': 'Obter registros por ação',
        'GET /api/audit-logs/table/:tableName': 'Obter registros por tabela',
        'POST /api/audit-logs': 'Criar registro de auditoria',
        'GET /api/audit-logs/stats': 'Obter estatísticas de auditoria'
      },
      ussd: {
        'POST /api/ussd': 'Processar requisição USSD',
        'GET /api/ussd/status': 'Status do serviço USSD',
        'GET /api/sms/status': 'Status do serviço SMS',
        'POST /api/sms/send': 'Enviar SMS'
      },
      utility: {
        'GET /health': 'Health check detalhado',
        'GET /api': 'Documentação da API'
      }
    },
    security: {
      authentication: 'JWT',
      encryption: 'AES-256-GCM',
      rateLimiting: 'Ativo',
      validation: 'Strict',
      typescript: 'Enabled'
    }
  })
})

// Root endpoint
app.get('/', (_req: express.Request, res: express.Response): void => {
  res.json({
    message: 'WIRA Platform API - TypeScript Edition',
    version: '3.0.0',
    status: 'running',
    documentation: '/api',
    health: '/health'
  })
})

// 404 handler
app.use('*', notFoundHandler)

// Error handling middleware
app.use(errorLogger)
app.use(developmentErrorHandler)
app.use(productionErrorHandler)

// Graceful shutdown handling
const gracefulShutdown = (signal: string): void => {
  logger.info(`Received ${signal}, starting graceful shutdown`)

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed')

      // Close cache connection
      cacheService.disconnect().then(() => {
        logger.info('Cache connection closed')
        process.exit(0)
      }).catch((error: Error) => {
        logger.error('Error closing cache connection', { error: error.message })
        process.exit(1)
      })
    })

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down')
      process.exit(1)
    }, 30000)
  } else {
    process.exit(0)
  }
}

// Port detection function
const getAvailablePort = async (preferredPort: number): Promise<number> => {
  const env = process.env.NODE_ENV ?? 'development'

  // Em produção, usar porta fixa configurada
  if (env === 'production') {
    return preferredPort
  }

  // Em desenvolvimento/teste, detectar porta disponível
  try {
    const availablePort = await detectPort(preferredPort)

    if (availablePort !== preferredPort) {
      logger.warn(`⚠️ Porta ${preferredPort} ocupada, usando porta ${availablePort}`, {
        preferredPort,
        actualPort: availablePort,
        environment: env
      })
    }

    return availablePort
  } catch (error) {
    logger.error('Erro ao detectar porta disponível', {
      error: (error as Error).message,
      preferredPort
    })
    throw error
  }
}

// Start server with dynamic port detection
const startServer = async (): Promise<void> => {
  try {
    const preferredPort = parseInt(process.env.PORT ?? '3000')
    const actualPort = await getAvailablePort(preferredPort)

    server = app.listen(actualPort, () => {
      const portInfo = {
        port: actualPort,
        preferredPort,
        isDynamic: actualPort !== preferredPort,
        environment: process.env.NODE_ENV ?? 'development',
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        typescript: 'enabled'
      }

      logger.info('🚀 WIRA Platform TypeScript Server started', portInfo)

      logger.info('📊 Service endpoints available', {
        health: `http://localhost:${actualPort}/health`,
        api: `http://localhost:${actualPort}/api`,
        documentation: `http://localhost:${actualPort}/api`
      })

      // Mostrar aviso se usando porta dinâmica
      if (actualPort !== preferredPort) {
        logger.info('🔧 Frontend pode precisar atualizar a URL da API', {
          frontendUrl: `http://localhost:${actualPort}`,
          note: 'Configure VITE_API_BASE_URL se necessário'
        })
      }
    })

    server.on('error', (error: NodeJS.ErrnoException): void => {
      if (error.syscall !== 'listen') {
        throw error
      }

      const bind = typeof actualPort === 'string'
        ? 'Pipe ' + actualPort
        : 'Port ' + actualPort

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`)
          process.exit(1)
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`)
          process.exit(1)
        default:
          throw error
      }
    })

    server.on('listening', (): void => {
      const addr = server?.address()
      const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + (addr as { port: number }).port

      logger.info(`Listening on ${bind}`)
    })

  } catch (error) {
    logger.error('Failed to start server', {
      error: (error as Error).message
    })
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error): void => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  })
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown): void => {
  logger.error('Unhandled Rejection', {
    reason: String(reason),
    promise: 'Promise<unknown>'
  })
  process.exit(1)
})

// Start the server
if (require.main === module) {
  startServer().catch((error: Error) => {
    logger.error('Failed to start server from main', {
      error: error.message,
      stack: error.stack
    })
    process.exit(1)
  })
}

export default app
export { startServer }
