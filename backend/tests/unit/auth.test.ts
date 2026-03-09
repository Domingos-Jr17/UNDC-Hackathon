import request from 'supertest'
import jwt from 'jsonwebtoken'

jest.mock('../../src/models/User', () => ({
  __esModule: true,
  default: {
    findUnique: jest.fn(),
    resetLoginAttempts: jest.fn(),
    validateStaffCredentials: jest.fn(),
    updateLastLogin: jest.fn()
  }
}))

import app from '../../src/index.secure'
import UserModel from '../../src/models/User'

const mockedUserModel = UserModel as unknown as {
  findUnique: jest.Mock
  resetLoginAttempts: jest.Mock
  validateStaffCredentials: jest.Mock
  updateLastLogin: jest.Mock
}

describe('Auth Routes', () => {
  beforeEach(() => {
    mockedUserModel.findUnique.mockReset()
    mockedUserModel.resetLoginAttempts.mockReset()
    mockedUserModel.validateStaffCredentials.mockReset()
    mockedUserModel.updateLastLogin.mockReset()
  })

  test('POST /api/auth/login should authenticate valid anonymous code', async () => {
    mockedUserModel.findUnique.mockResolvedValue({
      anonymous_code: 'V0042',
      ngo_id: 'ngo-001',
      role: 'VICTIM',
      created_at: new Date().toISOString(),
      locked_until: null
    })
    mockedUserModel.resetLoginAttempts.mockResolvedValue(undefined)

    const response = await request(app)
      .post('/api/auth/login')
      .send({ code: 'V0042' })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.token).toBeDefined()
    expect(response.body.user.anonymousCode).toBe('V0042')
  })

  test('POST /api/auth/login should reject unknown code', async () => {
    mockedUserModel.findUnique.mockResolvedValue(null)

    const response = await request(app)
      .post('/api/auth/login')
      .send({ code: 'V9999' })

    expect(response.status).toBe(401)
    expect(response.body.error).toBeDefined()
  })

  test('POST /api/auth/staff/login should authenticate staff credentials', async () => {
    mockedUserModel.validateStaffCredentials.mockResolvedValue({
      anonymous_code: 'A0001',
      email: 'staff@wira.org',
      ngo_id: 'ngo-001',
      role: 'STAFF',
      created_at: new Date().toISOString(),
      locked_until: null
    })
    mockedUserModel.updateLastLogin.mockResolvedValue(undefined)

    const response = await request(app)
      .post('/api/auth/staff/login')
      .send({ email: 'staff@wira.org', password: 'Staff@2026' })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.user.anonymousCode).toBe('A0001')
  })

  test('GET /api/auth/check/:code should validate format', async () => {
    const response = await request(app).get('/api/auth/check/invalid')

    expect(response.status).toBe(400)
    expect(response.body.error).toContain('formato')
  })

  test('POST /api/auth/refresh should reject invalid token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', 'Bearer invalid-token')

    expect(response.status).toBe(401)
    expect(response.body.error).toBeDefined()
  })

  test('POST /api/auth/refresh should preserve role, ngoId and audience claims', async () => {
    const jwtSecret = process.env.JWT_SECRET ?? 'test-jwt-secret-32-characters-long'
    const originalToken = jwt.sign(
      {
        anonymousCode: 'A0001',
        ngoId: 'ngo-001',
        role: 'STAFF',
        email: 'staff@wira.org',
        sessionId: 'old-session'
      },
      jwtSecret,
      {
        expiresIn: '1h',
        issuer: 'wira-platform',
        audience: 'wira-dashboard'
      }
    )

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${originalToken}`)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.token).toBeDefined()

    const decoded = jwt.verify(response.body.token as string, jwtSecret) as jwt.JwtPayload
    expect(decoded.anonymousCode).toBe('A0001')
    expect(decoded.ngoId).toBe('ngo-001')
    expect(decoded.role).toBe('STAFF')
    expect(decoded.aud).toBe('wira-dashboard')
  })
})
