-- AlterTable
ALTER TABLE "User"
ADD COLUMN "date_of_birth" TIMESTAMP(3),
ADD COLUMN "initial_skills" TEXT,
ADD COLUMN "location" TEXT;

-- AlterTable
ALTER TABLE "Certificate"
ADD CONSTRAINT "Certificate_anonymous_code_course_id_key" UNIQUE ("anonymous_code", "course_id");

-- CreateEnum
CREATE TYPE "EmployerValidationStatus" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'VALIDATED', 'OPEN', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SUGGESTED', 'NGO_REVIEWED', 'SOCIAL_REVIEWED', 'VICTIM_CONFIRMED', 'REJECTED', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'OFFER_MADE', 'REJECTED', 'ACCEPTED', 'PLACED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "FollowUpChannel" AS ENUM ('SMS', 'USSD', 'APP', 'MANUAL');

-- CreateEnum
CREATE TYPE "CheckinStatus" AS ENUM ('PENDING', 'RESPONDED', 'MISSED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');

-- AlterTable
ALTER TABLE "Employer"
ADD COLUMN "sector" TEXT,
ADD COLUMN "nuit" TEXT,
ADD COLUMN "ngo_id" TEXT,
ADD COLUMN "validation_status" "EmployerValidationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "validation_notes" TEXT,
ADD COLUMN "reviewed_by_code" TEXT,
ADD COLUMN "validation_reviewed_at" TIMESTAMP(3),
ADD COLUMN "notes" TEXT;

-- AlterTable
ALTER TABLE "Job"
ADD COLUMN "availability" TEXT,
ADD COLUMN "work_type" TEXT,
ADD COLUMN "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "validation_notes" TEXT;

-- AlterTable
ALTER TABLE "JobApplication"
ADD COLUMN "job_match_id" TEXT,
ADD COLUMN "ngo_id" TEXT,
ADD COLUMN "transition_notes" TEXT,
ADD COLUMN "last_transition_by_code" TEXT,
ADD COLUMN "submitted_at" TIMESTAMP(3),
ADD COLUMN "interview_scheduled_at" TIMESTAMP(3),
ADD COLUMN "interview_completed_at" TIMESTAMP(3),
ADD COLUMN "offer_made_at" TIMESTAMP(3),
ADD COLUMN "accepted_at" TIMESTAMP(3),
ADD COLUMN "placed_at" TIMESTAMP(3),
ADD COLUMN "withdrawn_at" TIMESTAMP(3),
ADD COLUMN "rejected_at" TIMESTAMP(3);

