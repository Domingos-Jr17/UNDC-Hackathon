import { Request, Response } from 'express'
import prismaService from '../services/prisma'
import { AuthenticatedRequest } from '../types'
import { canAccessAnonymousCode, logger } from '../middleware/security'

const prisma = prismaService.getClient()

const parseSkills = (value: string): string[] =>
  value
    .split(',')
    .map(skill => skill.trim().toLowerCase())
    .filter(Boolean)

const calculateMatchScore = (
  candidateSkills: string[],
  jobSkills: string[],
  location: string | undefined,
  jobLocation: string,
  availability: string | undefined,
  schedule: string | null
): number => {
  const sharedSkills = jobSkills.filter(skill => candidateSkills.includes(skill)).length
  const skillScore = jobSkills.length > 0 ? Math.round((sharedSkills / jobSkills.length) * 60) : 0
  const locationScore = location && location.toLowerCase() === jobLocation.toLowerCase() ? 25 : 0
  const availabilityScore =
    availability && schedule && schedule.toLowerCase().includes(availability.toLowerCase()) ? 15 : 0
  return Math.min(100, skillScore + locationScore + availabilityScore)
}

class JobsController {
  static async listJobs(req: Request, res: Response): Promise<void> {
    const { location, skill, limit = '20' } = req.query

    try {
      const where = {
        is_active: true,
        ...(location ? { location: String(location) } : {}),
        ...(skill ? { required_skills: { contains: String(skill).toLowerCase() } } : {})
      }

      const jobs = await prisma.job.findMany({
        where,
        include: {
          employer: {
            select: {
              id: true,
              name: true,
              location: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        take: Math.min(parseInt(String(limit), 10) || 20, 100)
      })

      res.json({
        success: true,
        jobs
      })
    } catch (error) {
      logger.error('Error listing jobs', { error: (error as Error).message })
      res.status(500).json({ error: 'Erro ao listar vagas' })
    }
  }

  static async getMatching(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { anonymousCode, location, availability } = req.body as {
      anonymousCode: string
      location?: string
      availability?: string
    }

    if (!canAccessAnonymousCode(req.user, anonymousCode)) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado para este recurso'
      })
      return
    }

    try {
      const progressRows = await prisma.progress.findMany({
        where: { user_code: anonymousCode },
        include: {
          course: {
            select: { skills: true }
          }
        }
      })

      const derivedSkills = progressRows.flatMap((row: any): string[] =>
        parseSkills((row.course?.skills as string | null) ?? '')
      ) as string[]
      const uniqueCandidateSkills: string[] = [...new Set(derivedSkills)]

      const jobs = await prisma.job.findMany({
        where: { is_active: true },
        include: {
          employer: {
            select: {
              id: true,
              name: true,
              location: true
            }
          }
        }
      })

      const rankedJobs = jobs
        .map((job: any) => {
          const jobSkills = parseSkills(job.required_skills)
          const score = calculateMatchScore(
            uniqueCandidateSkills,
            jobSkills,
            location,
            job.location,
            availability,
            job.schedule
          )

          return {
            ...job,
            matching: {
              score,
              sharedSkills: jobSkills.filter(skill => uniqueCandidateSkills.includes(skill))
            }
          }
        })
        .sort((a: any, b: any) => b.matching.score - a.matching.score)

      res.json({
        success: true,
        anonymousCode,
        jobs: rankedJobs
      })
    } catch (error) {
      logger.error('Error calculating job matching', {
        error: (error as Error).message,
        anonymousCode
      })
      res.status(500).json({ error: 'Erro ao calcular matching de vagas' })
    }
  }

  static async apply(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params
    const { anonymousCode, notes } = req.body as { anonymousCode?: string; notes?: string }
    const applicantCode = (anonymousCode ?? req.user?.anonymousCode)?.toUpperCase()

    if (!applicantCode) {
      res.status(400).json({
        success: false,
        error: 'anonymousCode e obrigatorio'
      })
      return
    }

    if (!canAccessAnonymousCode(req.user, applicantCode)) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado para este recurso'
      })
      return
    }

    try {
      const [user, job] = await Promise.all([
        prisma.user.findUnique({ where: { anonymous_code: applicantCode } }),
        prisma.job.findUnique({ where: { id } })
      ])

      if (!user || !user.is_active) {
        res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        })
        return
      }

      if (!job || !job.is_active) {
        res.status(404).json({
          success: false,
          error: 'Vaga não encontrada'
        })
        return
      }

      const candidateSkills: string[] = (
        await prisma.progress.findMany({
          where: { user_code: applicantCode },
          include: { course: { select: { skills: true } } }
        })
      )
        .flatMap((item: any) => parseSkills((item.course?.skills as string | null) ?? ''))
      const score = calculateMatchScore(
        [...new Set(candidateSkills)],
        parseSkills(job.required_skills),
        undefined,
        job.location,
        undefined,
        job.schedule
      )

      const application = await prisma.jobApplication.upsert({
        where: {
          job_id_anonymous_code: {
            job_id: id,
            anonymous_code: applicantCode
          }
        },
        update: {
          status: 'PENDING',
          notes: notes ?? null,
          score
        },
        create: {
          job_id: id,
          anonymous_code: applicantCode,
          notes: notes ?? null,
          score
        }
      })

      res.status(201).json({
        success: true,
        application
      })
    } catch (error) {
      logger.error('Error applying to job', {
        error: (error as Error).message,
        jobId: id,
        anonymousCode: applicantCode
      })
      res.status(500).json({ error: 'Erro ao candidatar-se à vaga' })
    }
  }
}

export default JobsController



