import express, { Request, Response } from 'express'
import { authenticateToken, ipRateLimit } from '../middleware/security'
import smsProviderService from '../services/smsProvider'

const router = express.Router()

router.get('/status', authenticateToken, (_req: Request, res: Response): void => {
  const status = smsProviderService.getStatus()
  res.json({
    success: true,
    service: 'WIRA SMS Service',
    status: 'Online',
    providerMode: status.providerMode,
    provider: status.provider,
    timestamp: new Date().toISOString()
  })
})

router.post('/send', authenticateToken, ipRateLimit(30, 15 * 60 * 1000), async (req: Request, res: Response): Promise<void> => {
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

  try {
    const result = await smsProviderService.send({ phoneNumber, message })
    res.json({
      success: true,
      mode: result.mode,
      sms: {
        id: result.messageId,
        to: result.to,
        message: result.body,
        sentAt: result.sentAt,
        provider: result.provider
      }
    })
  } catch (error) {
    res.status(502).json({
      success: false,
      error: (error as Error).message
    })
  }
})

export default router
