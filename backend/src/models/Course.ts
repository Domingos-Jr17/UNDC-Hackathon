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
  downloadable: boolean
  description: string | null
}): CourseModule => ({
  id: row.module_number,
  title: row.title,
  duration: `${row.duration_minutes} min`,
  videoUrl: row.video_url ?? '',
  downloadable: row.downloadable,
  ...(row.description !== null ? { description: row.description } : {})
})

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
    const rows = await prisma.courseModule.findMany({
      where: {
        course_id: courseId,
        is_active: true
      },
      orderBy: { module_number: 'asc' }
    })

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

  static async create(data: Omit<CourseInterface, 'id' | 'created_at' | 'updated_at'>): Promise<CourseInterface> {
    const course = await prisma.course.create({
      data: {
        id: `course-${Date.now()}`,
        title: data.title,
        description: data.description ?? null,
        instructor: data.instructor ?? null,
        duration_hours: data.duration_hours,
        modules_count: data.modules_count,
        level: data.level,
        skills: data.skills ?? null,
        is_active: data.is_active ?? true
      }
    })

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
