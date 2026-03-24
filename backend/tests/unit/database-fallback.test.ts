import { isDatabaseUnavailableError } from '../../src/services/databaseFallback'

describe('database fallback detection', () => {
  test('detects Prisma connectivity failures', () => {
    expect(isDatabaseUnavailableError(new Error("Can't reach database server at host:6543"))).toBe(true)
    expect(isDatabaseUnavailableError(new Error('PrismaClientInitializationError: P1001 connection failed'))).toBe(true)
  })

  test('ignores unrelated errors', () => {
    expect(isDatabaseUnavailableError(new Error('Validation error'))).toBe(false)
    expect(isDatabaseUnavailableError('plain string')).toBe(false)
  })
})
