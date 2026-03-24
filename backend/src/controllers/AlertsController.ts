import { Response } from 'express'
import prismaService from '../services/prisma'
import { AuthenticatedRequest } from '../types'
import { logger } from '../middleware/security'

const prisma = prismaService.getClient()

class AlertsController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, severity, ngoId, anonymousCode } = req.query
      const alerts = await prisma.alert.findMany({
        where: {
          ...(status ? { status: String(status).trim().toUpperCase() as any } : {}),
          ...(severity ? { severity: String(severity).trim().toUpperCase() as any } : {}),
          ...(ngoId ? { ngo_id: String(ngoId) } : {}),
          ...(anonymousCode ? { anonymous_code: String(anonymousCode).toUpperCase() } : {})
        },
        include: {
          job_application: {
            select: {
              id: true,
              status: true
            }
          },
          checkin: {
            select: {
              id: true,
              period_label: true,
              status: true
            }
          }
        },
        orderBy: [{ severity: 'desc' }, { created_at: 'desc' }]
      })

      res.json({
        success: true,
        alerts
      })
    } catch (error) {
      logger.error('Error listing alerts', { error: (error as Error).message })
      res.status(500).json({ error: 'Erro ao listar alertas' })
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params
    const { status, resolutionNotes, ownerCode } = req.body as {
      status?: string
      resolutionNotes?: string
      ownerCode?: string
    }

    try {
      const updated = await prisma.alert.update({
        where: { id },
        data: {
          ...(status ? { status: String(status).trim().toUpperCase() as any } : {}),
          ...(resolutionNotes !== undefined ? { resolution_notes: resolutionNotes || null } : {}),
          ...(ownerCode !== undefined ? { owner_code: ownerCode || null } : {}),
          ...(status === 'RESOLVED' ? { resolved_at: new Date() } : {})
        }
      })

      res.json({
        success: true,
        alert: updated
      })
    } catch (error) {
      logger.error('Error updating alert', { error: (error as Error).message, alertId: id })
      res.status(500).json({ error: 'Erro ao atualizar alerta' })
    }
  }
}

export default AlertsController
