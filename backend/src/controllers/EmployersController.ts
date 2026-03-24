import crypto from 'crypto'
import { Response } from 'express'
import prismaService from '../services/prisma'
import { AuthenticatedRequest } from '../types'
import { logger } from '../middleware/security'

const prisma = prismaService.getClient()

const normalizeValidationStatus = (value?: string | null): 'PENDING' | 'VALIDATED' | 'REJECTED' | 'SUSPENDED' => {
  const normalized = (value ?? 'PENDING').trim().toUpperCase()
  if (['PENDING', 'VALIDATED', 'REJECTED', 'SUSPENDED'].includes(normalized)) {
    return normalized as 'PENDING' | 'VALIDATED' | 'REJECTED' | 'SUSPENDED'
  }
  return 'PENDING'
}

const cleanText = (value?: string | null): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

class EmployersController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, ngoId, active } = req.query
      const employers = await prisma.employer.findMany({
        where: {
          ...(status ? { validation_status: normalizeValidationStatus(String(status)) } : {}),
          ...(ngoId ? { ngo_id: String(ngoId) } : {}),
          ...(active !== undefined ? { is_active: String(active) === 'true' } : {})
        },
        include: {
          ngo: {
            select: {
              id: true,
              name: true
            }
          },
          jobs: {
            select: {
              id: true,
              title: true,
              status: true,
              is_active: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      })

      res.json({
        success: true,
        employers
      })
    } catch (error) {
      logger.error('Error listing employers', { error: (error as Error).message })
      res.status(500).json({ error: 'Erro ao listar empregadores' })
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const employer = await prisma.employer.create({
        data: {
          id: req.body.id ?? crypto.randomUUID(),
          name: String(req.body.name),
          sector: cleanText(req.body.sector),
          nuit: cleanText(req.body.nuit),
          contact_name: cleanText(req.body.contactName ?? req.body.contact_name),
          contact_phone: cleanText(req.body.contactPhone ?? req.body.contact_phone),
          contact_email: cleanText(req.body.contactEmail ?? req.body.contact_email),
          location: cleanText(req.body.location),
          ngo_id: cleanText(req.body.ngoId ?? req.user?.ngoId),
          validation_status: normalizeValidationStatus(req.body.validationStatus ?? req.body.validation_status),
          validation_notes: cleanText(req.body.validationNotes ?? req.body.validation_notes),
          reviewed_by_code: cleanText(req.user?.anonymousCode),
          validation_reviewed_at: req.body.validationStatus ? new Date() : null,
          notes: cleanText(req.body.notes)
        }
      })

      await prisma.auditLog.create({
        data: {
          ...(req.user?.anonymousCode ? { user_code: req.user.anonymousCode } : {}),
          action: 'EMPLOYER_CREATED',
          table_name: 'Employer',
          record_id: employer.id,
          new_values: JSON.stringify({
            name: employer.name,
            ngoId: employer.ngo_id,
            validationStatus: employer.validation_status
          })
        }
      })

      res.status(201).json({
        success: true,
        employer
      })
    } catch (error) {
      logger.error('Error creating employer', { error: (error as Error).message })
      res.status(500).json({ error: 'Erro ao criar empregador' })
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params

    try {
      const employer = await prisma.employer.update({
        where: { id },
        data: {
          ...(req.body.name !== undefined ? { name: String(req.body.name) } : {}),
          ...(req.body.sector !== undefined ? { sector: cleanText(req.body.sector) } : {}),
          ...(req.body.nuit !== undefined ? { nuit: cleanText(req.body.nuit) } : {}),
          ...(req.body.contactName !== undefined || req.body.contact_name !== undefined
            ? { contact_name: cleanText(req.body.contactName ?? req.body.contact_name) }
            : {}),
          ...(req.body.contactPhone !== undefined || req.body.contact_phone !== undefined
            ? { contact_phone: cleanText(req.body.contactPhone ?? req.body.contact_phone) }
            : {}),
          ...(req.body.contactEmail !== undefined || req.body.contact_email !== undefined
            ? { contact_email: cleanText(req.body.contactEmail ?? req.body.contact_email) }
            : {}),
          ...(req.body.location !== undefined ? { location: cleanText(req.body.location) } : {}),
          ...(req.body.ngoId !== undefined || req.body.ngo_id !== undefined
            ? { ngo_id: cleanText(req.body.ngoId ?? req.body.ngo_id) }
            : {}),
          ...(req.body.validationStatus !== undefined || req.body.validation_status !== undefined
            ? {
                validation_status: normalizeValidationStatus(req.body.validationStatus ?? req.body.validation_status),
                validation_reviewed_at: new Date(),
                reviewed_by_code: cleanText(req.user?.anonymousCode)
              }
            : {}),
          ...(req.body.validationNotes !== undefined || req.body.validation_notes !== undefined
            ? { validation_notes: cleanText(req.body.validationNotes ?? req.body.validation_notes) }
            : {}),
          ...(req.body.notes !== undefined ? { notes: cleanText(req.body.notes) } : {}),
          ...(req.body.isActive !== undefined ? { is_active: Boolean(req.body.isActive) } : {})
        }
      })

      await prisma.auditLog.create({
        data: {
          ...(req.user?.anonymousCode ? { user_code: req.user.anonymousCode } : {}),
          action: 'EMPLOYER_UPDATED',
          table_name: 'Employer',
          record_id: employer.id,
          new_values: JSON.stringify({
            validationStatus: employer.validation_status,
            isActive: employer.is_active
          })
        }
      })

      res.json({
        success: true,
        employer
      })
    } catch (error) {
      logger.error('Error updating employer', { error: (error as Error).message, employerId: id })
      res.status(500).json({ error: 'Erro ao atualizar empregador' })
    }
  }
}

export default EmployersController
