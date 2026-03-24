import express from 'express'
import JobsController from '../controllers/JobsController'
import { authenticateToken, handleValidationErrors, ipRateLimit, requireStaffRole } from '../middleware/security'
import { body } from 'express-validator'

const router = express.Router()

router.get('/', authenticateToken, JobsController.listJobs)

router.post(
  '/',
  authenticateToken,
  requireStaffRole,
  body('title').isString().trim().isLength({ min: 3, max: 160 }).withMessage('title invalido'),
  body('description').isString().trim().isLength({ min: 10, max: 5000 }).withMessage('description invalida'),
  body('location').isString().trim().isLength({ min: 2, max: 120 }).withMessage('location invalida'),
  body('requiredSkills').optional().isString().isLength({ max: 2000 }).withMessage('requiredSkills invalido'),
  body('required_skills').optional().isString().isLength({ max: 2000 }).withMessage('required_skills invalido'),
  body('contractType').optional().isString().isLength({ max: 120 }).withMessage('contractType invalido'),
  body('contract_type').optional().isString().isLength({ max: 120 }).withMessage('contract_type invalido'),
  body('status').optional().isIn(['DRAFT', 'VALIDATED', 'OPEN', 'CLOSED', 'REJECTED']).withMessage('status invalido'),
  handleValidationErrors,
  JobsController.create
)

router.put(
  '/:id',
  authenticateToken,
  requireStaffRole,
  body('title').optional().isString().trim().isLength({ min: 3, max: 160 }).withMessage('title invalido'),
  body('description').optional().isString().trim().isLength({ min: 10, max: 5000 }).withMessage('description invalida'),
  body('location').optional().isString().trim().isLength({ min: 2, max: 120 }).withMessage('location invalida'),
  body('status').optional().isIn(['DRAFT', 'VALIDATED', 'OPEN', 'CLOSED', 'REJECTED']).withMessage('status invalido'),
  body('isActive').optional().isBoolean().withMessage('isActive invalido'),
  handleValidationErrors,
  JobsController.update
)

router.post(
  '/matching',
  authenticateToken,
  body('anonymousCode').matches(/^V\d{4}$/i).withMessage('anonymousCode inválido'),
  handleValidationErrors,
  JobsController.getMatching
)

router.post(
  '/:id/match',
  authenticateToken,
  requireStaffRole,
  JobsController.generateMatches
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
