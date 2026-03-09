import express from 'express'
import DashboardController from '../controllers/DashboardController'
import { authenticateToken, requireStaffRole } from '../middleware/security'

const router = express.Router()

router.get('/stats', authenticateToken, requireStaffRole, DashboardController.getStats)
router.get('/activity', authenticateToken, requireStaffRole, DashboardController.getActivity)

export default router
