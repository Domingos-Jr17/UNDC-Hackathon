import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { canAccessAnonymousCode, logger } from '../middleware/security';
import CertificateModel from '../models/Certificate';
import { CertificateGenerationRequest, CertificateVerificationResponse } from '../types';
import prismaService from '../services/prisma';
import cacheService from '../services/cache';

const prisma = prismaService.getClient();

class CertificateController {
  static async generate(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { anonymousCode, courseId, score } = req.body as CertificateGenerationRequest;

    if (!canAccessAnonymousCode(req.user, anonymousCode)) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado para este recurso'
      })
      return
    }

    try {
      const [user, course] = await Promise.all([
        prisma.user.findUnique({ where: { anonymous_code: anonymousCode } }),
        prisma.course.findUnique({ where: { id: courseId } })
      ]);

      if (!user || !course) {
        res.status(400).json({
          success: false,
          error: 'Usuário ou curso inválido'
        });
        return;
      }

      if (score < 70) {
        res.status(400).json({
          success: false,
          error: 'Pontuação insuficiente para gerar certificado'
        });
        return;
      }

      const verificationCode = `WIRA-${anonymousCode}-${courseId.toUpperCase()}-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
      const qrCode = `${process.env.CERTIFICATE_VERIFY_BASE_URL ?? 'https://verify.wira.org'}/${verificationCode}`;

      const certificate = await CertificateModel.create({
        anonymous_code: anonymousCode,
        course_id: courseId,
        course_title: course.title,
        verification_code: verificationCode,
        qr_code: qrCode,
        score,
        max_score: 100,
        instructor: course.instructor ?? 'WIRA Academy',
        institution: 'WIRA Academy'
      });

      await cacheService.invalidatePattern(`mobile:certificates:${anonymousCode}`);

      res.json({
        success: true,
        verificationCode: certificate.verification_code,
        qrCode: certificate.qr_code,
        message: 'Certificado gerado com sucesso'
      });
    } catch (error) {
      logger.error('Error generating certificate', {
        error: (error as Error).message,
        anonymousCode,
        courseId
      });
      res.status(500).json({
        error: 'Erro ao gerar certificado'
      });
    }
  }

  static async getByUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { anonymousCode } = req.params;
    const cacheKey = `mobile:certificates:${anonymousCode}`;

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
        certificates: unknown[]
      }>(cacheKey);

      if (cached) {
        res.json(cached);
        return;
      }

      const certificates = await prisma.certificate.findMany({
        where: {
          anonymous_code: anonymousCode,
          revoked: false
        },
        orderBy: { issue_date: 'desc' }
      });

      const payload = {
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
      };

      await cacheService.setJSON(cacheKey, payload, 300);
      res.json(payload);
    } catch (error) {
      logger.error('Error fetching user certificates', {
        error: (error as Error).message,
        anonymousCode
      });
      res.status(500).json({
        error: 'Erro ao buscar certificados do usuário'
      });
    }
  }

  static async verify(req: Request, res: Response): Promise<void> {
    const { code } = req.params;

    try {
      const result = await CertificateModel.verify(code);

      if (!result.valid) {
        res.status(404).json({
          success: false,
          error: 'Certificado não encontrado'
        });
        return;
      }

      const response: CertificateVerificationResponse = {
        success: true,
        valid: true,
        certificate: {
          anonymousCode: result.certificate!.anonymous_code,
          courseTitle: result.certificate!.course_title,
          date: result.certificate!.issue_date,
          score: result.certificate!.score
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Error verifying certificate', {
        error: (error as Error).message,
        code
      });
      res.status(500).json({
        error: 'Erro ao verificar certificado'
      });
    }
  }

  static async revoke(req: Request, res: Response): Promise<void> {
    const { code } = req.params;
    const { reason } = req.body;

    try {
      await CertificateModel.revoke(code, reason);
      await cacheService.invalidatePattern('mobile:certificates:');

      res.json({
        success: true,
        message: 'Certificado revogado com sucesso'
      });
    } catch (error) {
      logger.error('Error revoking certificate', {
        error: (error as Error).message,
        code
      });
      res.status(500).json({
        error: 'Erro ao revogar certificado'
      });
    }
  }

  static async getByUserAndCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { anonymousCode, courseId } = req.params;

    if (!canAccessAnonymousCode(req.user, anonymousCode)) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado para este recurso'
      })
      return
    }

    try {
      const certificate = await CertificateModel.findByUserAndCourse(anonymousCode, courseId);

      if (!certificate) {
        res.status(404).json({
          success: false,
          error: 'Certificado não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        certificate
      });
    } catch (error) {
      logger.error('Error fetching certificate', {
        error: (error as Error).message,
        anonymousCode,
        courseId
      });
      res.status(500).json({
        error: 'Erro ao buscar certificado'
      });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const certificateData = req.body;

      const certificate = await CertificateModel.create(certificateData);
      await cacheService.invalidatePattern('mobile:certificates:');

      res.status(201).json({
        success: true,
        certificate,
        message: 'Certificado criado com sucesso'
      });
    } catch (error) {
      logger.error('Error creating certificate', { error: (error as Error).message });
      res.status(500).json({
        error: 'Erro ao criar certificado'
      });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    const { code } = req.params;
    const updateData = req.body;

    try {
      const certificate = await CertificateModel.update({ verification_code: code }, updateData);

      if (!certificate) {
        res.status(404).json({
          success: false,
          error: 'Certificado não encontrado'
        });
        return;
      }

      await cacheService.invalidatePattern('mobile:certificates:');
      res.json({
        success: true,
        certificate,
        message: 'Certificado atualizado com sucesso'
      });
    } catch (error) {
      logger.error('Error updating certificate', { error: (error as Error).message, code });
      res.status(500).json({
        error: 'Erro ao atualizar certificado'
      });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    const { code } = req.params;

    try {
      await CertificateModel.delete({ verification_code: code });
      await cacheService.invalidatePattern('mobile:certificates:');

      res.json({
        success: true,
        message: 'Certificado removido com sucesso'
      });
    } catch (error) {
      logger.error('Error deleting certificate', { error: (error as Error).message, code });
      res.status(500).json({
        error: 'Erro ao remover certificado'
      });
    }
  }
}

export default CertificateController;
