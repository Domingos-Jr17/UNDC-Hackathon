import express from 'express'
import { body } from 'express-validator'
import CheckinsController from '../controllers/CheckinsController'
import { handleValidationErrors, requireStaffRole } from '../middleware/security'

const router = express.Router()

router.get('/', requireStaffRole, CheckinsController.list)

router.post(
  '/schedule',
  requireStaffRole,
  body('jobApplicationId').isInt({ min: 1 }).withMessage('jobApplicationId invalido'),
  body('periodLabel').isString().trim().isLength({ min: 2, max: 120 }).withMessage('periodLabel invalido'),
  body('channel').optional().isIn(['SMS', 'USSD', 'APP', 'MANUAL']).withMessage('channel invalido'),
  body('prompt').optional().isString().isLength({ max: 1000 }).withMessage('prompt invalido'),
  body('dueAt').optional().isISO8601().withMessage('dueAt invalido'),
  handleValidationErrors,
  CheckinsController.schedule
)

router.post(
  '/:id/respond',
  requireStaffRole,
  body('response').optional().isString().isLength({ max: 2000 }).withMessage('response invalida'),
  body('responseCode').optional().isString().isLength({ max: 50 }).withMessage('responseCode invalido'),
  handleValidationErrors,
  CheckinsController.respond
)

export default router
