import prismaService from '../services/prisma'
import { Course as CourseInterface, CourseModule, QuizQuestion } from '../types'

const prisma = prismaService.getClient()

const toCourse = (course: {
  id: string
  title: string
  description: string | null
  instructor: string | null
  duration_hours: number
  modules_count: number
  level: string
  skills: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date | null
}): CourseInterface => ({
  id: course.id,
  title: course.title,
  duration_hours: course.duration_hours,
  modules_count: course.modules_count,
  level: course.level,
  is_active: course.is_active,
  created_at: course.created_at.toISOString(),
  ...(course.description !== null ? { description: course.description } : {}),
  ...(course.instructor !== null ? { instructor: course.instructor } : {}),
  ...(course.skills !== null ? { skills: course.skills } : {}),
  ...(course.updated_at ? { updated_at: course.updated_at.toISOString() } : {})
})

const toCourseModule = (row: {
  module_number: number
  title: string
  duration_minutes: number
  video_url: string | null
  pdf_url: string | null
  text_content: string | null
  downloadable: boolean
  description: string | null
}): CourseModule => ({
  id: row.module_number,
  title: row.title,
  duration: `${row.duration_minutes} min`,
  ...(row.video_url !== null ? { videoUrl: row.video_url } : {}),
  ...(row.pdf_url !== null ? { pdfUrl: row.pdf_url } : {}),
  ...(row.text_content !== null ? { textContent: row.text_content } : {}),
  downloadable: row.downloadable,
  ...(row.description !== null ? { description: row.description } : {})
})

interface CreateCourseModuleInput {
  title: string
  description?: string
  duration_minutes: number
  video_url?: string
  pdf_url?: string
  text_content?: string
  downloadable?: boolean
}

interface CreateCourseInput extends Omit<CourseInterface, 'id' | 'created_at' | 'updated_at'> {
  modules?: CreateCourseModuleInput[]
}

const safeParseOptions = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value) as unknown
    if (Array.isArray(parsed)) {
      return parsed.map(item => String(item))
    }
    return []
  } catch {
    return []
  }
}

const toQuizQuestion = (row: {
  position: number
  question_text: string
  options_json: string
  correct_answer: number
  explanation: string
}): QuizQuestion => ({
  id: row.position,
  question: row.question_text,
  options: safeParseOptions(row.options_json),
  correctAnswer: row.correct_answer,
  explanation: row.explanation
})

class CourseModel {
  static async findAll(): Promise<CourseInterface[]> {
    const courses = await prisma.course.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'asc' }
    })

    return courses.map(toCourse)
  }

  static async findById(id: string): Promise<CourseInterface | null> {
    const course = await prisma.course.findUnique({
      where: { id }
    })

    if (!course) {
      return null
    }

    return toCourse(course)
  }

  static async findModulesByCourseId(courseId: string): Promise<CourseModule[]> {
    const rows = await prisma.$queryRaw<Array<{
      module_number: number
      title: string
      duration_minutes: number
      video_url: string | null
      pdf_url: string | null
      text_content: string | null
      downloadable: boolean
      description: string | null
    }>>`
      SELECT
        "module_number",
        "title",
        "duration_minutes",
        "video_url",
        "pdf_url",
        "text_content",
        "downloadable",
        "description"
      FROM "CourseModule"
      WHERE "course_id" = ${courseId}
        AND "is_active" = true
      ORDER BY "module_number" ASC
    `
    return rows.map(toCourseModule)
  }

  static async findQuizByCourseId(courseId: string): Promise<QuizQuestion[]> {
    const rows = await prisma.courseQuizQuestion.findMany({
      where: {
        course_id: courseId,
        is_active: true
      },
      orderBy: { position: 'asc' }
    })

    return rows.map(toQuizQuestion)
  }

  static async findUnique(where: { id: string }): Promise<CourseInterface | null> {
    return this.findById(where.id)
  }

  static async findMany(): Promise<CourseInterface[]> {
    return this.findAll()
  }

  static async create(data: CreateCourseInput): Promise<CourseInterface> {
    const requestedModules = data.modules?.length
      ? data.modules
      : Array.from({ length: data.modules_count }, (_, index) => ({
          title: `Módulo ${index + 1}`,
          duration_minutes: 30,
          downloadable: false
        }))

    const normalizedModulesCount = requestedModules.length > 0 ? requestedModules.length : data.modules_count

    const course = await prisma.course.create({
      data: {
        id: `course-${Date.now()}`,
        title: data.title,
        description: data.description ?? null,
        instructor: data.instructor ?? null,
        duration_hours: data.duration_hours,
        modules_count: normalizedModulesCount,
        level: data.level,
        skills: data.skills ?? null,
        is_active: data.is_active ?? true
      }
    })

    if (requestedModules.length > 0) {
      await prisma.$transaction(
        requestedModules.map((module, index) => prisma.$executeRaw`
          INSERT INTO "CourseModule" (
            "course_id",
            "module_number",
            "title",
            "description",
            "duration_minutes",
            "video_url",
            "pdf_url",
            "text_content",
            "downloadable",
            "is_active",
            "created_at"
          ) VALUES (
            ${course.id},
            ${index + 1},
            ${module.title},
            ${'description' in module ? module.description ?? null : null},
            ${module.duration_minutes},
            ${'video_url' in module ? module.video_url ?? null : null},
            ${'pdf_url' in module ? module.pdf_url ?? null : null},
            ${'text_content' in module ? module.text_content ?? null : null},
            ${module.downloadable ?? Boolean(('video_url' in module ? module.video_url : undefined) || ('pdf_url' in module ? module.pdf_url : undefined))},
            ${true},
            ${new Date()}
          )
        `)
      )
    }

    return toCourse(course)
  }

  static async update(
    where: { id: string },
    data: Partial<Omit<CourseInterface, 'id' | 'created_at'>>
  ): Promise<CourseInterface | null> {
    try {
      const updateData = {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.instructor !== undefined ? { instructor: data.instructor } : {}),
        ...(data.duration_hours !== undefined ? { duration_hours: data.duration_hours } : {}),
        ...(data.modules_count !== undefined ? { modules_count: data.modules_count } : {}),
        ...(data.level !== undefined ? { level: data.level } : {}),
        ...(data.skills !== undefined ? { skills: data.skills } : {}),
        ...(data.is_active !== undefined ? { is_active: data.is_active } : {})
      }

      const course = await prisma.course.update({
        where,
        data: updateData
      })

      return toCourse(course)
    } catch {
      return null
    }
  }

  static async delete(where: { id: string }): Promise<void> {
    await prisma.course.delete({
      where
    })
  }
}

export default CourseModel
