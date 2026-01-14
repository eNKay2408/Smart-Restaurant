import express from 'express';
import { body } from 'express-validator';
import {
    createReview,
    getMenuItemReviews,
    getMyReviews,
    checkCanReview,
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validator.js';

const router = express.Router();

// Validation rules
const createReviewValidation = [
    body('menuItemId').notEmpty().withMessage('Menu item ID is required'),
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    body('comment')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Comment cannot exceed 500 characters'),
];

// Public routes
router.get('/menu-item/:menuItemId', getMenuItemReviews);

// Protected routes (Customer only)
router.post(
    '/',
    protect,
    authorize('customer'),
    createReviewValidation,
    validate,
    createReview
);

router.get('/my-reviews', protect, authorize('customer'), getMyReviews);

router.get('/can-review/:orderId', protect, authorize('customer'), checkCanReview);

export default router;
