import { Response } from 'express'
import prismaService from '../services/prisma'
import { AuthenticatedRequest } from '../types'
import { logger } from '../middleware/security'

const prisma = prismaService.getClient()

type ReviewType = 'ngo' | 'social'

class MatchesController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { jobId, anonymousCode, status } = req.query
      const matches = await prisma.jobMatch.findMany({
        where: {
          ...(jobId ? { job_id: String(jobId) } : {}),
          ...(anonymousCode ? { anonymous_code: String(anonymousCode).toUpperCase() } : {}),
          ...(status ? { status: String(status).trim().toUpperCase() as any } : {})
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              status: true
            }
          },
          user: {
            select: {
              anonymous_code: true,
              ngo_id: true,
              location: true,
              initial_skills: true
            }
          },
          applications: {
            select: {
              id: true,
              status: true,
              applied_at: true
            }
          }
        },
        orderBy: [{ score: 'desc' }, { created_at: 'desc' }]
      })

      res.json({
        success: true,
        matches
      })
    } catch (error) {
      logger.error('Error listing matches', { error: (error as Error).message })
      res.status(500).json({ error: 'Erro ao listar matches' })
    }
  }

  static async review(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params
    const { decision, reviewType, notes, rejectionReason } = req.body as {
      decision: 'approve' | 'reject'
      reviewType: ReviewType
      notes?: string
      rejectionReason?: string
    }

    try {
      const current = await prisma.jobMatch.findUnique({ where: { id } })
      if (!current) {
        res.status(404).json({ success: false, error: 'Match não encontrado' })
        return
      }

      if (reviewType === 'social' && !['NGO_REVIEWED', 'SOCIAL_REVIEWED'].includes(current.status)) {
        res.status(409).json({
          success: false,
          error: 'Revisão social exige revisão ONG concluída'
        })
        return
      }

      const nextStatus = decision === 'reject'
        ? 'REJECTED'
        : reviewType === 'social'
          ? 'SOCIAL_REVIEWED'
          : 'NGO_REVIEWED'

      const updated = await prisma.jobMatch.update({
        where: { id },
        data: {
          status: nextStatus,
          review_type: reviewType,
          ...(reviewType === 'ngo' ? { ngo_review_notes: notes ?? null } : { social_review_notes: notes ?? null }),
          rejection_reason: decision === 'reject' ? rejectionReason ?? notes ?? 'Rejected during review' : null
        }
      })

      await prisma.auditLog.create({
        data: {
          ...(req.user?.anonymousCode ? { user_code: req.user.anonymousCode } : {}),
          action: reviewType === 'social' ? 'JOB_MATCH_SOCIAL_REVIEWED' : 'JOB_MATCH_NGO_REVIEWED',
          table_name: 'JobMatch',
          record_id: updated.id,
          new_values: JSON.stringify({
            decision,
            status: updated.status
          })
        }
      })

      res.json({
        success: true,
        match: updated
      })
    } catch (error) {
      logger.error('Error reviewing match', { error: (error as Error).message, matchId: id })
      res.status(500).json({ error: 'Erro ao rever match' })
    }
  }

  static async confirmVictim(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params
    const { confirmed, notes } = req.body as { confirmed?: boolean; notes?: string }

    if (typeof confirmed !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'confirmed é obrigatório'
      })
      return
    }

    try {
      const current = await prisma.jobMatch.findUnique({ where: { id } })
      if (!current) {
        res.status(404).json({ success: false, error: 'Match não encontrado' })
        return
      }

      if (current.status !== 'SOCIAL_REVIEWED' && confirmed) {
        res.status(409).json({
          success: false,
          error: 'Confirmação da beneficiária exige revisão social concluída'
        })
        return
      }

      const updated = await prisma.jobMatch.update({
        where: { id },
        data: {
          status: confirmed ? 'VICTIM_CONFIRMED' : 'REJECTED',
          victim_confirmation_at: confirmed ? new Date() : null,
          rejection_reason: confirmed ? null : (notes ?? 'Recusado pela beneficiária')
        }
      })

      await prisma.auditLog.create({
        data: {
          ...(req.user?.anonymousCode ? { user_code: req.user.anonymousCode } : {}),
          action: confirmed ? 'JOB_MATCH_VICTIM_CONFIRMED' : 'JOB_MATCH_VICTIM_REJECTED',
          table_name: 'JobMatch',
          record_id: updated.id,
          new_values: JSON.stringify({
            status: updated.status,
            notes: notes ?? null
          })
        }
      })

      res.json({
        success: true,
        match: updated
      })
    } catch (error) {
      logger.error('Error confirming victim match', { error: (error as Error).message, matchId: id })
      res.status(500).json({ error: 'Erro ao confirmar match' })
    }
  }
}

export default MatchesController
