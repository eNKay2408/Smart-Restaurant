import express from 'express';
import { body } from 'express-validator';
import {
    getPromotions,
    getPromotion,
    createPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotionStatus,
    validatePromotionCode,
    applyPromotion,
} from '../controllers/promotionController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validator.js';

const router = express.Router();

// Validation rules
const createPromotionValidation = [
    body('code')
        .trim()
        .notEmpty()
        .withMessage('Promotion code is required')
        .isLength({ min: 3, max: 20 })
        .withMessage('Code must be between 3 and 20 characters')
        .matches(/^[A-Z0-9]+$/)
        .withMessage('Code must contain only uppercase letters and numbers'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    body('discountType')
        .notEmpty()
        .withMessage('Discount type is required')
        .isIn(['percentage', 'fixed'])
        .withMessage('Discount type must be either percentage or fixed'),
    body('discountValue')
        .notEmpty()
        .withMessage('Discount value is required')
        .isFloat({ min: 0 })
        .withMessage('Discount value must be a positive number'),
    body('minOrderAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum order amount must be a positive number'),
    body('maxDiscountAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum discount amount must be a positive number'),
    body('startDate')
        .notEmpty()
        .withMessage('Start date is required')
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    body('endDate')
        .notEmpty()
        .withMessage('End date is required')
        .isISO8601()
        .withMessage('End date must be a valid date'),
    body('usageLimit')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Usage limit must be at least 1'),
    body('restaurantId')
        .notEmpty()
        .withMessage('Restaurant ID is required')
        .isMongoId()
        .withMessage('Invalid restaurant ID'),
    body('applicableCategories')
        .optional()
        .isArray()
        .withMessage('Applicable categories must be an array'),
    body('applicableMenuItems')
        .optional()
        .isArray()
        .withMessage('Applicable menu items must be an array'),
];

const updatePromotionValidation = [
    body('code')
        .optional()
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Code must be between 3 and 20 characters')
        .matches(/^[A-Z0-9]+$/)
        .withMessage('Code must contain only uppercase letters and numbers'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    body('discountType')
        .optional()
        .isIn(['percentage', 'fixed'])
        .withMessage('Discount type must be either percentage or fixed'),
    body('discountValue')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Discount value must be a positive number'),
    body('minOrderAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum order amount must be a positive number'),
    body('maxDiscountAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum discount amount must be a positive number'),
    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date'),
    body('usageLimit')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Usage limit must be at least 1'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
];

const validateCodeValidation = [
    body('code')
        .trim()
        .notEmpty()
        .withMessage('Promotion code is required'),
    body('orderAmount')
        .notEmpty()
        .withMessage('Order amount is required')
        .isFloat({ min: 0 })
        .withMessage('Order amount must be a positive number'),
    body('restaurantId')
        .notEmpty()
        .withMessage('Restaurant ID is required')
        .isMongoId()
        .withMessage('Invalid restaurant ID'),
];

// Public routes

/**
 * @swagger
 * /api/promotions/validate:
 *   post:
 *     tags: [Promotions]
 *     summary: Validate promotion code
 *     description: Check if a promotion code is valid and calculate discount
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - orderAmount
 *               - restaurantId
 *             properties:
 *               code:
 *                 type: string
 *                 example: SAVE10
 *               orderAmount:
 *                 type: number
 *                 example: 100
 *               restaurantId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Promotion code is valid
 *       400:
 *         description: Invalid or expired promotion code
 *       404:
 *         description: Promotion code not found
 */
router.post('/validate', validateCodeValidation, validate, validatePromotionCode);

// Admin only routes

/**
 * @swagger
 * /api/promotions:
 *   get:
 *     tags: [Promotions]
 *     summary: Get all promotions
 *     description: Retrieve all promotions (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         schema:
 *           type: string
 *         description: Filter by restaurant ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of promotions
 *       401:
 *         description: Unauthorized
 */
router.get('/', protect, authorize('admin', 'super_admin'), getPromotions);

/**
 * @swagger
 * /api/promotions/{id}:
 *   get:
 *     tags: [Promotions]
 *     summary: Get single promotion
 *     description: Retrieve a specific promotion by ID (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promotion ID
 *     responses:
 *       200:
 *         description: Promotion details
 *       404:
 *         description: Promotion not found
 */
router.get('/:id', protect, authorize('admin', 'super_admin'), getPromotion);

/**
 * @swagger
 * /api/promotions:
 *   post:
 *     tags: [Promotions]
 *     summary: Create promotion
 *     description: Create a new promotion (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - description
 *               - discountType
 *               - discountValue
 *               - startDate
 *               - endDate
 *               - restaurantId
 *             properties:
 *               code:
 *                 type: string
 *                 example: SAVE10
 *               description:
 *                 type: string
 *                 example: Save 10% on your order
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 example: percentage
 *               discountValue:
 *                 type: number
 *                 example: 10
 *               minOrderAmount:
 *                 type: number
 *                 example: 50
 *               maxDiscountAmount:
 *                 type: number
 *                 example: 20
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               usageLimit:
 *                 type: number
 *                 example: 100
 *               restaurantId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Promotion created successfully
 *       400:
 *         description: Validation error or duplicate code
 */
router.post('/', protect, authorize('admin', 'super_admin'), createPromotionValidation, validate, createPromotion);

/**
 * @swagger
 * /api/promotions/{id}:
 *   put:
 *     tags: [Promotions]
 *     summary: Update promotion
 *     description: Update an existing promotion (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promotion ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Promotion updated successfully
 *       404:
 *         description: Promotion not found
 */
router.put('/:id', protect, authorize('admin', 'super_admin'), updatePromotionValidation, validate, updatePromotion);

/**
 * @swagger
 * /api/promotions/{id}/toggle:
 *   patch:
 *     tags: [Promotions]
 *     summary: Toggle promotion status
 *     description: Toggle active/inactive status (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promotion ID
 *     responses:
 *       200:
 *         description: Status toggled successfully
 */
router.patch('/:id/toggle', protect, authorize('admin', 'super_admin'), togglePromotionStatus);

/**
 * @swagger
 * /api/promotions/{id}/apply:
 *   post:
 *     tags: [Promotions]
 *     summary: Apply promotion
 *     description: Increment usage count when promotion is applied (Private)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promotion ID
 *     responses:
 *       200:
 *         description: Promotion applied successfully
 */
router.post('/:id/apply', protect, applyPromotion);

/**
 * @swagger
 * /api/promotions/{id}:
 *   delete:
 *     tags: [Promotions]
 *     summary: Delete promotion
 *     description: Delete a promotion (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promotion ID
 *     responses:
 *       200:
 *         description: Promotion deleted successfully
 */
router.delete('/:id', protect, authorize('admin', 'super_admin'), deletePromotion);

export default router;
