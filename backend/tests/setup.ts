process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-32-characters-long'
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? 'test-encryption-key-32-characters-long'
process.env.ENCRYPTION_SALT = process.env.ENCRYPTION_SALT ?? 'wira-test-salt'
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000'
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ?? '900000'
process.env.RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS ?? '100'
process.env.LOG_LEVEL = 'error'

jest.setTimeout(10000)

beforeEach(() => {
  jest.clearAllMocks()
})
