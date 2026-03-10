import { Request, Response } from 'express';
import { logger } from '../middleware/security';
import AuditLogModel from '../models/AuditLog';

class AuditLogController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '50', userCode, action, tableName } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const whereClause: any = {};
      if (userCode) whereClause.user_code = userCode;
      if (action) whereClause.action = action;
      if (tableName) whereClause.table_name = tableName;

      const auditLogs = await AuditLogModel.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limitNum,
        skip
      });

      res.json({
        success: true,
        auditLogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: await AuditLogModel.count(whereClause)
        }
      });
    } catch (error) {
      logger.error('Error fetching audit logs', { error: (error as Error).message });
      res.status(500).json({
        error: 'Erro ao buscar registos de auditoria'
      });
    }
  }

  static async getByUser(req: Request, res: Response): Promise<void> {
    const { userCode } = req.params;
    const { limit = '50' } = req.query;
    const limitNum = parseInt(limit as string);

    try {

      const auditLogs = await AuditLogModel.findByUser(userCode, limitNum);

      res.json({
        success: true,
        auditLogs,
        userCode
      });
    } catch (error) {
      logger.error('Error fetching user audit logs', { error: (error as Error).message, userCode });
      res.status(500).json({
        error: 'Erro ao buscar registos de auditoria do usuário'
      });
    }
  }

  static async getByAction(req: Request, res: Response): Promise<void> {
    const { action } = req.params;
    const { limit = '50' } = req.query;
    const limitNum = parseInt(limit as string);

    try {
      
      const auditLogs = await AuditLogModel.findByAction(action, limitNum);

      res.json({
        success: true,
        auditLogs,
        action
      });
    } catch (error) {
      logger.error('Error fetching action audit logs', { error: (error as Error).message, action });
      res.status(500).json({
        error: 'Erro ao buscar registos de auditoria da ação'
      });
    }
  }

  static async getByTable(req: Request, res: Response): Promise<void> {
    const { tableName } = req.params;
    const { limit = '50' } = req.query;
    const limitNum = parseInt(limit as string);

    try {
      
      const auditLogs = await AuditLogModel.findByTable(tableName, limitNum);

      res.json({
        success: true,
        auditLogs,
        tableName
      });
    } catch (error) {
      logger.error('Error fetching table audit logs', { error: (error as Error).message, tableName });
      res.status(500).json({
        error: 'Erro ao buscar registos de auditoria da tabela'
      });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const auditLogData = req.body;
      const auditLog = await AuditLogModel.createWithPrisma(auditLogData);

      res.status(201).json({
        success: true,
        auditLog,
        message: 'Registo de auditoria criado com sucesso'
      });
    } catch (error) {
      logger.error('Error creating audit log', { error: (error as Error).message });
      res.status(500).json({
        error: 'Erro ao criar registo de auditoria'
      });
    }
  }

  static async getStats(_req: Request, res: Response): Promise<void> {
    try {
     
      const totalLogs = await AuditLogModel.count();

      res.json({
        success: true,
        stats: {
          totalLogs,
        }
      });
    } catch (error) {
      logger.error('Error fetching audit log stats', { error: (error as Error).message });
      res.status(500).json({
        error: 'Erro ao buscar estatísticas de auditoria'
      });
    }
  }
}

export default AuditLogController;



