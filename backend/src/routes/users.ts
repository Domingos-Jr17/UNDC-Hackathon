import express from 'express'
import UsersController from '../controllers/UsersController'
import { authenticateToken, handleValidationErrors, requireStaffRole } from '../middleware/security'
import { body } from 'express-validator'

const router = express.Router()

router.get('/', authenticateToken, requireStaffRole, UsersController.list)
router.get('/:id', authenticateToken, requireStaffRole, UsersController.getById)
router.get('/:id/progress', authenticateToken, requireStaffRole, UsersController.getUserProgress)
router.get('/:id/certificates', authenticateToken, requireStaffRole, UsersController.getUserCertificates)

router.post('/generate-code', authenticateToken, requireStaffRole, UsersController.generateCode)

router.post(
  '/activate',
  authenticateToken,
  requireStaffRole,
  body('ngoId').isString().trim().matches(/^(ngo|ong)-\d{3}$/i).withMessage('ngoId invalido'),
  body('phone').optional().matches(/^\+?\d{8,15}$/).withMessage('phone invalido'),
  body('dateOfBirth').optional().isISO8601().withMessage('dateOfBirth invalido'),
  body('initialSkills').optional().isString().isLength({ max: 500 }).withMessage('initialSkills invalido'),
  body('location').optional().isString().isLength({ max: 120 }).withMessage('location invalido'),
  handleValidationErrors,
  UsersController.activate
)

router.post(
  '/',
  authenticateToken,
  requireStaffRole,
  body('ngoId').isString().trim().matches(/^(ngo|ong)-\d{3}$/i).withMessage('ngoId invalido'),
  body('phone').optional().matches(/^\+?\d{8,15}$/).withMessage('phone invalido'),
  body('dateOfBirth').optional().isISO8601().withMessage('dateOfBirth invalido'),
  body('initialSkills').optional().isString().isLength({ max: 500 }).withMessage('initialSkills invalido'),
  body('location').optional().isString().isLength({ max: 120 }).withMessage('location invalido'),
  handleValidationErrors,
  UsersController.activate
)

router.patch(
  '/:id/activation',
  authenticateToken,
  requireStaffRole,
  body('active').isBoolean().withMessage('active deve ser boolean'),
  handleValidationErrors,
  UsersController.setActivation
)

router.put(
  '/:id',
  authenticateToken,
  requireStaffRole,
  body('ngoId').optional().isString().trim().matches(/^(ngo|ong)-\d{3}$/i).withMessage('ngoId invalido'),
  body('phone').optional({ nullable: true }).matches(/^\+?\d{8,15}$/).withMessage('phone invalido'),
  body('dateOfBirth').optional({ nullable: true }).isISO8601().withMessage('dateOfBirth invalido'),
  body('initialSkills').optional({ nullable: true }).isString().isLength({ max: 500 }).withMessage('initialSkills invalido'),
  body('location').optional({ nullable: true }).isString().isLength({ max: 120 }).withMessage('location invalido'),
  handleValidationErrors,
  UsersController.update
)

export default router

