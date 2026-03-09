import { Request, Response } from 'express'
import prismaService from '../services/prisma'
import encryptionService from '../services/encryption'
import { logger } from '../middleware/security'

const prisma = prismaService.getClient()
const normalizeNgoId = (value: string): string => value.trim().toLowerCase().replace(/^ong-/, 'ngo-')

const mapUserListItem = (user: {
  id: number
  anonymous_code: string
  ngo_id: string | null
  role: 'VICTIM' | 'STAFF' | 'ADMIN'
  is_active: boolean
  last_login_at: Date | null
  created_at: Date
  progresses?: Array<{ percentage: number }>
  certificates?: Array<{ id: string }>
}): {
  id: string
  anonymousCode: string
  ngoId: string
  role: string
  status: 'Ativo' | 'Inativo'
  lastActivity: string
  coursesCompleted: number
  certificatesEarned: number
  totalProgress: number
  createdAt: string
} => {
  const progresses = user.progresses ?? []
  const certificates = user.certificates ?? []

  const totalProgress = progresses.length > 0
    ? Math.round(progresses.reduce((acc, item) => acc + item.percentage, 0) / progresses.length)
    : 0

  return {
    id: String(user.id),
    anonymousCode: user.anonymous_code,
    ngoId: user.ngo_id ?? '',
    role: user.role,
    status: user.is_active ? 'Ativo' : 'Inativo',
    lastActivity: (user.last_login_at ?? user.created_at).toISOString(),
    coursesCompleted: progresses.filter(item => item.percentage >= 100).length,
    certificatesEarned: certificates.length,
    totalProgress,
    createdAt: user.created_at.toISOString()
  }
}

class UsersController {
  static async list(req: Request, res: Response): Promise<void> {
    const { status, limit = '50', offset = '0' } = req.query
    const parsedLimit = Math.min(parseInt(String(limit), 10) || 50, 200)
    const parsedOffset = parseInt(String(offset), 10) || 0
    const statusFilter = status === 'Ativo' ? true : status === 'Inativo' ? false : null
    const where = {
      role: 'VICTIM' as const,
      ...(statusFilter === null ? {} : { is_active: statusFilter })
    }

    try {
      const users = await prisma.user.findMany({
        where,
        include: {
          progresses: {
            select: { percentage: true }
          },
          certificates: {
            where: { revoked: false },
            select: { id: true }
          }
        },
        orderBy: { created_at: 'desc' },
        take: parsedLimit,
        skip: parsedOffset
      })

      const total = await prisma.user.count({
        where
      })

      res.json({
        success: true,
        users: users.map(user => mapUserListItem(user)),
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          total
        }
      })
    } catch (error) {
      logger.error('Error listing users', { error: (error as Error).message })
      res.status(500).json({ error: 'Erro ao listar usuários' })
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const maybeNumericId = Number(id)

    try {
      const user = Number.isNaN(maybeNumericId)
        ? await prisma.user.findUnique({
          where: { anonymous_code: id },
          include: {
            progresses: {
              include: {
                course: {
                  select: { title: true }
                }
              }
            },
            certificates: {
              where: { revoked: false },
              select: {
                id: true,
                verification_code: true,
                course_title: true,
                issue_date: true,
                score: true
              }
            }
          }
        })
        : await prisma.user.findUnique({
          where: { id: maybeNumericId },
          include: {
            progresses: {
              include: {
                course: {
                  select: { title: true }
                }
              }
            },
            certificates: {
              where: { revoked: false },
              select: {
                id: true,
                verification_code: true,
                course_title: true,
                issue_date: true,
                score: true
              }
            }
          }
        })

      if (!user || user.role !== 'VICTIM') {
        res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        })
        return
      }

      const summary = mapUserListItem({
        ...user,
        progresses: user.progresses.map((item: any) => ({ percentage: item.percentage })),
        certificates: user.certificates.map((item: any) => ({ id: item.id }))
      })

