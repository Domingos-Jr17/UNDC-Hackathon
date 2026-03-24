import prismaService from '../services/prisma'
import { Progress } from '../types'

const prisma = prismaService.getClient()

const toProgress = (row: {
  id: number
  user_code: string
  course_id: string
  completed_modules: string
  percentage: number
  current_module: number
  quiz_attempts: number
  last_quiz_score: number | null
  last_activity: Date
  completed_at: Date | null
}): Progress => {
  const progress: Progress = {
    id: row.id,
    user_code: row.user_code,
    course_id: row.course_id,
    completed_modules: row.completed_modules,
    percentage: row.percentage,
    current_module: row.current_module,
    quiz_attempts: row.quiz_attempts,
    last_activity: row.last_activity.toISOString()
  }

  if (row.last_quiz_score !== null) {
    progress.last_quiz_score = row.last_quiz_score
  }

  if (row.completed_at) {
    progress.completed_at = row.completed_at.toISOString()
  }

  return progress
}

class ProgressModel {
  static async findByUserAndCourse(userCode: string, courseId: string): Promise<Progress | null> {
    const progress = await prisma.progress.findUnique({
      where: {
        user_code_course_id: {
          user_code: userCode,
          course_id: courseId
        }
      }
    })

    return progress ? toProgress(progress) : null
  }

  static async findByUser(userCode: string): Promise<Progress[]> {
    const rows = await prisma.progress.findMany({
      where: { user_code: userCode },
      orderBy: { last_activity: 'desc' }
    })
    return rows.map(toProgress)
  }

  static async createOrUpdate(userCode: string, courseId: string, progressData: Partial<Progress>): Promise<Progress> {
    const completedModules = progressData.completed_modules ?? JSON.stringify([])
    const percentage = progressData.percentage ?? 0

    const row = await prisma.progress.upsert({
      where: {
        user_code_course_id: {
          user_code: userCode,
          course_id: courseId
        }
      },
      update: {
        completed_modules: completedModules,
        percentage,
        current_module: progressData.current_module ?? 1,
        quiz_attempts: progressData.quiz_attempts ?? 0,
        last_quiz_score: progressData.last_quiz_score ?? null,
        last_activity: new Date(),
        completed_at: percentage >= 100 ? new Date() : null
      },
      create: {
        user_code: userCode,
        course_id: courseId,
        completed_modules: completedModules,
        percentage,
        current_module: progressData.current_module ?? 1,
        quiz_attempts: progressData.quiz_attempts ?? 0,
        last_quiz_score: progressData.last_quiz_score ?? null,
        last_activity: new Date(),
        completed_at: percentage >= 100 ? new Date() : null
      }
    })

    return toProgress(row)
  }

  static async updateProgress(
    userCode: string,
    courseId: string,
    moduleIds: string[],
    percentage: number,
    currentModule?: number,
    quizAttempts?: number,
    lastQuizScore?: number
  ): Promise<Progress> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { modules_count: true }
    })
    const completedModulesStr = JSON.stringify(moduleIds)
    const completedNumbers = moduleIds
      .map(value => Number(value))
      .filter(value => Number.isInteger(value) && value > 0)
      .sort((left, right) => left - right)
    const modulesCount = course?.modules_count ?? Math.max(completedNumbers.length, currentModule ?? 1)
    const nextPendingModule = (() => {
      for (let index = 1; index <= modulesCount; index += 1) {
        if (!completedNumbers.includes(index)) {
          return index
        }
      }
      return modulesCount
    })()

    const payload: Partial<Progress> = {
      completed_modules: completedModulesStr,
      percentage,
      current_module: percentage >= 100 ? modulesCount : nextPendingModule
    }

    if (currentModule !== undefined && !payload.current_module) {
      payload.current_module = currentModule
    }

    if (quizAttempts !== undefined) {
      payload.quiz_attempts = quizAttempts
    }

    if (lastQuizScore !== undefined) {
      payload.last_quiz_score = lastQuizScore
    }

    if (percentage >= 100) {
      payload.completed_at = new Date().toISOString()
    }

    return this.createOrUpdate(userCode, courseId, payload)
  }

  static async findUnique(where: { user_code: string; course_id: string }): Promise<Progress | null> {
    return this.findByUserAndCourse(where.user_code, where.course_id)
  }

  static async findMany(): Promise<Progress[]> {
    const rows = await prisma.progress.findMany({
      orderBy: { last_activity: 'desc' }
    })
    return rows.map(toProgress)
  }

  static async create(data: Omit<Progress, 'id' | 'last_activity'>): Promise<Progress> {
    const row = await prisma.progress.create({
      data: {
        user_code: data.user_code,
        course_id: data.course_id,
        completed_modules: data.completed_modules,
        percentage: data.percentage,
        current_module: data.current_module,
        quiz_attempts: data.quiz_attempts,
        last_quiz_score: data.last_quiz_score ?? null,
        completed_at: data.completed_at ? new Date(data.completed_at) : null
      }
    })
    return toProgress(row)
  }

  static async update(
    where: { user_code: string; course_id: string },
    data: Partial<Omit<Progress, 'id' | 'user_code' | 'course_id' | 'last_activity'>>
  ): Promise<Progress | null> {
    try {
      const updateData = {
        ...(data.completed_modules !== undefined ? { completed_modules: data.completed_modules } : {}),
        ...(data.percentage !== undefined ? { percentage: data.percentage } : {}),
        ...(data.current_module !== undefined ? { current_module: data.current_module } : {}),
        ...(data.quiz_attempts !== undefined ? { quiz_attempts: data.quiz_attempts } : {}),
        ...(data.last_quiz_score !== undefined ? { last_quiz_score: data.last_quiz_score } : {}),
        ...(data.completed_at !== undefined
          ? { completed_at: data.completed_at ? new Date(data.completed_at) : null }
          : {}),
        last_activity: new Date()
      }

      const row = await prisma.progress.update({
        where: {
          user_code_course_id: {
            user_code: where.user_code,
            course_id: where.course_id
          }
        },
        data: updateData
      })
      return toProgress(row)
    } catch {
      return null
    }
  }

  static async delete(where: { user_code: string; course_id: string }): Promise<void> {
    await prisma.progress.delete({
      where: {
        user_code_course_id: {
          user_code: where.user_code,
          course_id: where.course_id
        }
      }
    })
  }
}

export default ProgressModel
