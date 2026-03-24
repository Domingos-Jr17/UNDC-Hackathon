import { Response } from 'express'
import prismaService from '../services/prisma'
import { AuthenticatedRequest } from '../types'
import { canAccessAnonymousCode, logger } from '../middleware/security'

const prisma = prismaService.getClient()

class QuizController {
  static async submit(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { anonymousCode, courseId, answers } = req.body as {
      anonymousCode: string
      courseId: string
      answers: number[]
    }

    if (!canAccessAnonymousCode(req.user, anonymousCode)) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado para este recurso'
      })
      return
    }

    try {
      const questions = await prisma.courseQuizQuestion.findMany({
        where: {
          course_id: courseId,
          is_active: true
        },
        orderBy: { position: 'asc' }
      })

      if (questions.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Quiz indisponível para este curso'
        })
        return
      }

      const reviews = questions.map((question, index) => {
        const normalizedCorrectIndex = question.correct_answer >= 1 && question.correct_answer <= JSON.parse(question.options_json).length
          ? question.correct_answer - 1
          : question.correct_answer
        const selectedIndex = typeof answers[index] === 'number' ? answers[index] : -1

        return {
          questionId: question.id,
          question: question.question_text,
          selectedIndex,
          correctIndex: normalizedCorrectIndex,
          isCorrect: selectedIndex === normalizedCorrectIndex,
          explanation: question.explanation
        }
      })

      const correctAnswers = reviews.filter(review => review.isCorrect).length
      const score = Math.round((correctAnswers / questions.length) * 100)
      const passed = score >= 70

      await prisma.auditLog.create({
        data: {
          user_code: anonymousCode,
          action: 'QUIZ_SUBMITTED',
          table_name: 'CourseQuizQuestion',
          record_id: courseId,
          new_values: JSON.stringify({
            courseId,
            totalQuestions: questions.length,
            correctAnswers,
            score,
            passed
          })
        }
      })

      res.json({
        success: true,
        result: {
          courseId,
          anonymousCode,
          totalQuestions: questions.length,
          correctAnswers,
          score,
          passed,
          reviews
        }
      })
    } catch (error) {
      logger.error('Error submitting quiz', {
        error: (error as Error).message,
        anonymousCode,
        courseId
      })
      res.status(500).json({
        error: 'Erro ao processar quiz'
      })
    }
  }
}

export default QuizController