      res.json({
        success: true,
        user: {
          ...summary,
          progress: user.progresses.map((item: any) => ({
            courseId: item.course_id,
            courseTitle: item.course.title,
            percentage: item.percentage,
            currentModule: item.current_module,
            lastActivity: item.last_activity.toISOString()
          })),
          certificates: user.certificates.map((item: any) => ({
            id: item.id,
            code: item.verification_code,
            courseTitle: item.course_title,
            issueDate: item.issue_date.toISOString(),
            score: item.score
          }))
        }
      })
    } catch (error) {
      logger.error('Error fetching user by id', { error: (error as Error).message, id })
      res.status(500).json({ error: 'Erro ao buscar usuário' })
    }
  }

  static async generateCode(_req: Request, res: Response): Promise<void> {
    for (let attempts = 0; attempts < 5; attempts += 1) {
      const code = encryptionService.generateSecureCode('V', 4)
      const exists = await prisma.user.findUnique({
        where: { anonymous_code: code },
        select: { id: true }
      })

      if (!exists) {
        res.json({
          success: true,
          code
        })
        return
      }
    }

    res.status(500).json({
      success: false,
      error: 'Não foi possível gerar código único'
    })
  }

  static async activate(req: Request, res: Response): Promise<void> {
    const { ngoId, realName, initialSkills, phone } = req.body as {
      ngoId: string
      realName?: string
      dateOfBirth?: string
      initialSkills?: string
      phone?: string
    }

    if (!ngoId) {
      res.status(400).json({
        success: false,
        error: 'ngoId é obrigatório'
      })
      return
    }

    try {
      const normalizedNgoId = normalizeNgoId(ngoId)
      const ngo = await prisma.nGO.findUnique({ where: { id: normalizedNgoId } })
      if (!ngo || !ngo.is_active) {
        res.status(400).json({
          success: false,
          error: 'ONG inválida para ativação'
        })
        return
      }

      let generatedCode = ''
      for (let attempts = 0; attempts < 5; attempts += 1) {
        const candidate = encryptionService.generateSecureCode('V', 4)
        const exists = await prisma.user.findUnique({ where: { anonymous_code: candidate } })
        if (!exists) {
          generatedCode = candidate
          break
        }
      }

      if (!generatedCode) {
        res.status(500).json({
          success: false,
          error: 'Falha ao gerar código de acesso'
        })
        return
      }

      const user = await prisma.user.create({
        data: {
          anonymous_code: generatedCode,
          ngo_id: normalizedNgoId,
          role: 'VICTIM',
          real_name: realName ?? null,
          phone: phone ?? null
        }
      })

      if (initialSkills) {
        await prisma.auditLog.create({
          data: {
            user_code: generatedCode,
            action: 'USER_INITIAL_SKILLS_REGISTERED',
            table_name: 'User',
            record_id: String(user.id),
            new_values: JSON.stringify({ initialSkills })
          }
        })
      }

      res.status(201).json({
        success: true,
        user: {
          id: String(user.id),
          anonymousCode: user.anonymous_code,
          ngoId: user.ngo_id,
          role: user.role,
          createdAt: user.created_at.toISOString()
        }
      })
    } catch (error) {
      logger.error('Error activating user', { error: (error as Error).message })
      res.status(500).json({ error: 'Erro ao ativar usuário' })
    }
  }

  static async setActivation(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const { active } = req.body as { active?: boolean }

    if (typeof active !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'Campo active (boolean) é obrigatório'
      })
      return
    }

    const maybeNumericId = Number(id)

    try {
      const user = Number.isNaN(maybeNumericId)
        ? await prisma.user.update({
          where: { anonymous_code: id },
          data: { is_active: active }
        })
        : await prisma.user.update({
          where: { id: maybeNumericId },
          data: { is_active: active }
        })

      res.json({
        success: true,
        user: {
          id: String(user.id),
          anonymousCode: user.anonymous_code,
          isActive: user.is_active
        }
      })
    } catch (error) {
      logger.error('Error updating user activation', { error: (error as Error).message, id })
      res.status(500).json({ error: 'Erro ao atualizar ativação do usuário' })
    }
  }

  static async getUserProgress(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const maybeNumericId = Number(id)

    try {
      const user = Number.isNaN(maybeNumericId)
        ? await prisma.user.findUnique({ where: { anonymous_code: id } })
        : await prisma.user.findUnique({ where: { id: maybeNumericId } })

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        })
        return
      }

      const progress = await prisma.progress.findMany({
        where: { user_code: user.anonymous_code },
        include: {
          course: {
            select: {
              title: true,
              modules_count: true
            }
          }
        }
      })

      res.json({
        success: true,
        progress: progress.map((item: any) => ({
          userCode: item.user_code,
          courseId: item.course_id,
          courseTitle: item.course.title,
          percentage: item.percentage,
          currentModule: item.current_module,
          modulesCount: item.course.modules_count,
          completedModules: JSON.parse(item.completed_modules || '[]') as string[],
          lastActivity: item.last_activity.toISOString()
        }))
      })
    } catch (error) {
      logger.error('Error fetching user progress', { error: (error as Error).message, id })
      res.status(500).json({ error: 'Erro ao buscar progresso do usuário' })
    }
  }

  static async getUserCertificates(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const maybeNumericId = Number(id)

    try {
      const user = Number.isNaN(maybeNumericId)
        ? await prisma.user.findUnique({ where: { anonymous_code: id } })
        : await prisma.user.findUnique({ where: { id: maybeNumericId } })

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        })
        return
      }

      const certificates = await prisma.certificate.findMany({
        where: {
          anonymous_code: user.anonymous_code,
          revoked: false
        },
        orderBy: { issue_date: 'desc' }
      })

      res.json({
        success: true,
        certificates: certificates.map((item: any) => ({
          id: item.id,
          verificationCode: item.verification_code,
          courseId: item.course_id,
          courseTitle: item.course_title,
          issueDate: item.issue_date.toISOString(),
          score: item.score,
          qrCode: item.qr_code
        }))
      })
    } catch (error) {
      logger.error('Error fetching user certificates', { error: (error as Error).message, id })
      res.status(500).json({ error: 'Erro ao buscar certificados do usuário' })
    }
  }
}

export default UsersController
