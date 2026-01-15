import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser
} from '../controllers/userController.js';

const router = express.Router();

//==============================================================================
// User Management Routes (Admin Only)
//==============================================================================

/**
 * @route   GET /api/users
 * @desc    Get all users (staff only)
 * @access  Private/Admin
 */
router.get('/', protect, authorize('admin'), getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user
 * @access  Private/Admin
 */
router.get('/:id', protect, authorize('admin'), getUser);

/**
 * @route   POST /api/users
 * @desc    Create new staff user (waiter or kitchen)
 * @access  Private/Admin
 */
router.post('/', protect, authorize('admin'), createUser);

/**
 * @route   PATCH /api/users/:id
 * @desc    Update user
 * @access  Private/Admin
 */
router.patch('/:id', protect, authorize('admin'), updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), deleteUser);

export default router;
