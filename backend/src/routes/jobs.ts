import express from 'express'
import JobsController from '../controllers/JobsController'
import { authenticateToken, handleValidationErrors, ipRateLimit } from '../middleware/security'
import { body } from 'express-validator'

const router = express.Router()

router.get('/', authenticateToken, JobsController.listJobs)

router.post(
  '/matching',
  authenticateToken,
  body('anonymousCode').matches(/^V\d{4}$/i).withMessage('anonymousCode inválido'),
  handleValidationErrors,
  JobsController.getMatching
)

router.post(
  '/:id/apply',
  authenticateToken,
  body('anonymousCode').optional().matches(/^V\d{4}$/i).withMessage('anonymousCode invalido'),
  body('notes').optional().isString().isLength({ max: 1000 }).withMessage('notes invalido'),
  handleValidationErrors,
  ipRateLimit(20, 15 * 60 * 1000),
  JobsController.apply
)

export default router
