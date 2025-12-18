import express from 'express';
import {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
} from '../controllers/categoryController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategory);

// Admin only routes
router.post('/', protect, authorize('admin', 'super_admin'), createCategory);
router.put('/:id', protect, authorize('admin', 'super_admin'), updateCategory);
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteCategory);

export default router;
