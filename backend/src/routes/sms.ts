import express, { Request, Response } from 'express'
import { authenticateToken, ipRateLimit } from '../middleware/security'
import smsProviderService from '../services/smsProvider'
import { applyCheckinResponse } from '../controllers/CheckinsController'
import prismaService from '../services/prisma'
import { isFollowUpAlertsPhase2Enabled } from '../config/features'

const router = express.Router()
const prisma = prismaService.getClient()

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

router.post('/inbound', ipRateLimit(60, 15 * 60 * 1000), async (req: Request, res: Response): Promise<void> => {
  if (!isFollowUpAlertsPhase2Enabled) {
    res.status(404).json({
      success: false,
      error: 'Not found'
    })
    return
  }

  const { from, message, anonymousCode, checkinId } = req.body as {
    from?: string
    message?: string
    anonymousCode?: string
    checkinId?: string
  }

  if (!message) {
    res.status(400).json({
      success: false,
      error: 'message is required'
    })
    return
  }

  if (!checkinId && !anonymousCode && !from) {
    res.status(400).json({
      success: false,
      error: 'checkinId, anonymousCode or from is required'
    })
    return
  }

  try {
    let targetCheckinId = checkinId

    if (!targetCheckinId) {
      const latestPendingCheckin = await prisma.followUpCheckin.findFirst({
        where: {
          status: 'PENDING',
          OR: [
            ...(anonymousCode ? [{ anonymous_code: anonymousCode.toUpperCase() }] : []),
            ...(from ? [{ user: { is: { phone: from } } }] : [])
          ]
        },
        orderBy: { created_at: 'desc' }
      })

      targetCheckinId = latestPendingCheckin?.id
    }

    if (!targetCheckinId) {
      res.status(404).json({
        success: false,
        error: 'Pending check-in not found for inbound SMS'
      })
      return
    }

    const result = await applyCheckinResponse({
      checkinId: targetCheckinId,
      response: message,
      responseCode: message.trim().toUpperCase(),
      source: 'sms'
    })

    res.json({
      success: true,
      checkin: result.checkin
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    })
  }
})

export default router
