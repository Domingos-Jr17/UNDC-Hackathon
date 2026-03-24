import crypto from 'crypto'
import { Request, Response } from 'express'
import prismaService from '../services/prisma'
import { AuthenticatedRequest } from '../types'
import { canAccessAnonymousCode, logger } from '../middleware/security'
import cacheService from '../services/cache'
import { calculateMatchScore, deriveCandidateProfile } from '../services/jobMatching'

const prisma = prismaService.getClient()

const normalizeOptionalText = (value?: string | null): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

const normalizeJobStatus = (value?: string | null): 'DRAFT' | 'VALIDATED' | 'OPEN' | 'CLOSED' | 'REJECTED' => {
  const normalized = (value ?? 'DRAFT').trim().toUpperCase()
  if (['DRAFT', 'VALIDATED', 'OPEN', 'CLOSED', 'REJECTED'].includes(normalized)) {
    return normalized as 'DRAFT' | 'VALIDATED' | 'OPEN' | 'CLOSED' | 'REJECTED'
  }
  return 'DRAFT'
}

class JobsController {
  static async listJobs(req: Request, res: Response): Promise<void> {
    const {
      location,
      skill,
      limit = '20',
      employerId,
      ngoId,
      status
    } = req.query
    const cacheKey = `mobile:jobs:list:${String(location ?? '')}:${String(skill ?? '')}:${String(limit)}:${String(employerId ?? '')}:${String(ngoId ?? '')}:${String(status ?? '')}`

    try {
      const cached = await cacheService.getJSON<{
        success: true
        jobs: unknown[]
      }>(cacheKey)

      if (cached) {
        res.json(cached)
        return
      }

      const where = {
        ...(location ? { location: String(location) } : {}),
        ...(skill ? { required_skills: { contains: String(skill).toLowerCase() } } : {}),
        ...(employerId ? { employer_id: String(employerId) } : {}),
        ...(ngoId ? { ngo_id: String(ngoId) } : {}),
        ...(status ? { status: normalizeJobStatus(String(status)) } : { status: 'OPEN' as const }),
        is_active: true
      }

      const jobs = await prisma.job.findMany({
        where,
        include: {
          employer: {
            select: {
              id: true,
              name: true,
              location: true,
              validation_status: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        take: Math.min(parseInt(String(limit), 10) || 20, 100)
      })

      const payload = {
        success: true,
        jobs
      }

      await cacheService.setJSON(cacheKey, payload, 300)
      res.json(payload)
    } catch (error) {
      logger.error('Error listing jobs', { error: (error as Error).message })
      res.status(500).json({ error: 'Erro ao listar vagas' })
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const created = await prisma.job.create({
        data: {
          id: req.body.id ?? crypto.randomUUID(),
          title: String(req.body.title),
          description: String(req.body.description),
          location: String(req.body.location),
          required_skills: String(req.body.requiredSkills ?? req.body.required_skills ?? ''),
          contract_type: String(req.body.contractType ?? req.body.contract_type ?? 'Contrato'),
          schedule: normalizeOptionalText(req.body.schedule),
          salary_range: normalizeOptionalText(req.body.salaryRange ?? req.body.salary_range),
          availability: normalizeOptionalText(req.body.availability),
          work_type: normalizeOptionalText(req.body.workType ?? req.body.work_type),
          status: normalizeJobStatus(req.body.status),
          validation_notes: normalizeOptionalText(req.body.validationNotes ?? req.body.validation_notes),
          ngo_id: normalizeOptionalText(req.body.ngoId ?? req.user?.ngoId),
          employer_id: normalizeOptionalText(req.body.employerId ?? req.body.employer_id)
        }
      })

      await prisma.auditLog.create({
        data: {
          ...(req.user?.anonymousCode ? { user_code: req.user.anonymousCode } : {}),
          action: 'JOB_CREATED',
          table_name: 'Job',
          record_id: created.id,
          new_values: JSON.stringify({
            title: created.title,
            status: created.status,
            ngoId: created.ngo_id,
            employerId: created.employer_id
          })
        }
      })

      await cacheService.invalidatePattern('mobile:jobs:')

      res.status(201).json({
        success: true,
        job: created
      })
    } catch (error) {
      logger.error('Error creating job', { error: (error as Error).message })
      res.status(500).json({ error: 'Erro ao criar vaga' })
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params

    try {
      const updated = await prisma.job.update({
        where: { id },
        data: {
          ...(req.body.title !== undefined ? { title: String(req.body.title) } : {}),
          ...(req.body.description !== undefined ? { description: String(req.body.description) } : {}),
          ...(req.body.location !== undefined ? { location: String(req.body.location) } : {}),
          ...(req.body.requiredSkills !== undefined || req.body.required_skills !== undefined
            ? { required_skills: String(req.body.requiredSkills ?? req.body.required_skills ?? '') }
            : {}),
          ...(req.body.contractType !== undefined || req.body.contract_type !== undefined
            ? { contract_type: String(req.body.contractType ?? req.body.contract_type ?? '') }
            : {}),
          ...(req.body.schedule !== undefined ? { schedule: normalizeOptionalText(req.body.schedule) } : {}),
          ...(req.body.salaryRange !== undefined || req.body.salary_range !== undefined
            ? { salary_range: normalizeOptionalText(req.body.salaryRange ?? req.body.salary_range) }
            : {}),
          ...(req.body.availability !== undefined ? { availability: normalizeOptionalText(req.body.availability) } : {}),
          ...(req.body.workType !== undefined || req.body.work_type !== undefined
            ? { work_type: normalizeOptionalText(req.body.workType ?? req.body.work_type) }
            : {}),
          ...(req.body.status !== undefined ? { status: normalizeJobStatus(req.body.status) } : {}),
          ...(req.body.validationNotes !== undefined || req.body.validation_notes !== undefined
            ? { validation_notes: normalizeOptionalText(req.body.validationNotes ?? req.body.validation_notes) }
            : {}),
          ...(req.body.isActive !== undefined ? { is_active: Boolean(req.body.isActive) } : {}),
          ...(req.body.employerId !== undefined || req.body.employer_id !== undefined
            ? { employer_id: normalizeOptionalText(req.body.employerId ?? req.body.employer_id) }
            : {}),
          ...(req.body.ngoId !== undefined || req.body.ngo_id !== undefined
            ? { ngo_id: normalizeOptionalText(req.body.ngoId ?? req.body.ngo_id) }
            : {})
        }
      })

      await prisma.auditLog.create({
        data: {
          ...(req.user?.anonymousCode ? { user_code: req.user.anonymousCode } : {}),
          action: 'JOB_UPDATED',
          table_name: 'Job',
          record_id: updated.id,
          new_values: JSON.stringify({
            status: updated.status,
            isActive: updated.is_active
          })
        }
      })

      await cacheService.invalidatePattern('mobile:jobs:')

      res.json({
        success: true,
        job: updated
      })
    } catch (error) {
      logger.error('Error updating job', { error: (error as Error).message, jobId: id })
      res.status(500).json({ error: 'Erro ao atualizar vaga' })
    }
  }

  static async generateMatches(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params

    try {
      const job = await prisma.job.findUnique({
        where: { id },
        include: {
          employer: {
            select: {
              id: true,
              name: true,
              validation_status: true
            }
          }
        }
      })

      if (!job || !job.is_active) {
        res.status(404).json({
          success: false,
          error: 'Vaga não encontrada'
        })
        return
      }

      const candidates = await prisma.user.findMany({
        where: {
          role: 'VICTIM',
          is_active: true,
          ...(job.ngo_id ? { ngo_id: job.ngo_id } : {})
        },
        select: {
          anonymous_code: true
        }
      })

      const persistedMatches: unknown[] = []
      for (const candidate of candidates) {
        const profile = await deriveCandidateProfile(candidate.anonymous_code)
        if (!profile) {
          continue
        }

        const { score, sharedSkills, rationale } = calculateMatchScore(profile, job)
        if (score <= 0) {
          continue
        }

        const match = await prisma.jobMatch.upsert({
          where: {
            job_id_anonymous_code: {
              job_id: job.id,
              anonymous_code: candidate.anonymous_code
            }
          },
          update: {
            score,
            shared_skills: sharedSkills.join(', '),
            rationale: rationale.join(' | '),
            ngo_id: job.ngo_id ?? profile.ngoId
          },
          create: {
            id: crypto.randomUUID(),
            job_id: job.id,
            anonymous_code: candidate.anonymous_code,
            ngo_id: job.ngo_id ?? profile.ngoId,
            score,
            shared_skills: sharedSkills.join(', '),
            rationale: rationale.join(' | ')
          },
          include: {
            user: {
              select: {
                anonymous_code: true,
                ngo_id: true,
                location: true
              }
            }
          }
        })

        persistedMatches.push(match)
      }

      await prisma.auditLog.create({
        data: {
          ...(req.user?.anonymousCode ? { user_code: req.user.anonymousCode } : {}),
          action: 'JOB_MATCHING_GENERATED',
          table_name: 'JobMatch',
          record_id: job.id,
          new_values: JSON.stringify({
            jobId: job.id,
            matches: persistedMatches.length
          })
        }
      })

      res.json({
        success: true,
        jobId: job.id,
        matches: persistedMatches
      })
    } catch (error) {
      logger.error('Error generating job matches', { error: (error as Error).message, jobId: id })
      res.status(500).json({ error: 'Erro ao gerar matching da vaga' })
    }
  }

  static async getMatching(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { anonymousCode, location } = req.body as {
      anonymousCode: string
      location?: string
    }
    const cacheKey = `mobile:jobs:matching:${anonymousCode}:${location ?? ''}`

    if (!canAccessAnonymousCode(req.user, anonymousCode)) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado para este recurso'
      })
      return
    }

    try {
      const cached = await cacheService.getJSON<{
        success: true
        anonymousCode: string
        jobs: unknown[]
      }>(cacheKey)

      if (cached) {
        res.json(cached)
        return
      }

      const profile = await deriveCandidateProfile(anonymousCode)
      if (!profile) {
        res.status(404).json({
          success: false,
          error: 'Beneficiária não encontrada'
        })
        return
      }

      const jobs = await prisma.job.findMany({
        where: {
          is_active: true,
          status: 'OPEN'
        },
        include: {
          employer: {
            select: {
              id: true,
              name: true,
              location: true,
              validation_status: true
            }
          }
        }
      })

      const rankedJobs = jobs
        .map(job => {
          const result = calculateMatchScore(
            {
              ...profile,
              location: location ?? profile.location
            },
            job
          )

          return {
            ...job,
            matching: {
              score: result.score,
              sharedSkills: result.sharedSkills,
              rationale: result.rationale
            }
          }
        })
        .filter(job => job.matching.score > 0)
        .sort((a, b) => b.matching.score - a.matching.score)

      const payload = {
        success: true,
        anonymousCode,
        jobs: rankedJobs
      }

      await cacheService.setJSON(cacheKey, payload, 120)
      res.json(payload)
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
      const [user, job, profile, match] = await Promise.all([
        prisma.user.findUnique({ where: { anonymous_code: applicantCode } }),
        prisma.job.findUnique({ where: { id } }),
        deriveCandidateProfile(applicantCode),
        prisma.jobMatch.findUnique({
          where: {
            job_id_anonymous_code: {
              job_id: id,
              anonymous_code: applicantCode
            }
          }
        })
      ])

      if (!user || !user.is_active) {
        res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        })
        return
      }

      if (!job || !job.is_active || job.status !== 'OPEN') {
        res.status(404).json({
          success: false,
          error: 'Vaga não encontrada'
        })
        return
      }

      const score = profile ? calculateMatchScore(profile, job).score : 0
      const applicationStatus = match?.status === 'VICTIM_CONFIRMED' ? 'SUBMITTED' : 'DRAFT'

      const application = await prisma.jobApplication.upsert({
        where: {
          job_id_anonymous_code: {
            job_id: id,
            anonymous_code: applicantCode
          }
        },
        update: {
          status: applicationStatus,
          notes: notes ?? null,
          score,
          job_match_id: match?.id ?? null,
          ngo_id: job.ngo_id ?? user.ngo_id,
          submitted_at: applicationStatus === 'SUBMITTED' ? new Date() : null
        },
        create: {
          job_id: id,
          anonymous_code: applicantCode,
          job_match_id: match?.id ?? null,
          ngo_id: job.ngo_id ?? user.ngo_id,
          notes: notes ?? null,
          score,
          status: applicationStatus,
          submitted_at: applicationStatus === 'SUBMITTED' ? new Date() : null
        }
      })

      if (match && applicationStatus === 'SUBMITTED') {
        await prisma.jobMatch.update({
          where: { id: match.id },
          data: { status: 'SUBMITTED' }
        })
      }

      await prisma.auditLog.create({
        data: {
          user_code: req.user?.anonymousCode ?? applicantCode,
          action: 'JOB_APPLICATION_UPSERTED',
          table_name: 'JobApplication',
          record_id: String(application.id),
          new_values: JSON.stringify({
            jobId: id,
            anonymousCode: applicantCode,
            status: application.status
          })
        }
      })

      await cacheService.invalidatePattern('mobile:jobs:')

      res.status(201).json({
        success: true,
        application,
        submitted: application.status === 'SUBMITTED',
        message: application.status === 'SUBMITTED'
          ? 'Candidatura submetida com sucesso'
          : 'Interesse registado. A candidatura aguarda validação do fluxo.'
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