ALTER TABLE "JobApplication"
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" TYPE "ApplicationStatus" USING
  CASE UPPER("status")
    WHEN 'PENDING' THEN 'DRAFT'::"ApplicationStatus"
    WHEN 'DRAFT' THEN 'DRAFT'::"ApplicationStatus"
    WHEN 'SUBMITTED' THEN 'SUBMITTED'::"ApplicationStatus"
    WHEN 'INTERVIEW_SCHEDULED' THEN 'INTERVIEW_SCHEDULED'::"ApplicationStatus"
    WHEN 'INTERVIEW_COMPLETED' THEN 'INTERVIEW_COMPLETED'::"ApplicationStatus"
    WHEN 'OFFER_MADE' THEN 'OFFER_MADE'::"ApplicationStatus"
    WHEN 'REJECTED' THEN 'REJECTED'::"ApplicationStatus"
    WHEN 'ACCEPTED' THEN 'ACCEPTED'::"ApplicationStatus"
    WHEN 'PLACED' THEN 'PLACED'::"ApplicationStatus"
    WHEN 'WITHDRAWN' THEN 'WITHDRAWN'::"ApplicationStatus"
    ELSE 'DRAFT'::"ApplicationStatus"
  END,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "JobMatch" (
  "id" TEXT NOT NULL,
  "job_id" TEXT NOT NULL,
  "anonymous_code" TEXT NOT NULL,
  "ngo_id" TEXT,
  "score" INTEGER NOT NULL DEFAULT 0,
  "shared_skills" TEXT,
  "rationale" TEXT,
  "status" "MatchStatus" NOT NULL DEFAULT 'SUGGESTED',
  "review_type" TEXT,
  "ngo_review_notes" TEXT,
  "social_review_notes" TEXT,
  "rejection_reason" TEXT,
  "victim_confirmation_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3),
  CONSTRAINT "JobMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpCheckin" (
  "id" TEXT NOT NULL,
  "job_application_id" INTEGER NOT NULL,
  "anonymous_code" TEXT NOT NULL,
  "ngo_id" TEXT,
  "period_label" TEXT NOT NULL,
  "channel" "FollowUpChannel" NOT NULL DEFAULT 'SMS',
  "prompt" TEXT,
  "response" TEXT,
  "response_code" TEXT,
  "status" "CheckinStatus" NOT NULL DEFAULT 'PENDING',
  "risk_severity" "AlertSeverity" NOT NULL DEFAULT 'LOW',
  "due_at" TIMESTAMP(3) NOT NULL,
  "responded_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3),
  CONSTRAINT "FollowUpCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
  "id" TEXT NOT NULL,
  "anonymous_code" TEXT NOT NULL,
  "ngo_id" TEXT,
  "job_application_id" INTEGER,
  "checkin_id" TEXT,
  "type" TEXT NOT NULL,
  "severity" "AlertSeverity" NOT NULL,
  "source" TEXT NOT NULL,
  "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
  "owner_code" TEXT,
  "resolution_notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3),
  "resolved_at" TIMESTAMP(3),
  CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "Employer_ngo_id_validation_status_is_active_idx" ON "Employer"("ngo_id", "validation_status", "is_active");
CREATE INDEX "Job_is_active_status_location_idx" ON "Job"("is_active", "status", "location");
CREATE UNIQUE INDEX "JobMatch_job_id_anonymous_code_key" ON "JobMatch"("job_id", "anonymous_code");
CREATE INDEX "JobMatch_ngo_id_status_idx" ON "JobMatch"("ngo_id", "status");
CREATE INDEX "JobMatch_anonymous_code_status_idx" ON "JobMatch"("anonymous_code", "status");
CREATE INDEX "FollowUpCheckin_anonymous_code_status_idx" ON "FollowUpCheckin"("anonymous_code", "status");
CREATE INDEX "FollowUpCheckin_ngo_id_status_idx" ON "FollowUpCheckin"("ngo_id", "status");
CREATE INDEX "Alert_anonymous_code_status_severity_idx" ON "Alert"("anonymous_code", "status", "severity");
CREATE INDEX "Alert_ngo_id_status_idx" ON "Alert"("ngo_id", "status");

-- Foreign keys
ALTER TABLE "Employer" ADD CONSTRAINT "Employer_ngo_id_fkey" FOREIGN KEY ("ngo_id") REFERENCES "NGO"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_anonymous_code_fkey" FOREIGN KEY ("anonymous_code") REFERENCES "User"("anonymous_code") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_ngo_id_fkey" FOREIGN KEY ("ngo_id") REFERENCES "NGO"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_job_match_id_fkey" FOREIGN KEY ("job_match_id") REFERENCES "JobMatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_ngo_id_fkey" FOREIGN KEY ("ngo_id") REFERENCES "NGO"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FollowUpCheckin" ADD CONSTRAINT "FollowUpCheckin_job_application_id_fkey" FOREIGN KEY ("job_application_id") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowUpCheckin" ADD CONSTRAINT "FollowUpCheckin_anonymous_code_fkey" FOREIGN KEY ("anonymous_code") REFERENCES "User"("anonymous_code") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowUpCheckin" ADD CONSTRAINT "FollowUpCheckin_ngo_id_fkey" FOREIGN KEY ("ngo_id") REFERENCES "NGO"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_anonymous_code_fkey" FOREIGN KEY ("anonymous_code") REFERENCES "User"("anonymous_code") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_ngo_id_fkey" FOREIGN KEY ("ngo_id") REFERENCES "NGO"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_job_application_id_fkey" FOREIGN KEY ("job_application_id") REFERENCES "JobApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_checkin_id_fkey" FOREIGN KEY ("checkin_id") REFERENCES "FollowUpCheckin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
