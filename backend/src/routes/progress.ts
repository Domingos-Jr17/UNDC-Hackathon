import express from 'express';
import { authenticateToken } from '../middleware/security';
import ProgressController from '../controllers/ProgressController';

const router = express.Router();

// Get aggregated user progress across all courses
router.get('/user/:userCode', authenticateToken, ProgressController.getUserAggregate);

// Get user progress for a course
router.get('/user/:userCode/course/:courseId', authenticateToken, ProgressController.getUserProgress);

// Update user progress for a course
router.put('/user/:userCode/course/:courseId', authenticateToken, ProgressController.updateProgress);

export default router;
