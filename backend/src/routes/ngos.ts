import express from 'express';
import { authenticateToken, requireAdminRole, requireStaffRole } from '../middleware/security';
import NGOController from '../controllers/NGOController';

const router = express.Router();

// Get all NGOs
router.get('/', authenticateToken, requireStaffRole, NGOController.getAll);

// Get NGO by ID
router.get('/:id', authenticateToken, requireStaffRole, NGOController.getById);

// Create NGO
router.post('/', authenticateToken, requireAdminRole, NGOController.create);

// Update NGO
router.put('/:id', authenticateToken, requireAdminRole, NGOController.update);

// Deactivate NGO
router.patch('/:id/deactivate', authenticateToken, requireAdminRole, NGOController.deactivate);

// Delete NGO
router.delete('/:id', authenticateToken, requireAdminRole, NGOController.delete);

export default router;
