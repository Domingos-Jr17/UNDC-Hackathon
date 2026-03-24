import express from 'express'
import { body } from 'express-validator'
import MatchesController from '../controllers/MatchesController'
import { handleValidationErrors, requireStaffRole } from '../middleware/security'

const router = express.Router()

router.get('/', requireStaffRole, MatchesController.list)

router.post(
  '/:id/review',
  requireStaffRole,
  body('decision').isIn(['approve', 'reject']).withMessage('decision invalido'),
  body('reviewType').isIn(['ngo', 'social']).withMessage('reviewType invalido'),
  body('notes').optional().isString().isLength({ max: 2000 }).withMessage('notes invalido'),
  body('rejectionReason').optional().isString().isLength({ max: 2000 }).withMessage('rejectionReason invalido'),
  handleValidationErrors,
  MatchesController.review
)

router.post(
  '/:id/confirm-victim',
  requireStaffRole,
  body('confirmed').isBoolean().withMessage('confirmed invalido'),
  body('notes').optional().isString().isLength({ max: 2000 }).withMessage('notes invalido'),
  handleValidationErrors,
  MatchesController.confirmVictim
)

export default router
