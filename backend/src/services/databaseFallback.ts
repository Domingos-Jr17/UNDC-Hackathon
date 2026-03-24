import { logger } from '../middleware/security'

const DATABASE_UNAVAILABLE_MARKERS = [
  "Can't reach database server",
  'PrismaClientInitializationError',
  'P1001',
  'ECONNREFUSED',
  'ETIMEDOUT'
]

export const isDatabaseUnavailableError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false
  }

  return DATABASE_UNAVAILABLE_MARKERS.some(marker => error.message.includes(marker))
}

export const logDatabaseFallback = (context: string, error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error)

  logger.warn(`Primary Prisma database unavailable, using local fallback for ${context}`, {
    error: message,
    context
  })
}
