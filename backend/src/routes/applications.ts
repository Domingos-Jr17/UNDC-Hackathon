import express from 'express'
import { body } from 'express-validator'
import ApplicationsController from '../controllers/ApplicationsController'
import { handleValidationErrors, requireStaffRole } from '../middleware/security'

const router = express.Router()

router.get('/', requireStaffRole, ApplicationsController.list)

router.post(
  '/:id/transition',
  requireStaffRole,
  body('status').isIn([
    'DRAFT',
    'SUBMITTED',
    'INTERVIEW_SCHEDULED',
    'INTERVIEW_COMPLETED',
    'OFFER_MADE',
    'REJECTED',
    'ACCEPTED',
    'PLACED',
    'WITHDRAWN'
  ]).withMessage('status invalido'),
  body('notes').optional().isString().isLength({ max: 2000 }).withMessage('notes invalido'),
  handleValidationErrors,
  ApplicationsController.transition
)

export default router
