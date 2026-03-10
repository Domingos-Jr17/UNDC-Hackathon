import { Request, Response } from 'express';
import { logger } from '../middleware/security';
import NGOModel from '../models/NGO';

class NGOController {
  static async getAll(_req: Request, res: Response): Promise<void> {
    try {
      // In a real Prisma implementation, this would be:
      // const ngos = await prisma.ngo.findMany({
      //   where: { is_active: true }
      // });

      // For now, we'll simulate with our ORM-like method
      const ngos = await NGOModel.findMany();

      res.json({
        success: true,
        ngos
      });
    } catch (error) {
      logger.error('Error fetching NGOs', { error: (error as Error).message });
      res.status(500).json({
        error: 'Erro ao buscar ONGs'
      });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      // In a real Prisma implementation, this would be:
      // const ngo = await prisma.ngo.findUnique({
      //   where: { id }
      // });

      // For now, we'll simulate with our ORM-like method
      const ngo = await NGOModel.findUnique({ id });

      if (!ngo) {
        res.status(404).json({
          success: false,
          error: 'ONG não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        ngo
      });
    } catch (error) {
      logger.error('Error fetching NGO', { error: (error as Error).message, id });
      res.status(500).json({
        error: 'Erro ao buscar ONG'
      });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const ngoData = req.body;

      // In a real Prisma implementation, this would be:
      // const ngo = await prisma.ngo.create({ data: ngoData });

      // For now, we'll simulate with our ORM-like method
      const ngo = await NGOModel.createWithPrisma(ngoData);

      res.status(201).json({
        success: true,
        ngo,
        message: 'ONG criada com sucesso'
      });
    } catch (error) {
      logger.error('Error creating NGO', { error: (error as Error).message });
      res.status(500).json({
        error: 'Erro ao criar ONG'
      });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const updateData = req.body;

    try {
      // In a real Prisma implementation, this would be:
      // const ngo = await prisma.ngo.update({ 
      //   where: { id }, 
      //   data: updateData 
      // });

      // For now, we'll simulate with our ORM-like method
      const ngo = await NGOModel.updateWithPrisma({ id }, updateData);

      if (!ngo) {
        res.status(404).json({
          success: false,
          error: 'ONG não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        ngo,
        message: 'ONG atualizada com sucesso'
      });
    } catch (error) {
      logger.error('Error updating NGO', { error: (error as Error).message, id });
      res.status(500).json({
        error: 'Erro ao atualizar ONG'
      });
    }
  }

  static async deactivate(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      // In a real Prisma implementation, this would be:
      // await prisma.ngo.update({
      //   where: { id },
      //   data: { is_active: false }
      // });

      // For now, we'll simulate with our ORM-like method
      await NGOModel.deactivate(id);

      res.json({
        success: true,
        message: 'ONG desactivada com sucesso'
      });
    } catch (error) {
      logger.error('Error deactivating NGO', { error: (error as Error).message, id });
      res.status(500).json({
        error: 'Erro ao desactivar ONG'
      });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      // In a real Prisma implementation, this would be:
      // await prisma.ngo.delete({ where: { id } });

      // For now, we'll simulate with our ORM-like method
      await NGOModel.delete({ id });

      res.json({
        success: true,
        message: 'ONG removida com sucesso'
      });
    } catch (error) {
      logger.error('Error deleting NGO', { error: (error as Error).message, id });
      res.status(500).json({
        error: 'Erro ao remover ONG'
      });
    }
  }
}

export default NGOController;

