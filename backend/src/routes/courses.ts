import express, { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { authenticateToken, handleValidationErrors, logger, requireStaffRole } from '../middleware/security';
import CourseController from '../controllers/CourseController';
import cacheService from '../services/cache';

const router = express.Router();

// Cache middleware
const cacheMiddleware = (ttl: number = 1800) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const cacheKey = `route:${req.method}:${req.originalUrl}`;

    try {
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        logger.debug('Cache hit', { key: cacheKey });
        res.json(cached);
        return;
      }

      // Store res.json to intercept response
      const originalJson = res.json;
      res.json = function (data: unknown) {
        // Cache the response (convert to JSON string)
        cacheService.set(cacheKey, JSON.stringify(data), ttl).catch(err => {
          logger.error('Failed to cache response', { error: (err as Error).message, key: cacheKey })
        });

        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: (error as Error).message, key: cacheKey });
      next();
    }
  }
};

// Get all courses with caching
router.get('/', cacheMiddleware(1800), CourseController.getAll);

// Create course (staff/admin only)
router.post(
  '/',
  authenticateToken,
  requireStaffRole,
  body('title').isString().trim().isLength({ min: 3, max: 120 }).withMessage('title invalido'),
  body('duration_hours').isInt({ min: 1, max: 1000 }).withMessage('duration_hours invalido'),
  body('modules_count').isInt({ min: 1, max: 200 }).withMessage('modules_count invalido'),
  body('level').isString().trim().isLength({ min: 2, max: 40 }).withMessage('level invalido'),
  body('modules').optional().isArray({ max: 200 }).withMessage('modules invalido'),
  body('modules.*.title').optional().isString().trim().isLength({ min: 1, max: 160 }).withMessage('module title invalido'),
  body('modules.*.duration_minutes').optional().isInt({ min: 1, max: 1440 }).withMessage('module duration invalido'),
  body('modules.*.description').optional({ nullable: true }).isString().isLength({ max: 4000 }).withMessage('module description invalida'),
  body('modules.*.video_url').optional({ nullable: true }).isURL().withMessage('module video_url invalido'),
  body('modules.*.pdf_url').optional({ nullable: true }).isURL().withMessage('module pdf_url invalido'),
  body('modules.*.text_content').optional({ nullable: true }).isString().isLength({ max: 20000 }).withMessage('module text_content invalido'),
  body('modules.*.downloadable').optional().isBoolean().withMessage('module downloadable invalido'),
  handleValidationErrors,
  CourseController.create
);

// Get course by ID with caching
router.get('/:id', cacheMiddleware(1800), CourseController.getById);

// Get course modules with caching
router.get('/:id/modules', cacheMiddleware(3600), CourseController.getModules);

// Get course quiz with caching
router.get('/:id/quiz', cacheMiddleware(3600), CourseController.getQuiz);

// Invalidate cache for course when updated
router.post('/:id/invalidate-cache', authenticateToken, requireStaffRole, CourseController.invalidateCache);

export default router;
