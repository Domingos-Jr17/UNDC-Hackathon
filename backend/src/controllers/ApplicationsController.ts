import { Response } from 'express'
import prismaService from '../services/prisma'
import { AuthenticatedRequest } from '../types'
import { logger } from '../middleware/security'

const prisma = prismaService.getClient()

const timestampFieldByStatus: Record<string, string | undefined> = {
  SUBMITTED: 'submitted_at',
  INTERVIEW_SCHEDULED: 'interview_scheduled_at',
  INTERVIEW_COMPLETED: 'interview_completed_at',
  OFFER_MADE: 'offer_made_at',
  ACCEPTED: 'accepted_at',
  PLACED: 'placed_at',
  WITHDRAWN: 'withdrawn_at',
  REJECTED: 'rejected_at'
}

class ApplicationsController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, jobId, anonymousCode } = req.query
      const applications = await prisma.jobApplication.findMany({
        where: {
          ...(status ? { status: String(status).trim().toUpperCase() as any } : {}),
          ...(jobId ? { job_id: String(jobId) } : {}),
          ...(anonymousCode ? { anonymous_code: String(anonymousCode).toUpperCase() } : {})
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              location: true
            }
          },
          user: {
            select: {
              anonymous_code: true,
              ngo_id: true,
              location: true
            }
          },
          job_match: {
            select: {
              id: true,
              status: true,
              score: true
            }
          }
        },
        orderBy: { applied_at: 'desc' }
      })

      res.json({
        success: true,
        applications
      })
    } catch (error) {
      logger.error('Error listing applications', { error: (error as Error).message })
      res.status(500).json({ error: 'Erro ao listar candidaturas' })
    }
  }

  static async transition(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params
    const { status, notes } = req.body as { status?: string; notes?: string }
    const normalizedStatus = String(status ?? '').trim().toUpperCase()

    if (!normalizedStatus) {
      res.status(400).json({ success: false, error: 'status é obrigatório' })
      return
    }

    try {
      const current = await prisma.jobApplication.findUnique({
        where: { id: Number(id) },
        include: {
          job_match: true
        }
      })

      if (!current) {
        res.status(404).json({ success: false, error: 'Candidatura não encontrada' })
        return
      }

      if (normalizedStatus === 'SUBMITTED' && current.job_match && current.job_match.status !== 'VICTIM_CONFIRMED') {
        res.status(409).json({
          success: false,
          error: 'A candidatura só pode ser submetida após confirmação da beneficiária'
        })
        return
      }

      const updateData: Record<string, unknown> = {
        status: normalizedStatus,
        transition_notes: notes ?? null,
        last_transition_by_code: req.user?.anonymousCode ?? null
      }

      const timestampField = timestampFieldByStatus[normalizedStatus]
      if (timestampField) {
        updateData[timestampField] = new Date()
      }

      const updated = await prisma.jobApplication.update({
        where: { id: Number(id) },
        data: updateData
      })

      if (current.job_match_id && normalizedStatus === 'SUBMITTED') {
        await prisma.jobMatch.update({
          where: { id: current.job_match_id },
          data: { status: 'SUBMITTED' }
        })
      }

      await prisma.auditLog.create({
        data: {
          ...(req.user?.anonymousCode ? { user_code: req.user.anonymousCode } : {}),
          action: 'JOB_APPLICATION_TRANSITIONED',
          table_name: 'JobApplication',
          record_id: String(updated.id),
          new_values: JSON.stringify({
            status: updated.status,
            notes: notes ?? null
          })
        }
      })

      res.json({
        success: true,
        application: updated
      })
    } catch (error) {
      logger.error('Error transitioning application', { error: (error as Error).message, applicationId: id })
      res.status(500).json({ error: 'Erro ao transitar candidatura' })
    }
  }
}

export default ApplicationsController
