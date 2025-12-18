import express from 'express';
import {
    getTables,
    getTable,
    createTable,
    updateTable,
    regenerateQRCode,
    deleteTable,
    verifyQRCode,
} from '../controllers/tableController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/verify-qr/:token', verifyQRCode);

// Protected routes
router.get('/', protect, authorize('admin', 'waiter', 'super_admin'), getTables);
router.get('/:id', protect, authorize('admin', 'waiter', 'super_admin'), getTable);

// Admin only routes
router.post('/', protect, authorize('admin', 'super_admin'), createTable);
router.put('/:id', protect, authorize('admin', 'super_admin'), updateTable);
router.post('/:id/regenerate-qr', protect, authorize('admin', 'super_admin'), regenerateQRCode);
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteTable);

export default router;
