import prismaService from '../services/prisma';
import { Certificate as CertificateInterface } from '../types';

const prisma = prismaService.getClient();

class CertificateModel {
  static async findByVerificationCode(verificationCode: string): Promise<CertificateInterface | null> {
    try {
      const certificate = await prisma.certificate.findUnique({
        where: { verification_code: verificationCode }
      });

      if (!certificate) return null;

      const result: CertificateInterface = {
        id: certificate.id,
        anonymous_code: certificate.anonymous_code,
        course_id: certificate.course_id,
        course_title: certificate.course_title,
        issue_date: certificate.issue_date.toISOString(),
        verification_code: certificate.verification_code,
        qr_code: certificate.qr_code,
        score: certificate.score,
        max_score: certificate.max_score,
        verified: certificate.verified,
        revoked: certificate.revoked,
        created_at: certificate.created_at.toISOString()
      };

      // Add optional fields only if they exist
      if (certificate.instructor) result.instructor = certificate.instructor;
      if (certificate.institution) result.institution = certificate.institution;
      if (certificate.verification_date) result.verification_date = certificate.verification_date.toISOString();
      if (certificate.revocation_reason) result.revocation_reason = certificate.revocation_reason;
      if (certificate.verification_ip) result.verification_ip = certificate.verification_ip;

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findByUserAndCourse(anonymousCode: string, courseId: string): Promise<CertificateInterface | null> {
    try {
      const certificate = await prisma.certificate.findFirst({
        where: {
          anonymous_code: anonymousCode,
          course_id: courseId,
          revoked: false
        }
      });

      if (!certificate) return null;

      const result: CertificateInterface = {
        id: certificate.id,
        anonymous_code: certificate.anonymous_code,
        course_id: certificate.course_id,
        course_title: certificate.course_title,
        issue_date: certificate.issue_date.toISOString(),
        verification_code: certificate.verification_code,
        qr_code: certificate.qr_code,
        score: certificate.score,
        max_score: certificate.max_score,
        verified: certificate.verified,
        revoked: certificate.revoked,
        created_at: certificate.created_at.toISOString()
      };

      // Add optional fields only if they exist
      if (certificate.instructor) result.instructor = certificate.instructor;
      if (certificate.institution) result.institution = certificate.institution;
      if (certificate.verification_date) result.verification_date = certificate.verification_date.toISOString();
      if (certificate.revocation_reason) result.revocation_reason = certificate.revocation_reason;
      if (certificate.verification_ip) result.verification_ip = certificate.verification_ip;

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async create(certificateData: Partial<CertificateInterface>): Promise<CertificateInterface> {
    try {
      const certificate = await prisma.certificate.upsert({
        where: {
          anonymous_code_course_id: {
            anonymous_code: certificateData.anonymous_code!,
            course_id: certificateData.course_id!
          }
        },
        update: {
          course_title: certificateData.course_title!,
          verification_code: certificateData.verification_code!,
          qr_code: certificateData.qr_code!,
          instructor: certificateData.instructor || null,
          institution: certificateData.institution || null,
          score: certificateData.score!,
          max_score: certificateData.max_score ?? 100,
          verified: certificateData.verified ?? false,
          revoked: false,
          revocation_reason: null
        },
        create: {
          id: certificateData.id ?? `cert-${Date.now()}`,
          anonymous_code: certificateData.anonymous_code!,
          course_id: certificateData.course_id!,
          course_title: certificateData.course_title!,
          verification_code: certificateData.verification_code!,
          qr_code: certificateData.qr_code!,
          instructor: certificateData.instructor || null,
          institution: certificateData.institution || null,
          score: certificateData.score!,
          max_score: certificateData.max_score ?? 100,
          verified: certificateData.verified ?? false,
          created_at: certificateData.created_at ? new Date(certificateData.created_at) : new Date(),
          issue_date: certificateData.issue_date ? new Date(certificateData.issue_date) : new Date()
        }
      });

      const result: CertificateInterface = {
        id: certificate.id,
        anonymous_code: certificate.anonymous_code,
        course_id: certificate.course_id,
        course_title: certificate.course_title,
        issue_date: certificate.issue_date.toISOString(),
        verification_code: certificate.verification_code,
        qr_code: certificate.qr_code,
        score: certificate.score,
        max_score: certificate.max_score,
        verified: certificate.verified,
        revoked: certificate.revoked,
        created_at: certificate.created_at.toISOString()
      };

      // Add optional fields only if they exist
      if (certificate.instructor) result.instructor = certificate.instructor;
      if (certificate.institution) result.institution = certificate.institution;
      if (certificate.verification_date) result.verification_date = certificate.verification_date.toISOString();
      if (certificate.revocation_reason) result.revocation_reason = certificate.revocation_reason;
      if (certificate.verification_ip) result.verification_ip = certificate.verification_ip;

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async verify(verificationCode: string, verificationIp?: string): Promise<{ valid: boolean; certificate?: CertificateInterface }> {
    try {
      const certificate = await prisma.certificate.findUnique({
        where: { verification_code: verificationCode }
      });

      if (!certificate) {
        return { valid: false };
      }

      // Update verification info
      const updatedCertificate = await prisma.certificate.update({
        where: { verification_code: verificationCode },
        data: {
          verified: true,
          verification_date: new Date(),
          verification_ip: verificationIp ?? null
        }
      });

      const result: CertificateInterface = {
        id: updatedCertificate.id,
        anonymous_code: updatedCertificate.anonymous_code,
        course_id: updatedCertificate.course_id,
        course_title: updatedCertificate.course_title,
        issue_date: updatedCertificate.issue_date.toISOString(),
        verification_code: updatedCertificate.verification_code,
        qr_code: updatedCertificate.qr_code,
        score: updatedCertificate.score,
        max_score: updatedCertificate.max_score,
        verified: updatedCertificate.verified,
        revoked: updatedCertificate.revoked,
        created_at: updatedCertificate.created_at.toISOString()
      };

      // Add optional fields only if they exist
      if (updatedCertificate.instructor) result.instructor = updatedCertificate.instructor;
      if (updatedCertificate.institution) result.institution = updatedCertificate.institution;
      if (updatedCertificate.verification_date) result.verification_date = updatedCertificate.verification_date.toISOString();
      if (updatedCertificate.revocation_reason) result.revocation_reason = updatedCertificate.revocation_reason;
      if (updatedCertificate.verification_ip) result.verification_ip = updatedCertificate.verification_ip;

      return {
        valid: true,
        certificate: result
      };
    } catch (error) {
      throw error;
    }
  }

  static async revoke(verificationCode: string, reason: string): Promise<void> {
    try {
      await prisma.certificate.update({
        where: { verification_code: verificationCode },
        data: {
          revoked: true,
          revocation_reason: reason,
          verification_date: new Date()
        }
      });
    } catch (error) {
      throw error;
    }
  }

  // New ORM-like methods
  static async findUnique(where: { verification_code: string } | { id: string }): Promise<CertificateInterface | null> {
    try {
      const certificate = await prisma.certificate.findUnique({
        where
      });

      if (!certificate) return null;

      // Properly construct CertificateInterface with optional properties
      const result: CertificateInterface = {
        id: certificate.id,
        anonymous_code: certificate.anonymous_code,
        course_id: certificate.course_id,
        course_title: certificate.course_title,
        issue_date: certificate.issue_date.toISOString(),
        verification_code: certificate.verification_code,
        qr_code: certificate.qr_code,
        score: certificate.score,
        max_score: certificate.max_score,
        verified: certificate.verified,
        revoked: certificate.revoked,
        created_at: certificate.created_at.toISOString()
      };

      // Add optional fields only if they exist
      if (certificate.instructor) result.instructor = certificate.instructor;
      if (certificate.institution) result.institution = certificate.institution;
      if (certificate.verification_date) result.verification_date = certificate.verification_date.toISOString();
      if (certificate.revocation_reason) result.revocation_reason = certificate.revocation_reason;
      if (certificate.verification_ip) result.verification_ip = certificate.verification_ip;

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async findMany(): Promise<CertificateInterface[]> {
    try {
      const certificates = await prisma.certificate.findMany({
        where: { revoked: false },
        orderBy: { created_at: 'desc' }
      });

      return certificates.map((cert: any) => {
        // Transform fields to match Certificate interface with exact optional types
        const result: CertificateInterface = {
          id: cert.id,
          anonymous_code: cert.anonymous_code,
          course_id: cert.course_id,
          course_title: cert.course_title,
          issue_date: cert.issue_date.toISOString(),
          verification_code: cert.verification_code,
          qr_code: cert.qr_code,
          score: cert.score,
          max_score: cert.max_score,
          verified: cert.verified,
          revoked: cert.revoked,
          created_at: cert.created_at.toISOString()
        };

        // Add optional fields only if they exist
        if (cert.instructor) result.instructor = cert.instructor;
        if (cert.institution) result.institution = cert.institution;
        if (cert.verification_date) result.verification_date = cert.verification_date.toISOString();
        if (cert.revocation_reason) result.revocation_reason = cert.revocation_reason;
        if (cert.verification_ip) result.verification_ip = cert.verification_ip;

        return result;
      });
    } catch (error) {
      throw error;
    }
  }

  static async update(
    where: { verification_code: string },
    data: Partial<CertificateInterface>
  ): Promise<CertificateInterface | null> {
    try {
      // Remove fields that shouldn't be updated directly
      const updateData: any = { ...data };
      delete updateData.id;
      delete updateData.verification_code;
      delete updateData.created_at;

      // Add updated timestamp
      updateData.verification_date = new Date();

      const certificate = await prisma.certificate.update({
        where,
        data: updateData
      });

      const result: CertificateInterface = {
        id: certificate.id,
        anonymous_code: certificate.anonymous_code,
        course_id: certificate.course_id,
        course_title: certificate.course_title,
        issue_date: certificate.issue_date.toISOString(),
        verification_code: certificate.verification_code,
        qr_code: certificate.qr_code,
        score: certificate.score,
        max_score: certificate.max_score,
        verified: certificate.verified,
        revoked: certificate.revoked,
        created_at: certificate.created_at.toISOString()
      };

      // Add optional fields only if they exist
      if (certificate.instructor) result.instructor = certificate.instructor;
      if (certificate.institution) result.institution = certificate.institution;
      if (certificate.verification_date) result.verification_date = certificate.verification_date.toISOString();
      if (certificate.revocation_reason) result.revocation_reason = certificate.revocation_reason;
      if (certificate.verification_ip) result.verification_ip = certificate.verification_ip;

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async delete(where: { verification_code: string }): Promise<void> {
    try {
      await prisma.certificate.delete({
        where
      });
    } catch (error) {
      throw error;
    }
  }
}

export default CertificateModel;
