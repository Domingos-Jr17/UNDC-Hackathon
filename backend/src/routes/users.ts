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
  body('ngoId').isString().notEmpty().withMessage('ngoId é obrigatório'),
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

export default router
