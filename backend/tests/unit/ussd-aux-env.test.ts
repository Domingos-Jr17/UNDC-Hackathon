import request from 'supertest'

describe('USSD auxiliary endpoints environment guard', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalAuxFlag = process.env.ENABLE_USSD_AUX_ENDPOINTS

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
    process.env.ENABLE_USSD_AUX_ENDPOINTS = originalAuxFlag
    jest.resetModules()
  })

  test('POST /api/ussd/test should be disabled by default in production', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.ENABLE_USSD_AUX_ENDPOINTS
    jest.resetModules()

    const express = (await import('express')).default
    const ussdRoutes = (await import('../../src/routes/ussd')).default
    const app = express()
    app.use(express.json())
    app.use('/api/ussd', ussdRoutes)

    const response = await request(app)
      .post('/api/ussd/test')
      .send({ phoneNumber: '+258841234567', text: '' })

    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
    expect(response.body.error).toContain('indisponivel')
  })
})
