import crypto from 'crypto'
import { Response } from 'express'
import prismaService from '../services/prisma'
import { AuthenticatedRequest } from '../types'
import { logger } from '../middleware/security'
import smsProviderService from '../services/smsProvider'

const prisma = prismaService.getClient()

const deriveSeverity = (value?: string | null): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
  const normalized = (value ?? '').trim().toLowerCase()
  if (!normalized) {
    return 'LOW'
  }

  if (normalized.includes('sos') || normalized.includes('insegur') || normalized.includes('viol')) {
    return 'CRITICAL'
  }

  if (normalized.includes('ajuda') || normalized.includes('atraso') || normalized.includes('salario')) {
    return 'HIGH'
  }

  return 'LOW'
}

const createAlertForCheckin = async (
  anonymousCode: string,
  ngoId: string | null,
  jobApplicationId: number,
  checkinId: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  type: string,
  source: string,
  resolutionNotes?: string | null
): Promise<void> => {
  if (severity === 'LOW') {
    return
  }

  await prisma.alert.create({
    data: {
      id: crypto.randomUUID(),
      anonymous_code: anonymousCode,
      ngo_id: ngoId,
      job_application_id: jobApplicationId,
      checkin_id: checkinId,
      type,
      severity,
      source,
      resolution_notes: resolutionNotes ?? null
    }
  })
}

export const applyCheckinResponse = async (params: {
  checkinId: string
  response?: string | null
  responseCode?: string | null
  source: string
}): Promise<{
  checkin: any
}> => {
  const checkin = await prisma.followUpCheckin.findUnique({
    where: { id: params.checkinId },
    include: {
      job_application: true
    }
  })

  if (!checkin) {
    throw new Error('Check-in não encontrado')
  }

  const severity = deriveSeverity(params.response ?? params.responseCode)
  const hasResponse = Boolean((params.response ?? '').trim() || (params.responseCode ?? '').trim())

  const updated = await prisma.followUpCheckin.update({
    where: { id: params.checkinId },
    data: {
      response: params.response ?? null,
      response_code: params.responseCode ?? null,
      responded_at: hasResponse ? new Date() : null,
      status: hasResponse ? 'RESPONDED' : 'MISSED',
      risk_severity: severity
    }
  })

  if (updated.status === 'MISSED') {
    const missedCount = await prisma.followUpCheckin.count({
      where: {
        job_application_id: updated.job_application_id,
        anonymous_code: updated.anonymous_code,
        status: 'MISSED'
      }
    })

    if (missedCount >= 2) {
      await createAlertForCheckin(
        updated.anonymous_code,
        updated.ngo_id,
        updated.job_application_id,
        updated.id,
        'MEDIUM',
        'FOLLOW_UP_NO_RESPONSE',
        params.source,
        'Duas ou mais ausências de resposta em check-ins'
      )
    }
  } else {
    await createAlertForCheckin(
      updated.anonymous_code,
      updated.ngo_id,
      updated.job_application_id,
      updated.id,
      severity,
      severity === 'CRITICAL' ? 'FOLLOW_UP_SAFETY_RISK' : 'FOLLOW_UP_HELP_REQUEST',
      params.source,
      params.response ?? params.responseCode ?? null
    )
  }

  return { checkin: updated }
}

class CheckinsController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, channel, jobApplicationId, anonymousCode } = req.query
      const checkins = await prisma.followUpCheckin.findMany({
        where: {
          ...(status ? { status: String(status).trim().toUpperCase() as any } : {}),
          ...(channel ? { channel: String(channel).trim().toUpperCase() as any } : {}),
          ...(jobApplicationId ? { job_application_id: Number(jobApplicationId) } : {}),
          ...(anonymousCode ? { anonymous_code: String(anonymousCode).trim().toUpperCase() } : {})
        },
        include: {
          job_application: {
            select: {
              id: true,
              status: true,
              job: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        },
        orderBy: [{ due_at: 'asc' }, { created_at: 'desc' }]
      })

      res.json({
        success: true,
        checkins
      })
    } catch (error) {
      logger.error('Error listing check-ins', { error: (error as Error).message })
      res.status(500).json({ error: 'Erro ao listar check-ins' })
    }
  }

  static async schedule(req: AuthenticatedRequest, res: Response): Promise<void> {
    const {
      jobApplicationId,
      periodLabel,
      channel = 'SMS',
      prompt,
      dueAt
    } = req.body as {
      jobApplicationId?: number
      periodLabel?: string
      channel?: 'SMS' | 'USSD' | 'APP' | 'MANUAL'
      prompt?: string
      dueAt?: string
    }

    if (!jobApplicationId || !periodLabel) {
      res.status(400).json({
        success: false,
        error: 'jobApplicationId e periodLabel são obrigatórios'
      })
      return
    }

    try {
      const application = await prisma.jobApplication.findUnique({
        where: { id: Number(jobApplicationId) },
        include: {
          user: true,
          job: true
        }
      })

      if (!application) {
        res.status(404).json({ success: false, error: 'Candidatura não encontrada' })
        return
      }

      const checkin = await prisma.followUpCheckin.create({
        data: {
          id: crypto.randomUUID(),
          job_application_id: application.id,
          anonymous_code: application.anonymous_code,
          ngo_id: application.ngo_id ?? application.user.ngo_id,
          period_label: periodLabel,
          channel,
          prompt: prompt ?? `Check-in WIRA: ${application.job.title}`,
          due_at: dueAt ? new Date(dueAt) : new Date()
        }
      })

      if (channel === 'SMS' && application.user.phone) {
        await smsProviderService.send({
          phoneNumber: application.user.phone,
          message: prompt ?? `WIRA check-in (${periodLabel}): responda AJUDA se precisar de apoio.`
        })
      }

      await prisma.auditLog.create({
        data: {
          ...(req.user?.anonymousCode ? { user_code: req.user.anonymousCode } : {}),
          action: 'FOLLOW_UP_CHECKIN_SCHEDULED',
          table_name: 'FollowUpCheckin',
          record_id: checkin.id,
          new_values: JSON.stringify({
            jobApplicationId,
            channel,
            periodLabel
          })
        }
      })

      res.status(201).json({
        success: true,
        checkin
      })
    } catch (error) {
      logger.error('Error scheduling check-in', { error: (error as Error).message })
      res.status(500).json({ error: 'Erro ao agendar check-in' })
    }
  }

  static async respond(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params
    const { response, responseCode } = req.body as { response?: string; responseCode?: string }

    try {
      const result = await applyCheckinResponse({
        checkinId: id,
        response: response ?? null,
        responseCode: responseCode ?? null,
        source: 'api'
      })

      await prisma.auditLog.create({
        data: {
          ...(req.user?.anonymousCode ? { user_code: req.user.anonymousCode } : {}),
          action: 'FOLLOW_UP_CHECKIN_RESPONDED',
          table_name: 'FollowUpCheckin',
          record_id: id,
          new_values: JSON.stringify({
            status: result.checkin.status,
            responseCode: responseCode ?? null
          })
        }
      })

      res.json({
        success: true,
        checkin: result.checkin
      })
    } catch (error) {
      logger.error('Error responding check-in', { error: (error as Error).message, checkinId: id })
      res.status(500).json({ error: 'Erro ao responder check-in' })
    }
  }
}

export default CheckinsController
