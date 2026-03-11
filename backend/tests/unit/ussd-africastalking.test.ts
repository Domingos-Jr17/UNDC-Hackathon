import request from 'supertest'

const prismaMock = {
  ussdSession: {
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    findUnique: jest.fn().mockResolvedValue(null),
    upsert: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0)
  },
  user: {
    findUnique: jest.fn().mockResolvedValue(null)
  },
  progress: {
    findMany: jest.fn().mockResolvedValue([])
  }
}

jest.mock('../../src/services/prisma', () => ({
  __esModule: true,
  default: {
    getClient: () => prismaMock
  }
}))

jest.mock('../../src/services/smsProvider', () => ({
  __esModule: true,
  default: {
    getStatus: () => ({ providerMode: 'sandbox', provider: 'sandbox' }),
    send: jest.fn()
  }
}))

jest.mock('../../src/middleware/security', () => ({
  __esModule: true,
  authenticateToken: (_req: unknown, _res: unknown, next: () => void) => next(),
  ipRateLimit: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}))

describe('Africa\'s Talking USSD callback compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    prismaMock.ussdSession.findUnique.mockResolvedValue(null)
  })

  test('POST /api/ussd responds as text/plain with CON/END body', async () => {
    const express = (await import('express')).default
    const ussdRoutes = (await import('../../src/routes/ussd')).default
    const app = express()

    app.use(express.urlencoded({ extended: true }))
    app.use(express.json())
    app.use('/api/ussd', ussdRoutes)

    const response = await request(app)
      .post('/api/ussd')
      .type('form')
      .send({
        sessionId: 'at-session-1',
        serviceCode: '*384*36224#',
        phoneNumber: '+258841234567',
        text: ''
      })

    expect(response.status).toBe(200)
    expect(response.type).toBe('text/plain')
    expect(response.text.startsWith('CON ')).toBe(true)
    expect(response.text).toContain('WIRA')
  })
})
