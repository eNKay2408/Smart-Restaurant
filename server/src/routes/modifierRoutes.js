import express from 'express';
import { body } from 'express-validator';
import {
    getModifiers,
    getModifier,
    createModifier,
    updateModifier,
    deleteModifier,
    toggleModifierStatus,
    getModifiersByMenuItem,
} from '../controllers/modifierController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validator.js';

const router = express.Router();

// Validation rules
const createModifierValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Modifier name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('type')
        .notEmpty()
        .withMessage('Modifier type is required')
        .isIn(['single', 'multiple'])
        .withMessage('Type must be either single or multiple'),
    body('required')
        .optional()
        .isBoolean()
        .withMessage('Required must be a boolean'),
    body('displayOrder')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Display order must be a non-negative integer'),
    body('options')
        .isArray({ min: 1 })
        .withMessage('At least one option is required'),
    body('options.*.name')
        .trim()
        .notEmpty()
        .withMessage('Option name is required'),
    body('options.*.priceAdjustment')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price adjustment must be a non-negative number'),
    body('options.*.isDefault')
        .optional()
        .isBoolean()
        .withMessage('isDefault must be a boolean'),
    body('options.*.isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
    body('restaurantId')
        .optional()
        .isMongoId()
        .withMessage('Invalid restaurant ID'),
];

const updateModifierValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('type')
        .optional()
        .isIn(['single', 'multiple'])
        .withMessage('Type must be either single or multiple'),
    body('required')
        .optional()
        .isBoolean()
        .withMessage('Required must be a boolean'),
    body('displayOrder')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Display order must be a non-negative integer'),
    body('options')
        .optional()
        .isArray({ min: 1 })
        .withMessage('At least one option is required'),
    body('options.*.name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Option name is required'),
    body('options.*.priceAdjustment')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price adjustment must be a non-negative number'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
];

// Public routes

/**
 * @swagger
 * /api/modifiers:
 *   get:
 *     tags: [Modifiers]
 *     summary: Get all modifiers
 *     description: Retrieve all modifiers with optional filtering
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
 *         description: List of modifiers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Modifier'
 */
router.get('/', getModifiers);

/**
 * @swagger
 * /api/modifiers/menu-item/{menuItemId}:
 *   get:
 *     tags: [Modifiers]
 *     summary: Get modifiers for a menu item
 *     description: Retrieve modifiers applicable to a specific menu item
 *     parameters:
 *       - in: path
 *         name: menuItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu item ID
 *     responses:
 *       200:
 *         description: List of modifiers for the menu item
 */
router.get('/menu-item/:menuItemId', getModifiersByMenuItem);

/**
 * @swagger
 * /api/modifiers/{id}:
 *   get:
 *     tags: [Modifiers]
 *     summary: Get single modifier
 *     description: Retrieve a specific modifier by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Modifier ID
 *     responses:
 *       200:
 *         description: Modifier details
 *       404:
 *         description: Modifier not found
 */
router.get('/:id', getModifier);

// Admin only routes

/**
 * @swagger
 * /api/modifiers:
 *   post:
 *     tags: [Modifiers]
 *     summary: Create modifier
 *     description: Create a new modifier (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - options
 *               - restaurantId
 *             properties:
 *               name:
 *                 type: string
 *                 example: Size
 *               type:
 *                 type: string
 *                 enum: [single, multiple]
 *                 example: single
 *               required:
 *                 type: boolean
 *                 example: false
 *               displayOrder:
 *                 type: number
 *                 example: 1
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Large
 *                     priceAdjustment:
 *                       type: number
 *                       example: 5
 *                     isDefault:
 *                       type: boolean
 *                       example: false
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *               restaurantId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *     responses:
 *       201:
 *         description: Modifier created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', protect, authorize('admin', 'super_admin'), createModifierValidation, validate, createModifier);

/**
 * @swagger
 * /api/modifiers/{id}:
 *   put:
 *     tags: [Modifiers]
 *     summary: Update modifier
 *     description: Update an existing modifier (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Modifier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [single, multiple]
 *               required:
 *                 type: boolean
 *               displayOrder:
 *                 type: number
 *               options:
 *                 type: array
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Modifier updated successfully
 *       404:
 *         description: Modifier not found
 */
router.put('/:id', protect, authorize('admin', 'super_admin'), updateModifierValidation, validate, updateModifier);

/**
 * @swagger
 * /api/modifiers/{id}/toggle:
 *   patch:
 *     tags: [Modifiers]
 *     summary: Toggle modifier status
 *     description: Toggle active/inactive status of a modifier (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Modifier ID
 *     responses:
 *       200:
 *         description: Status toggled successfully
 *       404:
 *         description: Modifier not found
 */
router.patch('/:id/toggle', protect, authorize('admin', 'super_admin'), toggleModifierStatus);

/**
 * @swagger
 * /api/modifiers/{id}:
 *   delete:
 *     tags: [Modifiers]
 *     summary: Delete modifier
 *     description: Delete a modifier (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Modifier ID
 *     responses:
 *       200:
 *         description: Modifier deleted successfully
 *       404:
 *         description: Modifier not found
 */
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteModifier);

export default router;
