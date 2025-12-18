import express from 'express';
import {
    getMenuItems,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    updateMenuItemStatus,
} from '../controllers/menuItemController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Public routes

/**
 * @swagger
 * /api/menu-items:
 *   get:
 *     tags: [Menu Items]
 *     summary: Get all menu items
 *     description: Get menu items with filtering, search, sorting, and pagination
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and description
 *       - in: query
 *         name: isAvailable
 *         schema:
 *           type: boolean
 *         description: Filter by availability
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, price, -price, createdAt, -createdAt]
 *         description: Sort field (prefix with - for descending)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of menu items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MenuItem'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get('/', getMenuItems);

/**
 * @swagger
 * /api/menu-items/{id}:
 *   get:
 *     tags: [Menu Items]
 *     summary: Get menu item by ID
 *     description: Get detailed information about a specific menu item
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu item ID
 *     responses:
 *       200:
 *         description: Menu item details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MenuItem'
 *       404:
 *         description: Menu item not found
 */
router.get('/:id', getMenuItem);

// Admin only routes

/**
 * @swagger
 * /api/menu-items:
 *   post:
 *     tags: [Menu Items]
 *     summary: Create menu item
 *     description: Create a new menu item (Admin only)
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
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 example: Grilled Salmon
 *               description:
 *                 type: string
 *                 example: Fresh salmon with herbs
 *               price:
 *                 type: number
 *                 example: 25.99
 *               categoryId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               imageUrl:
 *                 type: string
 *                 example: https://example.com/salmon.jpg
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *               modifiers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Size
 *                     required:
 *                       type: boolean
 *                       example: false
 *                     options:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: Large
 *                           priceAdjustment:
 *                             type: number
 *                             example: 5
 *     responses:
 *       201:
 *         description: Menu item created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.post('/', protect, authorize('admin', 'super_admin'), createMenuItem);

/**
 * @swagger
 * /api/menu-items/{id}:
 *   put:
 *     tags: [Menu Items]
 *     summary: Update menu item
 *     description: Update an existing menu item (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               isAvailable:
 *                 type: boolean
 *               modifiers:
 *                 type: array
 *     responses:
 *       200:
 *         description: Menu item updated
 *       404:
 *         description: Menu item not found
 */
router.put('/:id', protect, authorize('admin', 'super_admin'), updateMenuItem);

/**
 * @swagger
 * /api/menu-items/{id}/status:
 *   patch:
 *     tags: [Menu Items]
 *     summary: Update menu item status
 *     description: Update availability status of a menu item (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isAvailable
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', protect, authorize('admin', 'super_admin'), updateMenuItemStatus);

/**
 * @swagger
 * /api/menu-items/{id}:
 *   delete:
 *     tags: [Menu Items]
 *     summary: Delete menu item
 *     description: Delete a menu item (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu item deleted
 *       404:
 *         description: Menu item not found
 */
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteMenuItem);

export default router;
