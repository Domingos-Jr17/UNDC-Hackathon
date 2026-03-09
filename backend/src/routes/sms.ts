import express, { Request, Response } from 'express'
import { authenticateToken, ipRateLimit } from '../middleware/security'

const router = express.Router()

router.get('/status', authenticateToken, (_req: Request, res: Response): void => {
  res.json({
    success: true,
    service: 'WIRA SMS Service',
    status: 'Online (sandbox)',
    providerMode: process.env.SMS_API_KEY ? 'configured' : 'sandbox',
    timestamp: new Date().toISOString()
  })
})

router.post('/send', authenticateToken, ipRateLimit(30, 15 * 60 * 1000), (req: Request, res: Response): void => {
  const { phoneNumber, message } = req.body as {
    phoneNumber?: string
    message?: string
  }

  if (!phoneNumber || !message) {
    res.status(400).json({
      success: false,
      error: 'phoneNumber and message are required'
    })
    return
  }

  res.json({
    success: true,
    mode: process.env.SMS_API_KEY ? 'provider-ready' : 'sandbox',
    sms: {
      id: `sms-${Date.now()}`,
      to: phoneNumber,
      message,
      sentAt: new Date().toISOString(),
      provider: process.env.SMS_USERNAME ?? 'sandbox'
    }
  })
})

export default router
