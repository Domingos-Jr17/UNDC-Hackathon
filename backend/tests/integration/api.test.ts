import request from 'supertest'
import app from '../../src/index.secure'

describe('API Integration', () => {
  test('GET /health should return service status', async () => {
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBeDefined()
    expect(response.body.services).toBeDefined()
    expect(response.body.services.api).toBe('online')
  })

  test('GET /api should expose endpoint documentation', async () => {
    const response = await request(app).get('/api')

    expect(response.status).toBe(200)
    expect(response.body.name).toContain('WIRA')
    expect(response.body.endpoints).toBeDefined()
    expect(response.body.endpoints.auth).toBeDefined()
  })

  test('POST /api/auth/validate without token should return 401', async () => {
    const response = await request(app).post('/api/auth/validate')

    expect(response.status).toBe(401)
    expect(response.body.error).toBeDefined()
  })

  test('Unknown route should return 404', async () => {
    const response = await request(app).get('/api/unknown-route')

    expect(response.status).toBe(404)
    expect(response.body.error).toBeDefined()
  })
})
