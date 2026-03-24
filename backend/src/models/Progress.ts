import prismaService from '../services/prisma'
import { all, get, run } from '../database'
import { isDatabaseUnavailableError, logDatabaseFallback } from '../services/databaseFallback'
import CourseModel from './Course'
import { Progress } from '../types'

const prisma = prismaService.getClient()

const toIsoString = (value: Date | string | null | undefined): string | undefined => {
  if (!value) {
    return undefined
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

const toProgress = (row: {
  id: number
  user_code: string
  course_id: string
  completed_modules: string
  percentage: number
  current_module: number
  quiz_attempts: number
  last_quiz_score: number | null
  last_activity: Date | string
  completed_at: Date | string | null
}): Progress => {
  const progress: Progress = {
    id: row.id,
    user_code: row.user_code,
    course_id: row.course_id,
    completed_modules: row.completed_modules,
    percentage: row.percentage,
    current_module: row.current_module,
    quiz_attempts: row.quiz_attempts,
    last_activity: toIsoString(row.last_activity) ?? new Date().toISOString()
  }

  if (row.last_quiz_score !== null) {
    progress.last_quiz_score = row.last_quiz_score
  }

  if (row.completed_at) {
    const completedAt = toIsoString(row.completed_at)
    if (completedAt) {
      progress.completed_at = completedAt
    }
  }

  return progress
}

class ProgressModel {
  static async findByUserAndCourse(userCode: string, courseId: string): Promise<Progress | null> {
    try {
      const progress = await prisma.progress.findUnique({
        where: {
          user_code_course_id: {
            user_code: userCode,
            course_id: courseId
          }
        }
      })

      return progress ? toProgress(progress) : null
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error
      }

      logDatabaseFallback(`progress.findByUserAndCourse:${userCode}:${courseId}`, error)

      const progress = await get<{
        id: number
        user_code: string
        course_id: string
        completed_modules: string
        percentage: number
        current_module: number
        quiz_attempts: number
        last_quiz_score: number | null
        last_activity: string
        completed_at: string | null
      }>(`
        SELECT id, user_code, course_id, completed_modules, percentage, current_module, quiz_attempts, last_quiz_score, last_activity, completed_at
        FROM progress
        WHERE user_code = ? AND course_id = ?
        LIMIT 1
      `, [userCode, courseId])

      return progress ? toProgress(progress) : null
    }
  }

  static async findByUser(userCode: string): Promise<Progress[]> {
    try {
      const rows = await prisma.progress.findMany({
        where: { user_code: userCode },
        orderBy: { last_activity: 'desc' }
      })
      return rows.map(toProgress)
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error
      }

      logDatabaseFallback(`progress.findByUser:${userCode}`, error)

      const rows = await all<{
        id: number
        user_code: string
        course_id: string
        completed_modules: string
        percentage: number
        current_module: number
        quiz_attempts: number
        last_quiz_score: number | null
        last_activity: string
        completed_at: string | null
      }>(`
        SELECT id, user_code, course_id, completed_modules, percentage, current_module, quiz_attempts, last_quiz_score, last_activity, completed_at
        FROM progress
        WHERE user_code = ?
        ORDER BY last_activity DESC
      `, [userCode])

      return rows.map(toProgress)
    }
  }

  static async createOrUpdate(userCode: string, courseId: string, progressData: Partial<Progress>): Promise<Progress> {
    const completedModules = progressData.completed_modules ?? JSON.stringify([])
    const percentage = progressData.percentage ?? 0
    const currentModule = progressData.current_module ?? 1
    const quizAttempts = progressData.quiz_attempts ?? 0
    const lastQuizScore = progressData.last_quiz_score ?? null
    const completedAt = percentage >= 100 ? new Date() : null

    try {
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
          current_module: currentModule,
          quiz_attempts: quizAttempts,
          last_quiz_score: lastQuizScore,
          last_activity: new Date(),
          completed_at: completedAt
        },
        create: {
          user_code: userCode,
          course_id: courseId,
          completed_modules: completedModules,
          percentage,
          current_module: currentModule,
          quiz_attempts: quizAttempts,
          last_quiz_score: lastQuizScore,
          last_activity: new Date(),
          completed_at: completedAt
        }
      })

      return toProgress(row)
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error
      }

      logDatabaseFallback(`progress.createOrUpdate:${userCode}:${courseId}`, error)

      await run(
        `
          INSERT INTO progress (
            user_code, course_id, completed_modules, percentage, current_module, quiz_attempts, last_quiz_score, last_activity, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_code, course_id) DO UPDATE SET
            completed_modules = excluded.completed_modules,
            percentage = excluded.percentage,
            current_module = excluded.current_module,
            quiz_attempts = excluded.quiz_attempts,
            last_quiz_score = excluded.last_quiz_score,
            last_activity = excluded.last_activity,
            completed_at = excluded.completed_at
        `,
        [
          userCode,
          courseId,
          completedModules,
          percentage,
          currentModule,
          quizAttempts,
          lastQuizScore,
          new Date().toISOString(),
          completedAt?.toISOString() ?? null
        ]
      )

      const fallbackRow = await this.findByUserAndCourse(userCode, courseId)

      if (!fallbackRow) {
        throw new Error('Could not persist progress using fallback database')
      }

      return fallbackRow
    }
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
    const course = await CourseModel.findById(courseId)
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
