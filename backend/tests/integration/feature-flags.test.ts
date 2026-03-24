import request from 'supertest'

const loadApp = async (enabled: boolean) => {
  process.env.FOLLOW_UP_ALERTS_PHASE2_ENABLED = enabled ? 'true' : 'false'
  jest.resetModules()

  const module = await import('../../src/index.secure')
  return module.default
}

describe('Phase 2 feature gating', () => {
  const originalFlag = process.env.FOLLOW_UP_ALERTS_PHASE2_ENABLED

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.FOLLOW_UP_ALERTS_PHASE2_ENABLED
    } else {
      process.env.FOLLOW_UP_ALERTS_PHASE2_ENABLED = originalFlag
    }
  })

  test('hides checkins and alerts when phase 2 is disabled', async () => {
    const app = await loadApp(false)

    const docsResponse = await request(app).get('/api')
    expect(docsResponse.status).toBe(200)
    expect(docsResponse.body.endpoints.checkins).toBeUndefined()
    expect(docsResponse.body.endpoints.alerts).toBeUndefined()

    const checkinsResponse = await request(app).get('/api/checkins')
    expect(checkinsResponse.status).toBe(404)

    const alertsResponse = await request(app).get('/api/alerts')
    expect(alertsResponse.status).toBe(404)

    const inboundSmsResponse = await request(app)
      .post('/api/sms/inbound')
      .send({ message: 'OK', anonymousCode: 'V0001' })

    expect(inboundSmsResponse.status).toBe(404)
  })

  test('mounts checkins and alerts when phase 2 is enabled', async () => {
    const app = await loadApp(true)

    const docsResponse = await request(app).get('/api')
    expect(docsResponse.status).toBe(200)
    expect(docsResponse.body.endpoints.checkins).toBeDefined()
    expect(docsResponse.body.endpoints.alerts).toBeDefined()

    const checkinsResponse = await request(app).get('/api/checkins')
    expect(checkinsResponse.status).toBe(401)

    const alertsResponse = await request(app).get('/api/alerts')
    expect(alertsResponse.status).toBe(401)

    const inboundSmsResponse = await request(app)
      .post('/api/sms/inbound')
      .send({ message: 'OK' })

    expect(inboundSmsResponse.status).toBe(400)
  })
})
