import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { canAccessAnonymousCode, logger } from '../middleware/security';
import ProgressModel from '../models/Progress';
import CourseModel from '../models/Course';

class ProgressController {
  static async getUserAggregate(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userCode } = req.params;

    if (!canAccessAnonymousCode(req.user, userCode)) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado para este recurso'
      });
      return;
    }

    try {
      const [progressRows, courses] = await Promise.all([
        ProgressModel.findByUser(userCode),
        CourseModel.findMany()
      ]);

      const progressByCourse = new Map(progressRows.map(item => [item.course_id, item]));

      const coursesWithProgress = courses.map(course => {
        const progress = progressByCourse.get(course.id);
        const completedModules = progress ? JSON.parse(progress.completed_modules || '[]') as string[] : [];

        return {
          courseId: course.id,
          title: course.title,
          modulesCount: course.modules_count,
          progress: progress?.percentage ?? 0,
          currentModule: progress?.current_module ?? 1,
          completedModules,
          lastActivity: progress?.last_activity ?? null
        };
      });

      const totalCourses = coursesWithProgress.length;
      const activeCourses = coursesWithProgress.filter(item => item.progress > 0).length;
      const averageProgress = totalCourses > 0
        ? Math.round(coursesWithProgress.reduce((acc, item) => acc + item.progress, 0) / totalCourses)
        : 0;

      res.json({
        success: true,
        userCode,
        summary: {
          totalCourses,
          activeCourses,
          averageProgress
        },
        courses: coursesWithProgress
      });
    } catch (error) {
      logger.error('Database error fetching aggregated user progress', {
        error: (error as Error).message,
        userCode
      });
      res.status(500).json({
        error: 'Erro no banco de dados'
      });
    }
  }

  static async getUserProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userCode, courseId } = req.params;

    if (!canAccessAnonymousCode(req.user, userCode)) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado para este recurso'
      });
      return;
    }

    try {
      // Use ORM-like method to find progress
      const progress = await ProgressModel.findUnique({
        user_code: userCode,
        course_id: courseId
      });

      if (!progress) {
        res.status(404).json({
          success: false,
          error: 'Progresso não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        progress
      });
    } catch (error) {
      logger.error('Database error fetching progress', {
        error: (error as Error).message,
        userCode,
        courseId
      });
      res.status(500).json({
        error: 'Erro no banco de dados'
      });
    }
  }

  static async updateProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userCode, courseId } = req.params;
    const { completedModules, percentage, currentModule, quizAttempts, lastQuizScore } = req.body;

    if (!canAccessAnonymousCode(req.user, userCode)) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado para este recurso'
      });
      return;
    }

    try {
      const progress = await ProgressModel.updateProgress(
        userCode,
        courseId,
        completedModules,
        percentage,
        currentModule,
        quizAttempts,
        lastQuizScore
      );

      res.json({
        success: true,
        message: 'Progresso atualizado com sucesso',
        progress
      });
    } catch (error) {
      logger.error('Database error updating progress', {
        error: (error as Error).message,
        userCode,
        courseId
      });
      res.status(500).json({
        error: 'Erro no banco de dados'
      });
    }
  }

  static async createProgress(req: Request, res: Response): Promise<void> {
    try {
      const progressData = req.body;

      // In a real Prisma implementation, this would be:
      // const progress = await prisma.progress.create({ data: progressData });

      // For now, we'll simulate with our ORM-like method
      const progress = await ProgressModel.create(progressData);

      res.status(201).json({
        success: true,
        progress,
        message: 'Progresso criado com sucesso'
      });
    } catch (error) {
      logger.error('Database error creating progress', {
        error: (error as Error).message
      });
      res.status(500).json({
        error: 'Erro no banco de dados'
      });
    }
  }

  static async updateProgressRecord(req: Request, res: Response): Promise<void> {
    const { userCode, courseId } = req.params;
    const updateData = req.body;

    try {
      // In a real Prisma implementation, this would be:
      // const progress = await prisma.progress.update({ 
      //   where: { user_code_course_id: { user_code: userCode, course_id: courseId } }, 
      //   data: updateData 
      // });

      // For now, we'll simulate with our ORM-like method
      const progress = await ProgressModel.update(
        { user_code: userCode, course_id: courseId },
        updateData
      );

      if (!progress) {
        res.status(404).json({
          success: false,
          error: 'Progresso não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        progress,
        message: 'Progresso atualizado com sucesso'
      });
    } catch (error) {
      logger.error('Database error updating progress record', {
        error: (error as Error).message,
        userCode,
        courseId
      });
      res.status(500).json({
        error: 'Erro no banco de dados'
      });
    }
  }

  static async deleteProgress(req: Request, res: Response): Promise<void> {
    const { userCode, courseId } = req.params;

    try {
      // In a real Prisma implementation, this would be:
      // await prisma.progress.delete({ 
      //   where: { user_code_course_id: { user_code: userCode, course_id: courseId } } 
      // });

      // For now, we'll simulate with our ORM-like method
      await ProgressModel.delete({ user_code: userCode, course_id: courseId });

      res.json({
        success: true,
        message: 'Progresso removido com sucesso'
      });
    } catch (error) {
      logger.error('Database error deleting progress', {
        error: (error as Error).message,
        userCode,
        courseId
      });
      res.status(500).json({
        error: 'Erro no banco de dados'
      });
    }
  }

  static async getAllProgress(_req: Request, res: Response): Promise<void> {
    try {
      // In a real Prisma implementation, this would be:
      // const progressRecords = await prisma.progress.findMany();

      // For now, we'll simulate with our ORM-like method
      const progressRecords = await ProgressModel.findMany();

      res.json({
        success: true,
        progress: progressRecords
      });
    } catch (error) {
      logger.error('Database error fetching all progress', {
        error: (error as Error).message
      });
      res.status(500).json({
        error: 'Erro no banco de dados'
      });
    }
  }
}

export default ProgressController;
