import express from 'express'
import { body } from 'express-validator'
import EmployersController from '../controllers/EmployersController'
import { handleValidationErrors, requireStaffRole } from '../middleware/security'

const router = express.Router()

router.get('/', requireStaffRole, EmployersController.list)

router.post(
  '/',
  requireStaffRole,
  body('name').isString().trim().isLength({ min: 2, max: 160 }).withMessage('name invalido'),
  body('sector').optional({ nullable: true }).isString().isLength({ max: 120 }).withMessage('sector invalido'),
  body('location').optional({ nullable: true }).isString().isLength({ max: 120 }).withMessage('location invalida'),
  handleValidationErrors,
  EmployersController.create
)

router.put(
  '/:id',
  requireStaffRole,
  body('name').optional().isString().trim().isLength({ min: 2, max: 160 }).withMessage('name invalido'),
  body('validationStatus').optional().isIn(['PENDING', 'VALIDATED', 'REJECTED', 'SUSPENDED']).withMessage('validationStatus invalido'),
  body('validation_status').optional().isIn(['PENDING', 'VALIDATED', 'REJECTED', 'SUSPENDED']).withMessage('validation_status invalido'),
  body('isActive').optional().isBoolean().withMessage('isActive invalido'),
  handleValidationErrors,
  EmployersController.update
)

export default router
