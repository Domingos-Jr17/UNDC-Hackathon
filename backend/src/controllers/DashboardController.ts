import { Request, Response } from 'express'
import prismaService from '../services/prisma'
import { logger } from '../middleware/security'
import { isFollowUpAlertsPhase2Enabled } from '../config/features'

const prisma = prismaService.getClient()

class DashboardController {
  static async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const [
        totalUsers,
        activeUsers,
        coursesCompleted,
        certificatesIssued,
        openAlerts,
        placedApplications
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'VICTIM' } }),
        prisma.user.count({ where: { role: 'VICTIM', is_active: true } }),
        prisma.progress.count({ where: { percentage: { gte: 100 } } }),
        prisma.certificate.count({ where: { revoked: false } }),
        isFollowUpAlertsPhase2Enabled
          ? prisma.alert.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } })
          : Promise.resolve(0),
        isFollowUpAlertsPhase2Enabled
          ? prisma.jobApplication.count({ where: { status: 'PLACED' } })
          : Promise.resolve(0)
      ])

      const completionRows = await prisma.progress.findMany({
        where: { completed_at: { not: null } },
        select: { completed_at: true, last_activity: true }
      })

      const averageCompletionTime = completionRows.length > 0
        ? Math.round(
          completionRows.reduce((acc: number, row: any) => {
            if (!row.completed_at) return acc
            const diffMs = row.completed_at.getTime() - row.last_activity.getTime()
            const days = Math.max(0, diffMs / (1000 * 60 * 60 * 24))
            return acc + days
          }, 0) / completionRows.length
        )
        : 0

      res.json({
        success: true,
        stats: {
          totalUsers,
          activeUsers,
          coursesCompleted,
          certificatesIssued,
          averageCompletionTime,
          ...(isFollowUpAlertsPhase2Enabled
            ? {
                openAlerts,
                placedApplications
              }
            : {})
        }
      })
    } catch (error) {
      logger.error('Error fetching dashboard stats', { error: (error as Error).message })
      res.status(500).json({ error: 'Erro ao buscar estatísticas do dashboard' })
    }
  }

  static async getActivity(_req: Request, res: Response): Promise<void> {
    try {
      const logs = await prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 20
      })

      const activity = logs.map((log: any) => ({
        id: log.id,
        user: log.user_code ?? 'system',
        action: log.action,
        time: log.timestamp.toISOString()
      }))

      res.json({
        success: true,
        activity
      })
    } catch (error) {
      logger.error('Error fetching dashboard activity', { error: (error as Error).message })
      res.status(500).json({ error: 'Erro ao buscar atividade do dashboard' })
    }
  }
}

export default DashboardController
