import express from 'express'
import { body } from 'express-validator'
import AlertsController from '../controllers/AlertsController'
import { handleValidationErrors, requireStaffRole } from '../middleware/security'

const router = express.Router()

router.get('/', requireStaffRole, AlertsController.list)

router.put(
  '/:id',
  requireStaffRole,
  body('status').optional().isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED']).withMessage('status invalido'),
  body('resolutionNotes').optional().isString().isLength({ max: 4000 }).withMessage('resolutionNotes invalido'),
  body('ownerCode').optional().isString().isLength({ max: 50 }).withMessage('ownerCode invalido'),
  handleValidationErrors,
  AlertsController.update
)

export default router
