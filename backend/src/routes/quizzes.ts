import express from 'express'
import { body } from 'express-validator'
import QuizController from '../controllers/QuizController'
import { authenticateToken, handleValidationErrors, userRateLimit } from '../middleware/security'

const router = express.Router()

router.post(
  '/submit',
  authenticateToken,
  userRateLimit(),
  body('anonymousCode').matches(/^V\d{4}$/i).withMessage('anonymousCode invalido'),
  body('courseId').isString().trim().isLength({ min: 2, max: 120 }).withMessage('courseId invalido'),
  body('answers').isArray({ min: 1 }).withMessage('answers invalido'),
  body('answers.*').isInt({ min: 0 }).withMessage('resposta invalida'),
  handleValidationErrors,
  QuizController.submit
)

export default router
