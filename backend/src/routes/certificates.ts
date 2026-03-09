import express from 'express';
import { authenticateToken, userRateLimit } from '../middleware/security';
import CertificateController from '../controllers/CertificateController';

const router = express.Router();

// Generate certificate
router.post('/generate', authenticateToken, userRateLimit(), CertificateController.generate);

// Verify certificate
router.get('/verify/:code', CertificateController.verify);

// Revoke certificate
router.post('/revoke/:code', authenticateToken, userRateLimit(), CertificateController.revoke);

// Get certificate by user and course
router.get('/user/:anonymousCode/course/:courseId', authenticateToken, userRateLimit(), CertificateController.getByUserAndCourse);

// List certificates by user
router.get('/user/:anonymousCode', authenticateToken, userRateLimit(), CertificateController.getByUser);

// Admin routes
router.post('/', authenticateToken, userRateLimit(), CertificateController.create);
router.put('/:code', authenticateToken, userRateLimit(), CertificateController.update);
router.delete('/:code', authenticateToken, userRateLimit(), CertificateController.delete);

export default router;
