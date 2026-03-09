import express from 'express';
import { authenticateToken, requireAdminRole, requireStaffRole } from '../middleware/security';
import AuditLogController from '../controllers/AuditLogController';

const router = express.Router();

// Get all audit logs with filtering
router.get('/', authenticateToken, requireStaffRole, AuditLogController.getAll);

// Get audit logs by user
router.get('/user/:userCode', authenticateToken, requireStaffRole, AuditLogController.getByUser);

// Get audit logs by action
router.get('/action/:action', authenticateToken, requireStaffRole, AuditLogController.getByAction);

// Get audit logs by table
router.get('/table/:tableName', authenticateToken, requireStaffRole, AuditLogController.getByTable);

// Create audit log
router.post('/', authenticateToken, requireStaffRole, AuditLogController.create);

// Get audit log statistics
router.get('/stats', authenticateToken, requireAdminRole, AuditLogController.getStats);

export default router;
