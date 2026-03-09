-- CreateTable
CREATE TABLE "NGO" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "license_number" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "NGO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "anonymous_code" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'VICTIM',
    "real_name" TEXT,
    "phone" TEXT,
    "ngo_id" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructor" TEXT,
    "duration_hours" INTEGER NOT NULL,
    "modules_count" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "skills" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseModule" (
    "id" SERIAL NOT NULL,
    "course_id" TEXT NOT NULL,
    "module_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration_minutes" INTEGER NOT NULL,
    "video_url" TEXT,
    "downloadable" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "CourseModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseQuizQuestion" (
    "id" SERIAL NOT NULL,
    "course_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "options_json" TEXT NOT NULL,
    "correct_answer" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "CourseQuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" SERIAL NOT NULL,
    "user_code" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "completed_modules" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL DEFAULT 0,
    "current_module" INTEGER NOT NULL DEFAULT 1,
    "quiz_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_quiz_score" INTEGER,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "anonymous_code" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "course_title" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verification_code" TEXT NOT NULL,
    "qr_code" TEXT NOT NULL,
    "instructor" TEXT,
    "institution" TEXT,
    "score" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL DEFAULT 100,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_date" TIMESTAMP(3),
    "verification_ip" TEXT,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revocation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "user_code" TEXT,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "table_name" TEXT,
    "record_id" TEXT,
    "old_values" TEXT,
    "new_values" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "Employer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "required_skills" TEXT NOT NULL,
    "contract_type" TEXT NOT NULL,
    "schedule" TEXT,
    "salary_range" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ngo_id" TEXT,
    "employer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" SERIAL NOT NULL,
    "job_id" TEXT NOT NULL,
    "anonymous_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "score" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UssdSession" (
    "id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "user_code" TEXT,
    "payload" TEXT,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UssdSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_anonymous_code_key" ON "User"("anonymous_code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_ngo_id_idx" ON "User"("ngo_id");

-- CreateIndex
CREATE INDEX "User_role_is_active_idx" ON "User"("role", "is_active");

-- CreateIndex
CREATE INDEX "Course_is_active_idx" ON "Course"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "CourseModule_course_id_module_number_key" ON "CourseModule"("course_id", "module_number");

-- CreateIndex
CREATE INDEX "CourseModule_course_id_is_active_idx" ON "CourseModule"("course_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "CourseQuizQuestion_course_id_position_key" ON "CourseQuizQuestion"("course_id", "position");

-- CreateIndex
CREATE INDEX "CourseQuizQuestion_course_id_is_active_idx" ON "CourseQuizQuestion"("course_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_user_code_course_id_key" ON "Progress"("user_code", "course_id");

-- CreateIndex
CREATE INDEX "Progress_user_code_idx" ON "Progress"("user_code");

-- CreateIndex
CREATE INDEX "Progress_course_id_idx" ON "Progress"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_verification_code_key" ON "Certificate"("verification_code");

-- CreateIndex
CREATE INDEX "Certificate_anonymous_code_course_id_idx" ON "Certificate"("anonymous_code", "course_id");

-- CreateIndex
CREATE INDEX "AuditLog_user_code_timestamp_idx" ON "AuditLog"("user_code", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_action_timestamp_idx" ON "AuditLog"("action", "timestamp");

-- CreateIndex
CREATE INDEX "Job_is_active_location_idx" ON "Job"("is_active", "location");

-- CreateIndex
CREATE INDEX "Job_ngo_id_idx" ON "Job"("ngo_id");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_job_id_anonymous_code_key" ON "JobApplication"("job_id", "anonymous_code");

-- CreateIndex
CREATE INDEX "JobApplication_anonymous_code_status_idx" ON "JobApplication"("anonymous_code", "status");

-- CreateIndex
CREATE INDEX "UssdSession_phone_number_idx" ON "UssdSession"("phone_number");

-- CreateIndex
CREATE INDEX "UssdSession_expires_at_idx" ON "UssdSession"("expires_at");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_ngo_id_fkey" FOREIGN KEY ("ngo_id") REFERENCES "NGO"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_user_code_fkey" FOREIGN KEY ("user_code") REFERENCES "User"("anonymous_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseQuizQuestion" ADD CONSTRAINT "CourseQuizQuestion_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_anonymous_code_fkey" FOREIGN KEY ("anonymous_code") REFERENCES "User"("anonymous_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_code_fkey" FOREIGN KEY ("user_code") REFERENCES "User"("anonymous_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_ngo_id_fkey" FOREIGN KEY ("ngo_id") REFERENCES "NGO"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "Employer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_anonymous_code_fkey" FOREIGN KEY ("anonymous_code") REFERENCES "User"("anonymous_code") ON DELETE CASCADE ON UPDATE CASCADE;
